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
  seoName?: string;
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
  description?: string;
  status?: string;
  createdAt?: string;
};

export type CategoryTree = Category & {
  children: CategoryTree[];
};

/** A variant option such as `Color: Blue`. */
export type ProductOption = {
  id: string;
  name: string;
  value: string;
};

/** One gallery image of a product; exactly one of them is the main (thumbnail) image. */
export type ProductImage = {
  id: string;
  fileId: string;
  imageUrl?: string;
  main: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  quantity: number;
  barcode?: string;
  description?: string;
  /** The own image of the variant, if it has one. */
  imageFileId?: string;
  imageUrl?: string;
  model?: string;
  releaseAt?: string;
  status?: string;
  warrantyMonths?: number;
  createdAt?: string;
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
  /** Not served by catalog-service yet; stays 0 until the review summary is wired in. */
  ratingAverage: number;
  reviewCount: number;
  status?: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  seoName: string;
  description?: string;
  /** The main gallery image. */
  imageUrl?: string;
  ratingAverage: number;
  reviewCount: number;
  specifications: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  brand?: Brand;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type ProductPage = {
  hasNext: boolean;
  items: ProductSummary[];
  nextCursor?: string;
  size: number;
};

export type ProductReview = {
  id: string;
  productId: string;
  reviewerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  /** Set once the single edit is spent. */
  editedAt?: string;
};

export type ProductReviewPage = {
  items: ProductReview[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type OrderLineProduct = {id: string; name: string; seoName: string};

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

