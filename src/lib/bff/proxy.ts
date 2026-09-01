import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  CART_SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  cartSessionCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies";
import {getServerEnv} from "@/lib/config/env";
import {envelope, normalizeMessage} from "@/lib/api/envelope";
import {STATIC_MESSAGE_KEYS, type ApiError, type ApiResponse} from "@/lib/api/contracts/common";
import {refreshTokenRequestSchema} from "@/features/auth/contracts/requests";

type BffService = "backend" | "ai";
type UpstreamResult = {status: number; payload: unknown; body?: Uint8Array; contentType?: string};

const UPSTREAM_TIMEOUT_MS = 15_000;
const AUTH_TOKEN_PATHS = new Set(["auth/login", "auth/google", "auth/verify-otp", "auth/refresh-token"]);

function jsonBody(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnvelope(value: unknown): value is ApiResponse<unknown> {
  return isRecord(value) && "message" in value && typeof value.message === "string" && Array.isArray(value.errors);
}

function parsePath(pathSegments: string[], search: string) {
  const path = `/${pathSegments.map((segment) => encodeURIComponent(segment)).join("/")}`;
  return `${path}${search}`;
}

function upstreamBaseUrl(service: BffService) {
  const env = getServerEnv();
  return service === "backend" ? env.BACKEND_API_URL : env.AI_API_URL;
}

function serviceUnavailableKey(service: BffService) {
  return service === "backend" ? STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE : STATIC_MESSAGE_KEYS.AI_BACKEND_UNAVAILABLE;
}

function buildHeaders(request: Request, accessToken: string | undefined, sessionToken: string | undefined, body: Uint8Array | undefined) {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const requestId = request.headers.get("x-request-id");
  if (requestId) headers.set("X-Request-ID", requestId);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (sessionToken) headers.set("X-Cart-Session", sessionToken);
  if (body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return headers;
}

async function requestUpstream(
  request: Request,
  service: BffService,
  upstreamPath: string,
  body: Uint8Array | undefined,
  accessToken: string | undefined,
  sessionToken: string | undefined,
): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${upstreamBaseUrl(service)}${upstreamPath}`, {
      method: request.method,
      headers: buildHeaders(request, accessToken, sessionToken, body),
      body: body && !["GET", "HEAD"].includes(request.method) ? (body as unknown as BodyInit) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return {
        status: response.status,
        payload: null,
        body: new Uint8Array(await response.arrayBuffer()),
        contentType,
      };
    }
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }
    return {status: response.status, payload};
  } finally {
    clearTimeout(timeout);
  }
}

function toEnvelope(result: UpstreamResult, service: BffService): ApiResponse<unknown> {
  if (isEnvelope(result.payload)) {
    return {
      data: result.payload.data ?? null,
      message: normalizeMessage(result.payload.message, serviceUnavailableKey(service)),
      errors: result.payload.errors,
    };
  }

  const errors: ApiError[] = [
    {
      code: "MALFORMED_UPSTREAM_RESPONSE",
      message: "The upstream service returned an invalid API envelope.",
    },
  ];
  return envelope(null, serviceUnavailableKey(service), errors);
}

function tokenData(payload: unknown) {
  if (!isEnvelope(payload) || !isRecord(payload.data)) return null;
  const accessToken = typeof payload.data.accessToken === "string" ? payload.data.accessToken : undefined;
  const refreshToken = typeof payload.data.refreshToken === "string" ? payload.data.refreshToken : undefined;
  if (!accessToken && !refreshToken) return null;
  return {accessToken, refreshToken};
}

function withoutTokens(payload: ApiResponse<unknown>): ApiResponse<unknown> {
  if (!isRecord(payload.data)) return payload;
  const data = {...payload.data};
  delete data.accessToken;
  delete data.refreshToken;
  return {...payload, data};
}

function setAuthCookies(response: NextResponse, tokens: {accessToken?: string; refreshToken?: string}) {
  if (tokens.accessToken) response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessTokenCookieOptions);
  if (tokens.refreshToken) response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions);
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

export async function handleBffRequest(request: Request, service: BffService, pathSegments: string[]) {
  if (request.method === "OPTIONS") return new NextResponse(null, {status: 204});

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionToken = cookieStore.get(CART_SESSION_COOKIE)?.value;
  const pathWithoutQuery = pathSegments.join("/");
  const upstreamPath = parsePath(pathSegments, new URL(request.url).search);
  const bodyBuffer = ["GET", "HEAD"].includes(request.method) ? undefined : new Uint8Array(await request.arrayBuffer());

  // A guest cart must have an owner before the first read or mutation. The
  // backend deliberately rejects an anonymous cart request without either an
  // account or a session token, so mint the browser session before forwarding
  // the request instead of waiting for a successful mutation (which can never
  // happen without the token). The cookie is only issued for cart routes and
  // is never used when an authenticated account owns the cart.
  const guestCartSession =
    service === "backend" &&
    pathWithoutQuery.startsWith("cart") &&
    !accessToken &&
    !sessionToken
      ? crypto.randomUUID()
      : undefined;
  const outboundSessionToken = sessionToken ?? guestCartSession;

  let requestBody = bodyBuffer;
  if (service === "backend" && pathWithoutQuery === "auth/refresh-token" && refreshToken) {
    requestBody = jsonBody(refreshTokenRequestSchema.parse({refreshToken}));
  }
  if (service === "backend" && pathWithoutQuery === "auth/logout" && refreshToken && (!requestBody || requestBody.byteLength === 0)) {
    requestBody = jsonBody(refreshTokenRequestSchema.parse({refreshToken}));
  }

  let result: UpstreamResult;
  try {
    result = await requestUpstream(request, service, upstreamPath, requestBody, AUTH_TOKEN_PATHS.has(pathWithoutQuery) ? undefined : accessToken, outboundSessionToken);
  } catch {
    return NextResponse.json(envelope(null, serviceUnavailableKey(service), [{code: "UPSTREAM_UNREACHABLE"}]), {status: 503});
  }

  if (result.body) {
    const headers = new Headers();
    if (result.contentType) headers.set("Content-Type", result.contentType);
    return new NextResponse(result.body as BodyInit, {status: result.status, headers});
  }

  let parsed = toEnvelope(result, service);
  let refreshed = false;

  if (service === "backend" && result.status === 401 && refreshToken && !AUTH_TOKEN_PATHS.has(pathWithoutQuery) && pathWithoutQuery !== "auth/logout") {
    try {
      const refreshRequest = new Request(request.url, {method: "POST", headers: {"content-type": "application/json"}});
      const refreshResult = await requestUpstream(
        refreshRequest,
        "backend",
        "/auth/refresh-token",
        jsonBody(refreshTokenRequestSchema.parse({refreshToken})),
        undefined,
        undefined,
      );
      const refreshPayload = toEnvelope(refreshResult, "backend");
      const tokens = tokenData(refreshResult.payload);
      if (refreshResult.status < 300 && tokens?.accessToken) {
        accessToken = tokens.accessToken;
        refreshed = true;
        result = await requestUpstream(request, service, upstreamPath, requestBody, accessToken, outboundSessionToken);
        parsed = toEnvelope(result, service);
      } else {
        parsed = refreshPayload;
      }
    } catch {
      parsed = envelope(null, STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE, [{code: "TOKEN_REFRESH_FAILED"}]);
    }
  }

  const isAuthTokenResponse = service === "backend" && AUTH_TOKEN_PATHS.has(pathWithoutQuery);
  const isSuccessfulAuth = isAuthTokenResponse && result.status >= 200 && result.status < 300;
  const responsePayload = isSuccessfulAuth ? withoutTokens(parsed) : parsed;
  const response = NextResponse.json(responsePayload, {status: isEnvelope(result.payload) ? result.status : 502});

  if (isSuccessfulAuth) {
    const tokens = tokenData(result.payload);
    if (tokens) setAuthCookies(response, tokens);
  }
  if (refreshed) {
    const tokens = tokenData(parsed);
    if (tokens) setAuthCookies(response, tokens);
  }
  if (service === "backend" && pathWithoutQuery === "auth/logout" && (result.status < 300 || result.status === 401)) {
    clearAuthCookies(response);
  }

  if (guestCartSession && result.status < 300) {
    response.cookies.set(CART_SESSION_COOKIE, guestCartSession, cartSessionCookieOptions);
  }

  return response;
}
