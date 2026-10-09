import {candidatesRequestSchema} from "@/features/pc-builder/contracts";
import {validateCandidates} from "@/features/pc-builder/service";

export async function POST(request: Request) {
  const parsed = candidatesRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({data: null, message: "PC_BUILD_INVALID_REQUEST", errors: [{code: "INVALID_INPUT"}]}, {status: 400});
  try {
    return Response.json({data: validateCandidates(parsed.data.selection, parsed.data.slot), message: "PC_BUILD_VALIDATED", errors: []});
  } catch {
    return Response.json({data: null, message: "PC_BUILD_INVALID_SELECTION", errors: [{field: "selection", code: "INVALID_COMPONENT_SELECTION"}]}, {status: 400});
  }
}
