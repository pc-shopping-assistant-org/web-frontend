/** The order side of the dashboard: every order status is present, one without orders counts 0. */
export type OrderDashboardDto = {
  revenueToday: number;
  revenueThisMonth: number;
  ordersByStatus: Record<string, number>;
};

/** The identity side of the dashboard. */
export type CustomerSummaryDto = {
  totalCustomers: number;
  newToday: number;
  newThisMonth: number;
};

/** The catalog side of the dashboard, over the active variants. */
export type StockSummaryDto = {
  lowStockVariants: number;
  outOfStockVariants: number;
  lowStockThreshold: number;
};

export type RevenuePointDto = {
  /** A day, or the first day of a month. */
  period: string;
  revenue: number;
  orderCount: number;
};

export type TopVariantDto = {
  productVariantId: string;
  productName: string;
  sku: string;
  variantLabel?: string | null;
  quantitySold: number;
  revenue: number;
};

export type OrderStatusCountsDto = Record<string, number>;
