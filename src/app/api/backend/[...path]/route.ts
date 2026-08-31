import {handleBffRequest} from "@/lib/bff/proxy";

type RouteContext = {params: Promise<{path: string[]}>};

async function handle(request: Request, context: RouteContext) {
  const {path} = await context.params;
  return handleBffRequest(request, "backend", path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
