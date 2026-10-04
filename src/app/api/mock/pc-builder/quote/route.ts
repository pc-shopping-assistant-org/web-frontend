import {buildRequestSchema} from "@/features/pc-builder/contracts";
import {quoteBuild} from "@/features/pc-builder/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = buildRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({data: null, message: "PC_BUILD_INVALID_REQUEST", errors: parsed.error.issues.map(issue => ({field: issue.path.join("."), code: "INVALID_INPUT", message: issue.message}))}, {status: 400});
  try {
    return Response.json({data: quoteBuild(parsed.data.selection), message: "PC_BUILD_QUOTED", errors: []});
  } catch {
    return Response.json({data: null, message: "PC_BUILD_INVALID_SELECTION", errors: [{field: "selection", code: "INVALID_COMPONENT_SELECTION"}]}, {status: 400});
  }
}
