import type {
  BrandDto,
  CategoryDto,
  CategoryTreeDto,
  ProductDetailDto,
  ProductImageDto,
  ProductOptionDto,
  ProductPageDto,
  ProductRatingSummaryDto,
  ProductSummaryDto,
  ProductVariantDto,
  ReviewDto,
  ReviewsPageDto,
  SupplierDto,
} from "@/features/catalog/contracts/dto";
import type {
  Brand,
  Category,
  CategoryTree,
  ProductDetail,
  ProductImage,
  ProductOption,
  ProductPage,
  ProductRatingSummary,
  ProductSummary,
  ProductVariant,
  Review,
  ReviewsPage,
  Supplier,
} from "@/features/catalog/models";

const text = (value?: string) => value?.trim() ?? "";
const number = (value?: number) => value ?? 0;

export function mapSupplier(dto: SupplierDto): Supplier {
  return {
    id: text(dto.id),
    name: text(dto.name),
    address: dto.address,
    description: dto.description,
    email: dto.email,
    phone: dto.phone,
    status: dto.status,
  };
}

export function mapBrand(dto: BrandDto): Brand {
  return {
    id: text(dto.id),
    name: text(dto.name),
    description: dto.description,
    imageFileId: dto.imageFileId,
    logoUrl: dto.logoUrl,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapCategory(dto: CategoryDto): Category {
  return {
    id: text(dto.id),
    name: text(dto.name),
    parentId: dto.parentId,
    seoName: dto.seoName,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapCategoryTree(dto: CategoryTreeDto): CategoryTree {
  return {
    ...mapCategory(dto),
    children: (dto.children ?? []).map(mapCategoryTree),
  };
}

export function mapProductOption(dto: ProductOptionDto): ProductOption {
  return {
    id: text(dto.id),
    name: text(dto.name),
    type: text(dto.type),
    value: text(dto.value),
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapProductImage(dto: ProductImageDto): ProductImage {
  return {
    id: text(dto.id),
    productVariantId: text(dto.productVariantId),
    imageUrl: dto.imageUrl,
    main: dto.main ?? false,
    name: dto.name,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapProductVariant(dto: ProductVariantDto): ProductVariant {
  return {
    id: text(dto.id),
    productId: text(dto.productId),
    sku: text(dto.sku),
    listPrice: number(dto.listPrice),
    quantity: number(dto.quantity),
    barcode: dto.barcode,
    description: dto.description,
    imageUrl: dto.imageUrl,
    model: dto.model,
    releaseAt: dto.releaseAt,
    status: dto.status,
    updatedAt: dto.updatedAt,
    warranty: dto.warranty,
    createdAt: dto.createdAt,
    images: (dto.images ?? []).map(mapProductImage),
    options: (dto.options ?? []).map(mapProductOption),
  };
}

export function mapProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: text(dto.id),
    name: text(dto.name),
    seoName: text(dto.seoName),
    brandId: dto.brandId,
    brandName: dto.brandName,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    createdAt: dto.createdAt,
    imageUrl: dto.imageUrl,
    maxPrice: number(dto.maxPrice),
    minPrice: number(dto.minPrice),
    ratingAverage: number(dto.ratingAverage),
    reviewCount: number(dto.reviewCount),
    status: dto.status,
    suppliers: (dto.suppliers ?? []).map(mapSupplier),
  };
}

export function mapProductDetail(dto: ProductDetailDto): ProductDetail {
  return {
    id: text(dto.id),
    name: text(dto.name),
    seoName: text(dto.seoName),
    description: dto.description,
    imageUrl: dto.imageUrl,
    ratingAverage: number(dto.ratingAverage),
    reviewCount: number(dto.reviewCount),
    specifications: dto.specifications ?? {},
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    brand: dto.brand ? mapBrand(dto.brand) : undefined,
    category: dto.category ? mapCategory(dto.category) : undefined,
    suppliers: (dto.suppliers ?? []).map(mapSupplier),
    variants: (dto.variants ?? []).map(mapProductVariant),
  };
}

export function mapProductPage(dto: ProductPageDto): ProductPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapProductSummary),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapReview(dto: ReviewDto): Review {
  return {
    id: text(dto.id),
    customerId: dto.customerId,
    customerName: dto.customerName,
    productId: dto.productId,
    productName: dto.productName,
    rating: number(dto.rating),
    comment: dto.comment,
    status: dto.status,
    createdAt: dto.createdAt,
    isVerifiedPurchase: dto.isVerifiedPurchase,
  };
}

export function mapReviewsPage(dto: ReviewsPageDto): ReviewsPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapReview),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapProductRatingSummary(dto: ProductRatingSummaryDto): ProductRatingSummary {
  return {
    productId: text(dto.productId),
    averageRating: number(dto.averageRating),
    totalReviews: number(dto.totalReviews),
    ratingDistribution: dto.ratingDistribution ?? {},
  };
}
