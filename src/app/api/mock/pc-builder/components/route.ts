import {z} from "zod";

import {slots} from "@/features/pc-builder/contracts";
import {components} from "@/features/pc-builder/fixtures";

export function GET(request: Request) {
  const slot = z.enum(slots).safeParse(new URL(request.url).searchParams.get("slot"));
  if (!slot.success) return Response.json({data: null, message: "PC_BUILD_INVALID_REQUEST", errors: [{field: "slot", code: "INVALID_SLOT"}]}, {status: 400});
  return Response.json({data: components.filter(p => p.slot === slot.data), message: "PC_BUILD_COMPONENTS_FOUND", errors: []});
}
