import {BuilderPage} from "@/features/pc-builder/builder-page";
import {selectionSchema, type Selection} from "@/features/pc-builder/contracts";

export default async function BuildPcPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const {build} = await searchParams;
  let initialSelection: Selection = {};
  let invalidLink = false;
  if (build) {
    try { initialSelection = selectionSchema.parse(JSON.parse(String(build))); }
    catch { invalidLink = true; }
  }
  return <BuilderPage initialSelection={initialSelection} invalidLink={invalidLink} />;
}
