/** order-service cart line; an unavailable line (hidden, deleted, out of sale) has no price or product data. */
export type CartItemDto = {
  productVariantId: string;
  productId?: string | null;
  categoryId?: string | null;
  productName?: string | null;
  sku?: string | null;
  model?: string | null;
  variantLabel?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  quantity: number;
  subtotal: number;
  stockQuantity?: number | null;
  available: boolean;
};

export type CartDto = {
  id?: string | null;
  items: CartItemDto[];
  totalItems: number;
  subtotalAmount: number;
};
