import type {CartDto, CartItemDto} from "@/features/cart/contracts/dto";
import type {Cart, CartItem} from "@/features/cart/models";

const text = (value?: string | null) => value?.trim() ?? "";
const number = (value?: number | null) => value ?? 0;

export function mapCartItem(dto: CartItemDto): CartItem {
  return {
    imageUrl: dto.imageUrl ?? undefined,
    price: number(dto.price),
    model: dto.model ?? undefined,
    variantLabel: dto.variantLabel ?? undefined,
    productId: dto.productId ?? undefined,
    categoryId: dto.categoryId ?? undefined,
    productName: text(dto.productName),
    productVariantId: text(dto.productVariantId),
    quantity: number(dto.quantity),
    sku: dto.sku ?? undefined,
    stockQuantity: number(dto.stockQuantity),
    subtotal: number(dto.subtotal),
    available: dto.available,
  };
}

export function mapCart(dto: CartDto): Cart {
  return {
    items: (dto.items ?? []).map(mapCartItem),
    subtotalAmount: number(dto.subtotalAmount),
    totalItems: number(dto.totalItems),
  };
}
