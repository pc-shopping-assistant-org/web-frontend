import { ApiClientError, normalizeMessage, parseApiResponse } from "./envelope";
import { STATIC_MESSAGE_KEYS, type ApiResponse } from "./contracts/common";

type FetchOptions = RequestInit & { service?: "backend" | "ai" };

function resolveUrl(path: string, service: "backend" | "ai") {
  if (path.startsWith("/api/")) return path;
  return `/api/${service}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const service = options.service ?? "backend";
  const init = { ...options };
  delete init.service;
  const isFormDataBody =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(resolveUrl(path, service), {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body && !isFormDataBody
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      503,
      service === "ai"
        ? STATIC_MESSAGE_KEYS.AI_BACKEND_UNAVAILABLE
        : STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE,
      [
        {
          code: "BFF_UNREACHABLE",
          message: "The frontend BFF could not be reached.",
        },
      ],
    );
  }
  const payload = await readJson(response);

  if (!payload) {
    throw new ApiClientError(
      response.status || 502,
      STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE,
    );
  }

  let parsed: ApiResponse<unknown>;
  try {
    parsed = parseApiResponse(payload);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError(
      response.status || 502,
      STATIC_MESSAGE_KEYS.SERVICE_UNAVAILABLE,
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      normalizeMessage(parsed.message, STATIC_MESSAGE_KEYS.UNKNOWN),
      parsed.errors,
    );
  }

  return parsed.data as T;
}

export function backendFetch<T>(
  path: string,
  options?: Omit<FetchOptions, "service">,
) {
  return apiFetch<T>(path, { ...options, service: "backend" });
}

export function aiFetch<T>(
  path: string,
  options?: Omit<FetchOptions, "service">,
) {
  return apiFetch<T>(path, { ...options, service: "ai" });
}
