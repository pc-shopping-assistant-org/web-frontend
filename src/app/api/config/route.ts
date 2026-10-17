import {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
import type {PublicConfig} from "@/lib/config/public-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const data: PublicConfig = {googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null};
  return Response.json({data, message: STATIC_MESSAGE_KEYS.SUCCESS, errors: []}, {
    headers: {"Cache-Control": "no-store"},
  });
}
