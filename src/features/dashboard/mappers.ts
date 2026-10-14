import type {CustomerSummaryDto, OrderDashboardDto, RevenuePointDto, StockSummaryDto, TopVariantDto} from "./contracts/dto";
import type {CustomerSummary, OrderDashboard, RevenuePoint, StockSummary, TopVariant} from "./models";

export const mapOrderDashboard = (dto: OrderDashboardDto): OrderDashboard => ({
  revenueToday: dto.revenueToday,
  revenueThisMonth: dto.revenueThisMonth,
  ordersByStatus: dto.ordersByStatus ?? {},
});

export const mapCustomerSummary = (dto: CustomerSummaryDto): CustomerSummary => ({...dto});

export const mapStockSummary = (dto: StockSummaryDto): StockSummary => ({...dto});

export const mapRevenuePoint = (dto: RevenuePointDto): RevenuePoint => ({...dto});

export const mapTopVariant = (dto: TopVariantDto): TopVariant => ({
  productVariantId: dto.productVariantId,
  productName: dto.productName,
  sku: dto.sku,
  variantLabel: dto.variantLabel ?? undefined,
  quantitySold: dto.quantitySold,
  revenue: dto.revenue,
});
