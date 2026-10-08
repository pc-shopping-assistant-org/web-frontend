import {afterEach, describe, expect, it, vi} from "vitest";

import {ResourceStatus} from "@/lib/domain/catalog-enums";

import {createProduct, createVariant, deleteVariant, getAdminProductById, getAdminProducts, updateVariant} from "./api";
import {galleryRequest, optionsRequest} from "./product-fields";

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

const FILE = "00000000-0000-4000-8000-000000000001";
const FILE2 = "00000000-0000-4000-8000-000000000002";
const variant = (status: string) => ({
  id: "v1", productId: "p1", price: 1000, quantity: 3, sku: "SKU-1", status, warrantyMonths: 12,
  options: [{id: "o1", name: "Color", value: "Blue"}], imageUrl: "http://img/v.png",
});
const detail = {
  id: "p1", name: "Card", seoName: "card", brandId: "b1", brandName: "Asus", categoryId: "c1", categoryName: "VGA",
  status: "ACTIVE", specifications: {vram: 8},
  images: [{id: "i1", fileId: FILE, url: "http://img/a.png", main: false}, {id: "i2", fileId: "f2", url: "http://img/b.png", main: true}],
  variants: [variant("ACTIVE")],
};

describe("admin product reads", () => {
  it("maps the detail: brand and category from their ids, main image as the thumbnail", async () => {
    const fetchMock = stubFetch(detail);

    const product = await getAdminProductById("p1");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products/admin/p1");
    expect(product.brand).toEqual({id: "b1", name: "Asus"});
    expect(product.category?.name).toBe("VGA");
    expect(product.imageUrl).toBe("http://img/b.png");
    expect(product.variants[0]).toMatchObject({price: 1000, warrantyMonths: 12, options: [{name: "Color", value: "Blue"}]});
  });

  it("lists with the filter and keeps only the forward cursor", async () => {
    const fetchMock = stubFetch({items: [{id: "p1", name: "Card", seoName: "card", status: "ACTIVE", minPrice: 1, maxPrice: 2, mainImageUrl: "http://img/a.png"}], nextCursor: "next", hasNext: true, size: 1});

    const page = await getAdminProducts({keyword: "card", status: "INACTIVE", limit: 20});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products/admin?keyword=card&status=INACTIVE&limit=20");
    expect(page).toMatchObject({hasNext: true, nextCursor: "next"});
    expect(page.items[0].imageUrl).toBe("http://img/a.png");
  });
});

describe("admin product writes", () => {
  it("sends the gallery with one main image and no supplier fields", async () => {
    const fetchMock = stubFetch(detail);

    await createProduct({name: "Card", categoryId: "00000000-0000-4000-8000-0000000000c1", images: galleryRequest([{fileId: FILE, main: false}, {fileId: FILE2, main: false}])});

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products");
    expect(body.images).toEqual([{fileId: FILE, main: true}, {fileId: FILE2, main: false}]);
    expect(body).not.toHaveProperty("supplierIds");
  });

  it("creates a variant with free-form options and drops empty option rows", async () => {
    const fetchMock = stubFetch(variant("ACTIVE"));

    await createVariant("p1", {price: 1000, quantity: 3, sku: "SKU-1", warrantyMonths: 12, options: optionsRequest([{name: " Color ", value: "Blue"}, {name: "", value: ""}])});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products/p1/variants");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).options).toEqual([{name: "Color", value: "Blue"}]);
  });

  it("changes a variant status with a second call only when it differs", async () => {
    const unchanged = stubFetch(variant("ACTIVE"));
    await updateVariant("p1", "v1", {price: 1, quantity: 1, sku: "SKU-1", warrantyMonths: 1, status: ResourceStatus.Active});
    expect(unchanged).toHaveBeenCalledTimes(1);

    const changed = stubFetch(variant("ACTIVE"), variant("INACTIVE"));
    const result = await updateVariant("p1", "v1", {price: 1, quantity: 1, sku: "SKU-1", warrantyMonths: 1, status: ResourceStatus.Inactive});
    expect(changed.mock.calls.map((call) => `${call[1].method} ${call[0]}`)).toEqual([
      "PUT /api/backend/catalog-service/products/p1/variants/v1",
      "PATCH /api/backend/catalog-service/products/p1/variants/v1/status",
    ]);
    expect(result.status).toBe("INACTIVE");
  });

  it("deletes a variant under its product", async () => {
    const fetchMock = stubFetch(null);

    await deleteVariant({productId: "p1", id: "v1"});

    expect(fetchMock.mock.calls[0]).toEqual(["/api/backend/catalog-service/products/p1/variants/v1", expect.objectContaining({method: "DELETE"})]);
  });
});
