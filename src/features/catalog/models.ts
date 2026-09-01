/** Frontend-owned catalog models. They intentionally do not mirror OpenAPI. */
export type Supplier = {
  id: string;
  name: string;
  address?: string;
  description?: string;
  email?: string;
  phone?: string;
  status?: string;
};

export type Brand = {
  id: string;
  name: string;
  description?: string;
  imageFileId?: string;
  logoUrl?: string;
  status?: string;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  parentId?: string;
  seoName?: string;
  status?: string;
  createdAt?: string;
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};

export type ProductOption = {
  id: string;
  name: string;
  type: string;
  value: string;
  status?: string;
  createdAt?: string;
};

export type ProductImage = {
  id: string;
  productVariantId: string;
  imageUrl?: string;
  main: boolean;
  name?: string;
  status?: string;
  createdAt?: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  listPrice: number;
  quantity: number;
  barcode?: string;
  description?: string;
  imageUrl?: string;
  model?: string;
  releaseAt?: string;
  status?: string;
  updatedAt?: string;
  warranty?: string;
  createdAt?: string;
  images: ProductImage[];
  options: ProductOption[];
};

export type ProductSummary = {
  id: string;
  name: string;
  seoName: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  createdAt?: string;
  imageUrl?: string;
  maxPrice: number;
  minPrice: number;
  ratingAverage: number;
  reviewCount: number;
  status?: string;
  suppliers: Supplier[];
};

export type ProductDetail = {
  id: string;
  name: string;
  seoName: string;
  description?: string;
  imageUrl?: string;
  ratingAverage: number;
  reviewCount: number;
  specifications: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  brand?: Brand;
  category?: Category;
  suppliers: Supplier[];
  variants: ProductVariant[];
};

export type ProductPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: ProductSummary[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type Review = {
  id: string;
  customerId?: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  rating: number;
  comment?: string;
  status?: string;
  createdAt?: string;
  isVerifiedPurchase?: boolean;
};

export type ReviewsPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Review[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type ProductRatingSummary = {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
};
