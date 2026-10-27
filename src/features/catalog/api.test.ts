import {afterEach, describe, expect, it, vi} from "vitest";

import {getCategorySpecLabels, getProductBySlug, getProducts, listProducts, searchProducts} from "./api";

afterEach(() => vi.restoreAllMocks());

function okResponse(payload: unknown) {
  return new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {
    status: 200,
    headers: {"content-type": "application/json"},
  });
}

function stubFetch(payload: unknown) {
  const fetchMock = vi.fn().mockImplementation(
    async () =>
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
    const fetchMock = stubFetch({
      items: [{id: "p1", name: "Card", seoName: "card", status: "ACTIVE", minPrice: 1, maxPrice: 2, mainImageUrl: "http://img/a.png"}],
      nextCursor: "c2",
      hasNext: true,
      size: 1,
    });

    const page = await getProducts({keyword: "card", categoryId: "c1", minPrice: 10, limit: 12});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products?keyword=card&categoryId=c1&minPrice=10&limit=12");
    expect(page).toMatchObject({hasNext: true, nextCursor: "c2"});
    expect(page.items[0].imageUrl).toBe("http://img/a.png");
  });

  it("maps the detail with the gallery, the variant own image and free-form options", async () => {
    stubFetch({
      id: "p1",
      name: "Card",
      seoName: "card",
      status: "ACTIVE",
      categoryId: "c1",
      categoryName: "VGA",
      images: [{id: "i1", fileId: "f1", url: "http://img/main.png", main: true}],
      variants: [
        {
          id: "v1",
          productId: "p1",
          price: 100,
          quantity: 2,
          sku: "S",
          status: "ACTIVE",
          warrantyMonths: 12,
          imageUrl: "http://img/v.png",
          options: [{id: "o", name: "Color", value: "Blue"}],
        },
      ],
    });

    const product = await getProductBySlug("card");

    expect(product.imageUrl).toBe("http://img/main.png");
    expect(product.variants[0]).toMatchObject({price: 100, imageUrl: "http://img/v.png", options: [{name: "Color", value: "Blue"}]});
  });

  it("names and orders specifications from the category attribute template", async () => {
    stubFetch({
      categoryId: "c1",
      attributes: [
        {key: "type", displayName: "RAM type", unit: null, displayOrder: 1},
        {key: "gb", displayName: "RAM", unit: "GB", displayOrder: 0},
      ],
    });

    const labels = await getCategorySpecLabels("c1");

    expect(labels.gb).toEqual({label: "RAM", unit: "GB", order: 0});
    expect(labels.type).toEqual({label: "RAM type", unit: undefined, order: 1});
  });
});

describe("storefront text search", () => {
  const hit = {
    id: "p1",
    name: "RTX 4070",
    seoName: "rtx-4070",
    brandName: "Asus",
    categoryName: "VGA",
    minPrice: 100,
    maxPrice: 120,
    inStock: true,
    mainImageUrl: "http://img/a.png",
  };

  it("searches through search-service and turns the page number into the next cursor", async () => {
    const fetchMock = stubFetch({content: [hit], page: 0, size: 12, totalElements: 30, totalPages: 3, last: false});

    const page = await searchProducts("rtx 40");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/search-service/products/search?q=rtx+40&page=0&size=12");
    expect(page).toMatchObject({hasNext: true, nextCursor: "1", size: 1});
    expect(page.items[0]).toMatchObject({id: "p1", seoName: "rtx-4070", brandName: "Asus", imageUrl: "http://img/a.png", status: "ACTIVE"});
  });

  it("preserves an out-of-stock search hit for storefront labeling", async () => {
    stubFetch({content: [{...hit, inStock: false}], page: 0, size: 1, last: true});

    const page = await searchProducts("rtx 4070");

    expect(page.items[0].totalQuantity).toBe(0);
  });

  it("reads the cursor as the page number and stops on the last page", async () => {
    const fetchMock = stubFetch({content: [hit], page: 2, size: 12, totalElements: 25, totalPages: 3, last: true});

    const page = await searchProducts("rtx", {cursor: "2", limit: 12});

    expect(fetchMock.mock.calls[0][0]).toContain("page=2");
    expect(page).toMatchObject({hasNext: false, nextCursor: undefined});
  });

  it("falls back to the first page when the cursor is not a page number", async () => {
    const fetchMock = stubFetch({content: [], page: 0, size: 12, totalElements: 0, totalPages: 0, last: true});

    await searchProducts("rtx", {cursor: "abc"});

    expect(fetchMock.mock.calls[0][0]).toContain("page=0");
  });

  it("narrows the search by category, brand and price like the catalog list", async () => {
    const fetchMock = stubFetch({content: [], items: [], page: 0, size: 0, last: true, hasNext: false});

    await listProducts({keyword: " card ", categoryId: "c1", brandId: "b1", minPrice: 10, maxPrice: 20});

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/search-service/products/search?q=card&page=0&size=12&categoryId=c1&brandId=b1&minPrice=10&maxPrice=20",
    );
  });

  it("falls back to the last page when the asked page is past the end", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse({items: [], hasNext: false, size: 0, page: 541, totalPages: 109, totalElements: 1625}))
      .mockResolvedValueOnce(
        okResponse({items: [{id: "p1", name: "Card", seoName: "card", status: "ACTIVE"}], hasNext: false, size: 1, page: 108, totalPages: 109, totalElements: 1625}),
      );
    vi.stubGlobal("fetch", fetchMock);

    const page = await listProducts({page: 541, limit: 15});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/backend/catalog-service/products?page=108&limit=15");
    expect(page.page).toBe(108);
    expect(page.items).toHaveLength(1);
  });

  it("lists through the catalog when the keyword is blank", async () => {
    const fetchMock = stubFetch({content: [], items: [], page: 0, size: 0, last: true, hasNext: false});

    await listProducts({keyword: "  ", categoryId: "c1", limit: 12});

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/catalog-service/products?categoryId=c1&limit=12");
  });
});
