import {components} from "@/features/pc-builder/fixtures";

export function GET() {
  return Response.json({
    data: components.filter((p) => ["MOUSE", "KEYBOARD", "MONITOR", "HEADSET"].includes(p.slot) && p.quantity > 0),
    message: "PC_BUILD_ACCESSORIES_FOUND",
    errors: [],
  });
}
