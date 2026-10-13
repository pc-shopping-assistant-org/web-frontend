export type OrderDashboard = {
  revenueToday: number;
  revenueThisMonth: number;
  ordersByStatus: Record<string, number>;
};

export type CustomerSummary = {
  totalCustomers: number;
  newToday: number;
  newThisMonth: number;
};

export type StockSummary = {
  lowStockVariants: number;
  outOfStockVariants: number;
  lowStockThreshold: number;
};

export type RevenueGranularity = "DAY" | "MONTH";

export type RevenuePoint = {
  period: string;
  revenue: number;
  orderCount: number;
};

export type TopVariant = {
  productVariantId: string;
  productName: string;
  sku: string;
  variantLabel?: string;
  quantitySold: number;
  revenue: number;
};
