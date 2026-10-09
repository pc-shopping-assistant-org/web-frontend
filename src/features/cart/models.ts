/** Frontend-owned cart models used by checkout and cart UI. */
export type CartItem = {
  imageUrl?: string;
  price: number;
  model?: string;
  /** The variant options on one line, e.g. "Color: Blue · RAM: 16GB". */
  variantLabel?: string;
  productId?: string;
  categoryId?: string;
  productName: string;
  productVariantId: string;
  quantity: number;
  sku?: string;
  stockQuantity: number;
  subtotal: number;
  /** False when the variant or its product is off sale: the line stays visible but is not counted. */
  available: boolean;
};

export type Cart = {
  items: CartItem[];
  subtotalAmount: number;
  totalItems: number;
};
