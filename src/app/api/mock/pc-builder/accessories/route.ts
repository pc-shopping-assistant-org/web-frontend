import {optionalSlots} from "@/features/pc-builder/contracts";
import {components} from "@/features/pc-builder/fixtures";

export function GET() {
  return Response.json({data: components.filter(part => optionalSlots.includes(part.slot) && part.quantity > 0), message: "PC_BUILD_ACCESSORIES_FOUND", errors: []});
}
