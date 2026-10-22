import type {Review, Supplier as CatalogSupplier} from "@/features/catalog/models";
import type {PaymentStatus} from "@/lib/domain/commerce-enums";

export type AttributeDefinition = {
  id: string;
  key: string;
  displayName: string;
  dataType?: string;
  unit?: string;
  allowedValues: string[];
  aliases: string[];
  filterable: boolean;
  comparable: boolean;
  status?: string;
  createdAt?: string;
};

export type AttributeSchemaItem = {
  assignmentId?: string;
  attributeId: string;
  allowedValues: string[];
  comparable: boolean;
  dataType?: string;
  displayName: string;
  displayOrder: number;
  filterable: boolean;
  key: string;
  required: boolean;
  unit?: string;
};

export type CategorySpecs = {
  categoryId: string;
  categoryName: string;
  attributes: AttributeSchemaItem[];
};

export type DiscountSummary = {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  discountType?: string;
  applicationScope?: string;
  value: number;
  minOrderAmount: number;
  startAt?: string;
  endAt?: string;
  status?: string;
  /** SCHEDULED, RUNNING, EXPIRED or LOCKED. */
  state?: string;
  categoryIds: string[];
  createdAt?: string;
};

export type DiscountDetail = DiscountSummary & {
  updatedAt?: string;
};

export type DiscountsPage = {
  items: DiscountSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type FileResponse = {
  id: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes: number;
  publicUrl?: string;
  storageProvider?: string;
  status?: string;
  createdAt?: string;
};

export type PaymentDetail = {
  id: string;
  orderId?: string;
  amount: number;
  paymentMethodCode?: string;
  providerTransactionCode?: string;
  paidAt?: string;
  createdAt?: string;
  status?: PaymentStatus | string;
};

export type PaymentsPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: PaymentDetail[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type Supplier = CatalogSupplier;
export type SuppliersPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Supplier[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type AdminReviewPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Review[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};
