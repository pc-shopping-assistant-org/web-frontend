import type {CustomerAddress} from "@/features/account/models";
import type {
  ProductVariant,
  Review,
  Supplier as CatalogSupplier,
} from "@/features/catalog/models";
import type {OrderStatus, PaymentStatus} from "@/lib/domain/commerce-enums";

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

export type GroupSchemaItem = {
  groupId: string;
  groupName: string;
  displayOrder: number;
  attributes: AttributeSchemaItem[];
};

export type CategoryAttributeGroup = {
  id: string;
  categoryId: string;
  name: string;
  displayOrder: number;
  status?: string;
  createdAt?: string;
};

export type CategoryAttribute = {
  id: string;
  categoryGroupId: string;
  attributeId: string;
  attributeKey?: string;
  attributeDisplayName?: string;
  displayOrder: number;
  required: boolean;
  status?: string;
};

export type CategorySpecs = {
  categoryId: string;
  categoryName: string;
  groups: GroupSchemaItem[];
};

export type CustomerDetail = {
  id: string;
  accountId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatarFileId?: string;
  birthday?: string;
  gender?: string;
  status?: string;
  createdAt?: string;
  addresses: CustomerAddress[];
  totalOrders: number;
  totalSpent: number;
};

export type CustomerOrderSummary = {
  orderId: string;
  orderTime?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  status?: OrderStatus | string;
};

export type CustomersPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: CustomerDetail[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type DashboardOverview = {
  cancelledOrders: number;
  completedOrders: number;
  newCustomersThisMonth: number;
  revenueGrowthRate?: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
};

export type OrderStatusStat = {
  status?: OrderStatus | string;
  count: number;
  percentage?: number;
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
  createdAt?: string;
};

export type DiscountDetail = DiscountSummary & {
  updatedAt?: string;
  appliedCategoryIds: string[];
  appliedVariants: ProductVariant[];
};

export type DiscountsPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: DiscountSummary[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};

export type EmployeeDetail = {
  id: string;
  accountId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  gender?: string;
  salary: number;
  address?: string;
  avatarFileId?: string;
  birthday?: string;
  joinedAt?: string;
  status?: string;
  createdAt?: string;
};

export type EmployeesPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: EmployeeDetail[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
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

export type Role = {id: string; name: string; status?: string};
export type Option = {
  id: string;
  name: string;
  type: string;
  value: string;
  status?: string;
  createdAt?: string;
};

export type RevenueChartPoint = {
  dateLabel?: string;
  orderCount: number;
  revenue: number;
};

export type RevenueChartData = {
  dataPoints: RevenueChartPoint[];
  period?: string;
  totalOrders: number;
  totalRevenue: number;
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

export type TopSellingProduct = {
  productId: string;
  productName?: string;
  imageUrl?: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

export type AdminReviewPage = {
  hasNext: boolean;
  hasPrev: boolean;
  items: Review[];
  nextCursor?: string;
  prevCursor?: string;
  size: number;
};
