import type {CartDto, CartItemDto} from "@/features/cart/contracts/dto";
import type {Cart, CartItem} from "@/features/cart/models";

const text = (value?: string) => value?.trim() ?? "";
const number = (value?: number) => value ?? 0;

export function mapCartItem(dto: CartItemDto): CartItem {
  return {
    imageUrl: dto.imageUrl,
    listPrice: number(dto.listPrice),
    model: dto.model,
    productId: dto.productId,
    productName: text(dto.productName),
    productVariantId: text(dto.productVariantId),
    quantity: number(dto.quantity),
    sku: dto.sku,
    stockQuantity: number(dto.stockQuantity),
    subtotal: number(dto.subtotal),
  };
}

export function mapCart(dto: CartDto): Cart {
  return {
    items: (dto.items ?? []).map(mapCartItem),
    subtotalAmount: number(dto.subtotalAmount),
    totalItems: number(dto.totalItems),
  };
}
