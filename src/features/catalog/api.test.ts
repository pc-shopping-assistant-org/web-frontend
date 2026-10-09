import {afterEach, describe, expect, it, vi} from "vitest";

import {getCategorySpecLabels, getProductBySlug, getProducts} from "./api";

afterEach(() => vi.restoreAllMocks());

function stubFetch(payload: unknown) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {
      status: 200,
      headers: {"content-type": "application/json"},
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("storefront catalog reads", () => {
  it("lists through catalog-service with only the supported filters and a forward cursor", async () => {
    const fetchMock = stubFetch({items: [{id: "p1", name: "Card", seoName: "card", status: "ACTIVE", minPrice: 1, maxPrice: 2, mainImageUrl: "http://img/a.png"}], nextCursor: "c2", hasNext: true, size: 1});

    const page = await getProducts({keyword: "card", categoryId: "c1", minPrice: 10, limit: 12});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products?keyword=card&categoryId=c1&minPrice=10&limit=12");
    expect(page).toMatchObject({hasNext: true, nextCursor: "c2"});
    expect(page.items[0].imageUrl).toBe("http://img/a.png");
  });

  it("maps the detail with the gallery, the variant own image and free-form options", async () => {
    stubFetch({
      id: "p1", name: "Card", seoName: "card", status: "ACTIVE", categoryId: "c1", categoryName: "VGA",
      images: [{id: "i1", fileId: "f1", url: "http://img/main.png", main: true}],
      variants: [{id: "v1", productId: "p1", price: 100, quantity: 2, sku: "S", status: "ACTIVE", warrantyMonths: 12, imageUrl: "http://img/v.png", options: [{id: "o", name: "Color", value: "Blue"}]}],
    });

    const product = await getProductBySlug("card");

    expect(product.imageUrl).toBe("http://img/main.png");
    expect(product.variants[0]).toMatchObject({price: 100, imageUrl: "http://img/v.png", options: [{name: "Color", value: "Blue"}]});
  });

  it("names and orders specifications from the category attribute template", async () => {
    stubFetch({categoryId: "c1", groups: [
      {displayOrder: 1, attributes: [{key: "type", displayName: "RAM type", unit: null, displayOrder: 0}]},
      {displayOrder: 0, attributes: [{key: "gb", displayName: "RAM", unit: "GB", displayOrder: 0}]},
    ]});

    const labels = await getCategorySpecLabels("c1");

    expect(labels.gb).toEqual({label: "RAM", unit: "GB", order: 0});
    expect(labels.type).toEqual({label: "RAM type", unit: undefined, order: 1});
  });
});
