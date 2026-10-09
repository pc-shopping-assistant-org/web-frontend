import {afterEach, describe, expect, it, vi} from "vitest";

import {buildCategoryTree} from "@/features/catalog/mappers";
import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {createBrand, deleteCategory, getAdminCategories, updateBrand} from "./api";

afterEach(() => vi.restoreAllMocks());

function stubFetch(...payloads: unknown[]) {
  const queue = [...payloads];
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: queue.shift() ?? null, message: "SUCCESS", errors: []}), {
      status: 200,
      headers: {"content-type": "application/json"},
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const category = (id: string, parentId: string | null = null) => ({id, name: id, seoName: id, status: "ACTIVE", parentId});
const brand = (status: string) => ({id: "b1", name: "Asus", seoName: "asus", status, imageUrl: "http://img/a.png"});

describe("category tree", () => {
  it("is rebuilt from the flat admin list and keeps orphans at the root", () => {
    const tree = buildCategoryTree([category("child", "root"), category("root"), category("orphan", "missing")]);

    expect(tree.map((node) => node.id)).toEqual(["root", "orphan"]);
    expect(tree[0].children.map((node) => node.id)).toEqual(["child"]);
  });

  it("is read from the catalog admin list through the BFF", async () => {
    const fetchMock = stubFetch([category("a")]);

    const tree = await getAdminCategories();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/categories/admin");
    expect(tree).toHaveLength(1);
  });
});

describe("brand and category writes", () => {
  it("sends the logo as imageFileId and maps the resolved logo URL", async () => {
    const fetchMock = stubFetch(brand("ACTIVE"));

    const created = await createBrand({name: "Asus", imageFileId: "00000000-0000-4000-8000-000000000001"});

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({imageFileId: "00000000-0000-4000-8000-000000000001"});
    expect(created.logoUrl).toBe("http://img/a.png");
  });

  it("changes a brand status with a second call only when it differs", async () => {
    const unchanged = stubFetch(brand("ACTIVE"));
    await updateBrand("b1", {name: "Asus", status: ResourceStatus.Active});
    expect(unchanged).toHaveBeenCalledTimes(1);

    const changed = stubFetch(brand("ACTIVE"), brand("INACTIVE"));
    const result = await updateBrand("b1", {name: "Asus", status: ResourceStatus.Inactive});
    expect(changed.mock.calls.map((call) => `${call[1].method} ${call[0]}`)).toEqual([
      "PUT /api/backend/catalog-service/brands/b1",
      "PATCH /api/backend/catalog-service/brands/b1/status",
    ]);
    expect(result.status).toBe("INACTIVE");
  });

  it("deletes a category through catalog-service", async () => {
    const fetchMock = stubFetch(null);

    await deleteCategory("c1");

    expect(fetchMock.mock.calls[0]).toEqual(["/api/backend/catalog-service/categories/c1", expect.objectContaining({method: "DELETE"})]);
  });
});
