/** Frontend-owned cart models used by checkout and cart UI. */
export type CartItem = {
  imageUrl?: string;
  listPrice: number;
  model?: string;
  productId?: string;
  productName: string;
  productVariantId: string;
  quantity: number;
  sku?: string;
  stockQuantity: number;
  subtotal: number;
};

export type Cart = {
  items: CartItem[];
  subtotalAmount: number;
  totalItems: number;
};
