import type {
  BrandDto,
  CategoryDto,
  CategoryTreeDto,
  HardwareTypeDto,
  LegacyBrandDto,
  LegacyCategoryDto,
  ProductDetailDto,
  ProductImageDto,
  ProductOptionDto,
  ProductPageDto,
  ProductReviewDto,
  ProductReviewPageDto,
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
  HardwareType,
  ProductDetail,
  ProductImage,
  ProductOption,
  ProductPage,
  ProductReview,
  ProductReviewPage,
  ProductSummary,
  ProductVariant,
  Review,
  ReviewsPage,
  Supplier,
} from "@/features/catalog/models";

const text = (value?: string) => value?.trim() ?? "";
const number = (value?: number | null) => value ?? 0;

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

export function mapBrand(dto: LegacyBrandDto): Brand {
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

export function mapCategory(dto: LegacyCategoryDto): Category {
  return {
    id: text(dto.id),
    name: text(dto.name),
    parentId: dto.parentId,
    seoName: dto.seoName,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapBrandResponse(dto: BrandDto): Brand {
  return {
    id: dto.id,
    name: dto.name,
    seoName: dto.seoName,
    description: dto.description ?? undefined,
    imageFileId: dto.imageFileId ?? undefined,
    logoUrl: dto.imageUrl ?? undefined,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapCategoryResponse(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId ?? undefined,
    seoName: dto.seoName,
    hardwareType: dto.hardwareType ?? undefined,
    description: dto.description ?? undefined,
    displayOrder: dto.displayOrder ?? 0,
    status: dto.status,
    createdAt: dto.createdAt,
    productCount: dto.productCount,
  };
}

export function mapCategoryTree(dto: CategoryTreeDto): CategoryTree {
  return {
    ...mapCategoryResponse(dto),
    children: (dto.children ?? []).map(mapCategoryTree),
  };
}

export function mapHardwareType(dto: HardwareTypeDto): HardwareType {
  return {id: dto.id, code: dto.code, nameVi: dto.nameVi, nameEn: dto.nameEn, displayOrder: dto.displayOrder};
}

/** The admin list is flat; the tree is rebuilt from `parentId`, orphans fall back to the root. */
export function buildCategoryTree(flat: CategoryDto[]): CategoryTree[] {
  const nodes = new Map<string, CategoryTree>(flat.map((dto) => [dto.id, {...mapCategoryResponse(dto), children: []}]));
  const roots: CategoryTree[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  const order = (left: Category, right: Category) =>
    (left.displayOrder ?? 0) - (right.displayOrder ?? 0) || left.name.localeCompare(right.name);
  const sort = (items: CategoryTree[]) => {
    items.sort(order);
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

export function mapProductOption(dto: ProductOptionDto): ProductOption {
  return {id: dto.id, name: dto.name, value: dto.value};
}

export function mapProductImage(dto: ProductImageDto): ProductImage {
  return {id: dto.id, fileId: dto.fileId, imageUrl: dto.url ?? undefined, main: dto.main};
}

export function mapProductVariant(dto: ProductVariantDto): ProductVariant {
  return {
    id: dto.id,
    productId: dto.productId,
    sku: dto.sku,
    price: number(dto.price),
    quantity: number(dto.quantity),
    barcode: dto.barcode ?? undefined,
    description: dto.description ?? undefined,
    imageFileId: dto.imageFileId ?? undefined,
    imageUrl: dto.imageUrl ?? undefined,
    model: dto.model ?? undefined,
    releaseAt: dto.releaseAt ?? undefined,
    status: dto.status,
    warrantyMonths: dto.warrantyMonths ?? undefined,
    createdAt: dto.createdAt,
    options: (dto.options ?? []).map(mapProductOption),
  };
}

export function mapProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.id,
    name: dto.name,
    seoName: dto.seoName,
    brandId: dto.brandId ?? undefined,
    brandName: dto.brandName ?? undefined,
    categoryId: dto.categoryId ?? undefined,
    categoryName: dto.categoryName ?? undefined,
    createdAt: dto.createdAt,
    imageUrl: dto.mainImageUrl ?? undefined,
    maxPrice: number(dto.maxPrice),
    minPrice: number(dto.minPrice),
    variantCount: dto.variantCount ?? undefined,
    totalQuantity: dto.totalQuantity ?? undefined,
    ratingAverage: 0,
    reviewCount: 0,
    status: dto.status,
  };
}

export function mapProductDetail(dto: ProductDetailDto): ProductDetail {
  const images = (dto.images ?? []).map(mapProductImage);
  return {
    id: dto.id,
    name: dto.name,
    seoName: dto.seoName,
    description: dto.description ?? undefined,
    imageUrl: (images.find((image) => image.main) ?? images[0])?.imageUrl,
    ratingAverage: 0,
    reviewCount: 0,
    specifications: dto.specifications ?? {},
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    brand: dto.brandId ? {id: dto.brandId, name: dto.brandName ?? ""} : undefined,
    category: dto.categoryId ? {id: dto.categoryId, name: dto.categoryName ?? ""} : undefined,
    images,
    variants: (dto.variants ?? []).map(mapProductVariant),
  };
}

export function mapProductPage(dto: ProductPageDto): ProductPage {
  return {
    hasNext: dto.hasNext,
    items: (dto.items ?? []).map(mapProductSummary),
    nextCursor: dto.nextCursor ?? undefined,
    size: number(dto.size),
    page: dto.page ?? undefined,
    totalElements: dto.totalElements ?? undefined,
    totalPages: dto.totalPages ?? undefined,
  };
}

export function mapProductReview(dto: ProductReviewDto): ProductReview {
  return {
    id: dto.id,
    productId: dto.productId,
    reviewerName: dto.reviewerName ?? undefined,
    rating: number(dto.rating),
    comment: dto.comment ?? undefined,
    createdAt: dto.createdAt,
    editedAt: dto.editedAt ?? undefined,
  };
}

export function mapProductReviewPage(dto: ProductReviewPageDto): ProductReviewPage {
  return {
    items: (dto.content ?? []).map(mapProductReview),
    page: number(dto.page),
    size: number(dto.size),
    totalElements: number(dto.totalElements),
    totalPages: number(dto.totalPages),
    last: dto.last ?? true,
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
