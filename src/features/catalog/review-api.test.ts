import {afterEach, describe, expect, it, vi} from "vitest";

import {createProductReview, getMyProductReviews, getOrderLineProduct, getProductReviews, getReviewedOrderItems, updateProductReview} from "./api";

afterEach(() => vi.restoreAllMocks());

const PRODUCT = "00000000-0000-4000-8000-000000000001";
const REVIEW = "00000000-0000-4000-8000-000000000002";
const ITEM = "00000000-0000-4000-8000-000000000003";

function stubFetch(...payloads: unknown[]) {
  const fetchMock = vi.fn();
  for (const payload of payloads)
    fetchMock.mockImplementationOnce(async () =>
      new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {status: 200, headers: {"content-type": "application/json"}}),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const review = {id: REVIEW, productId: PRODUCT, reviewerName: null, rating: 4, comment: "Good", createdAt: "2026-10-08T00:00:00Z", editedAt: null};

describe("review api", () => {
  it("lists the public reviews by page with the reviewer names", async () => {
    const fetchMock = stubFetch({content: [{...review, reviewerName: "An Nguyen"}], page: 1, size: 10, totalElements: 21, totalPages: 3, last: false});
    const page = await getProductReviews(PRODUCT, 1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/catalog-service/products/${PRODUCT}/reviews?page=1&size=10`);
    expect(page).toMatchObject({page: 1, totalPages: 3, totalElements: 21, last: false});
    expect(page.items[0]).toMatchObject({id: REVIEW, reviewerName: "An Nguyen", rating: 4, editedAt: undefined});
  });

  it("reads the reviews of the customer for the product", async () => {
    const fetchMock = stubFetch([{...review, editedAt: "2026-10-09T00:00:00Z"}]);
    const mine = await getMyProductReviews(PRODUCT);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/catalog-service/products/${PRODUCT}/reviews/mine`);
    expect(mine).toEqual([expect.objectContaining({id: REVIEW, editedAt: "2026-10-09T00:00:00Z"})]);
  });

  it("creates a review with the order item and drops a blank comment", async () => {
    const fetchMock = stubFetch(review);
    await createProductReview(PRODUCT, {orderItemId: ITEM, rating: 5, comment: "  "});
    expect(fetchMock.mock.calls[0]).toEqual([`/api/backend/catalog-service/products/${PRODUCT}/reviews`, expect.objectContaining({method: "POST", body: JSON.stringify({orderItemId: ITEM, rating: 5})})]);

    await expect(createProductReview(PRODUCT, {orderItemId: ITEM, rating: 6})).rejects.toThrow();
    await expect(createProductReview(PRODUCT, {orderItemId: ITEM, rating: 3, comment: "x".repeat(2001)})).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("edits with a PATCH, sends an empty comment to clear it, and needs at least one field", async () => {
    const fetchMock = stubFetch(review);
    await updateProductReview(PRODUCT, REVIEW, {rating: 2, comment: ""});
    expect(fetchMock.mock.calls[0]).toEqual([`/api/backend/catalog-service/products/${PRODUCT}/reviews/${REVIEW}`, expect.objectContaining({method: "PATCH", body: JSON.stringify({rating: 2, comment: ""})})]);

    await expect(updateProductReview(PRODUCT, REVIEW, {})).rejects.toThrow();
    await expect(updateProductReview(PRODUCT, REVIEW, {rating: 0})).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("finds the product of an order line through its variant", async () => {
    const fetchMock = stubFetch({id: ITEM, productId: PRODUCT}, {id: PRODUCT, name: "Card", seoName: "card"});
    expect(await getOrderLineProduct(ITEM)).toEqual({id: PRODUCT, name: "Card", seoName: "card"});
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `/api/backend/catalog-service/product-variants/${ITEM}`,
      `/api/backend/catalog-service/products/${PRODUCT}`,
    ]);
  });

  it("asks which order lines were reviewed in one call, and not at all for none", async () => {
    const fetchMock = stubFetch([{orderItemId: ITEM, productId: PRODUCT, reviewId: REVIEW}]);
    expect(await getReviewedOrderItems([ITEM, REVIEW])).toEqual([{orderItemId: ITEM, productId: PRODUCT, reviewId: REVIEW}]);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/catalog-service/reviews/mine?orderItemIds=${ITEM}%2C${REVIEW}`);

    expect(await getReviewedOrderItems([])).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
