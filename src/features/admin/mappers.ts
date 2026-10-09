import type {
  AttributeDefinitionDto,
  AttributeSchemaItemDto,
  CategoryAttributeDto,
  CategoryAttributeGroupDto,
  CategorySpecsDto,
  CustomersPageDto,
  CustomerDetailDto,
  CustomerOrderSummaryDto,
  DashboardOverviewDto,
  DiscountDto,
  DiscountsPageDto,
  EmployeeDetailDto,
  EmployeesPageDto,
  FileResponseDto,
  GroupSchemaItemDto,
  OptionDto,
  OrderStatusStatDto,
  PaymentDetailDto,
  PaymentsPageDto,
  RevenueChartDataDto,
  RevenueChartPointDto,
  RoleDto,
  SupplierDto,
  SuppliersPageDto,
  TopSellingProductDto,
} from "@/features/admin/contracts/dto";
import type {
  AttributeDefinition,
  AttributeSchemaItem,
  CategoryAttribute,
  CategoryAttributeGroup,
  CategorySpecs,
  CustomerDetail,
  CustomerOrderSummary,
  CustomersPage,
  DashboardOverview,
  DiscountDetail,
  DiscountSummary,
  DiscountsPage,
  EmployeeDetail,
  EmployeesPage,
  FileResponse,
  Option,
  OrderStatusStat,
  PaymentDetail,
  PaymentsPage,
  RevenueChartData,
  RevenueChartPoint,
  Role,
  Supplier,
  SuppliersPage,
  TopSellingProduct,
} from "@/features/admin/models";

const text = (value?: string) => value?.trim() ?? "";
const number = (value?: number | null) => value ?? 0;

export function mapAttributeDefinition(dto: AttributeDefinitionDto): AttributeDefinition {
  return {
    id: text(dto.id),
    key: text(dto.key),
    displayName: text(dto.displayName),
    dataType: dto.dataType,
    unit: dto.unit,
    allowedValues: dto.allowedValues ?? [],
    aliases: dto.aliases ?? [],
    filterable: dto.filterable ?? false,
    comparable: dto.comparable ?? false,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapAttributeSchemaItem(dto: AttributeSchemaItemDto): AttributeSchemaItem {
  return {
    assignmentId: dto.assignmentId,
    attributeId: text(dto.attributeId),
    allowedValues: dto.allowedValues ?? [],
    comparable: dto.comparable ?? false,
    dataType: dto.dataType,
    displayName: text(dto.displayName),
    displayOrder: number(dto.displayOrder),
    filterable: dto.filterable ?? false,
    key: text(dto.key),
    required: dto.required ?? false,
    unit: dto.unit,
  };
}

export function mapGroupSchemaItem(dto: GroupSchemaItemDto): CategorySpecs["groups"][number] {
  return {
    groupId: dto.id,
    groupName: dto.name,
    displayOrder: number(dto.displayOrder),
    attributes: (dto.attributes ?? []).map((attribute) => ({
      attributeId: attribute.attributeId,
      key: attribute.key,
      displayName: attribute.displayName,
      dataType: attribute.dataType as AttributeSchemaItem["dataType"],
      unit: attribute.unit ?? undefined,
      allowedValues: attribute.allowedValues ?? [],
      required: attribute.required,
      displayOrder: number(attribute.displayOrder),
      filterable: false,
      comparable: false,
    })),
  };
}

export function mapCategoryAttributeGroup(dto: CategoryAttributeGroupDto): CategoryAttributeGroup {
  return {
    id: text(dto.id),
    categoryId: text(dto.categoryId),
    name: text(dto.name),
    displayOrder: number(dto.displayOrder),
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapCategoryAttribute(dto: CategoryAttributeDto): CategoryAttribute {
  return {
    id: text(dto.id),
    categoryGroupId: text(dto.categoryGroupId),
    attributeId: text(dto.attributeId),
    attributeKey: dto.attributeKey,
    attributeDisplayName: dto.attributeDisplayName,
    displayOrder: number(dto.displayOrder),
    required: dto.required ?? false,
    status: dto.status,
  };
}

export function mapCategorySpecs(dto: CategorySpecsDto): CategorySpecs {
  return {
    categoryId: dto.categoryId,
    categoryName: "",
    groups: (dto.groups ?? []).map(mapGroupSchemaItem),
  };
}

export function mapCustomerDetail(dto: CustomerDetailDto): CustomerDetail {
  return {
    id: text(dto.id),
    accountId: text(dto.accountId),
    fullName: dto.fullName,
    email: dto.email,
    phone: dto.phone,
    address: dto.address,
    avatarFileId: dto.avatarFileId,
    birthday: dto.birthday,
    gender: dto.gender,
    status: dto.status,
    createdAt: dto.createdAt,
    addresses: (dto.addresses ?? []).map((address) => ({
      id: address.id ?? "",
      addressLine: address.addressLine ?? "",
      default: address.default ?? false,
      phone: address.phone ?? "",
      recipientName: address.recipientName ?? "",
    })),
    totalOrders: number(dto.totalOrders),
    totalSpent: number(dto.totalSpent),
  };
}

export function mapCustomerOrderSummary(dto: CustomerOrderSummaryDto): CustomerOrderSummary {
  return {
    orderId: text(dto.orderId),
    orderTime: dto.orderTime,
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    deliveryAddress: dto.deliveryAddress,
    discountAmount: number(dto.discountAmount),
    shippingFee: number(dto.shippingFee),
    totalAmount: number(dto.totalAmount),
    status: dto.status,
  };
}

export function mapCustomersPage(dto: CustomersPageDto): CustomersPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapCustomerDetail),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapDashboardOverview(dto: DashboardOverviewDto): DashboardOverview {
  return {
    cancelledOrders: number(dto.cancelledOrders),
    completedOrders: number(dto.completedOrders),
    newCustomersThisMonth: number(dto.newCustomersThisMonth),
    revenueGrowthRate: dto.revenueGrowthRate,
    totalCustomers: number(dto.totalCustomers),
    totalOrders: number(dto.totalOrders),
    totalRevenue: number(dto.totalRevenue),
  };
}

export function mapOrderStatusStat(dto: OrderStatusStatDto): OrderStatusStat {
  return {
    status: dto.status,
    count: number(dto.count),
    percentage: dto.percentage,
  };
}

export function mapDiscountSummary(dto: DiscountDto): DiscountSummary {
  return {
    id: dto.id,
    code: dto.code ?? undefined,
    title: dto.title,
    description: dto.description ?? undefined,
    discountType: dto.discountType,
    applicationScope: dto.applicationScope,
    value: number(dto.value),
    minOrderAmount: number(dto.minOrderAmount),
    startAt: dto.startAt,
    endAt: dto.endAt,
    status: dto.status,
    state: dto.state,
    categoryIds: dto.categoryIds ?? [],
    createdAt: dto.createdAt,
  };
}

export function mapDiscountDetail(dto: DiscountDto): DiscountDetail {
  return {...mapDiscountSummary(dto), updatedAt: dto.updatedAt};
}

export function mapDiscountsPage(dto: DiscountsPageDto): DiscountsPage {
  return {
    items: (dto.content ?? []).map(mapDiscountSummary),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
    last: dto.last,
  };
}

export function mapEmployeeDetail(dto: EmployeeDetailDto): EmployeeDetail {
  return {
    id: text(dto.id),
    accountId: text(dto.accountId),
    fullName: dto.fullName,
    email: dto.email,
    phone: dto.phone,
    roleId: dto.roleId,
    roleName: dto.roleName,
    gender: dto.gender,
    salary: number(dto.salary),
    address: dto.address,
    avatarFileId: dto.avatarFileId,
    birthday: dto.birthday,
    joinedAt: dto.joinedAt,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapEmployeesPage(dto: EmployeesPageDto): EmployeesPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapEmployeeDetail),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapFileResponse(dto: FileResponseDto): FileResponse {
  return {
    id: text(dto.id),
    originalName: dto.originalName,
    mimeType: dto.mimeType,
    sizeBytes: number(dto.sizeBytes),
    publicUrl: dto.publicUrl,
    storageProvider: dto.storageProvider,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapPaymentDetail(dto: PaymentDetailDto): PaymentDetail {
  return {
    id: text(dto.id),
    orderId: dto.orderId,
    amount: number(dto.amount),
    paymentMethodCode: dto.paymentMethodCode,
    providerTransactionCode: dto.providerTransactionCode,
    paidAt: dto.paidAt,
    createdAt: dto.createdAt,
    status: dto.status,
  };
}

export function mapPaymentsPage(dto: PaymentsPageDto): PaymentsPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapPaymentDetail),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapRole(dto: RoleDto): Role {
  return {id: text(dto.id), name: text(dto.name), status: dto.status};
}

export function mapOption(dto: OptionDto): Option {
  return {
    id: text(dto.id),
    name: text(dto.name),
    type: text(dto.type),
    value: text(dto.value),
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapRevenueChartPoint(dto: RevenueChartPointDto): RevenueChartPoint {
  return {
    dateLabel: dto.dateLabel,
    orderCount: number(dto.orderCount),
    revenue: number(dto.revenue),
  };
}

export function mapRevenueChartData(dto: RevenueChartDataDto): RevenueChartData {
  return {
    dataPoints: (dto.dataPoints ?? []).map(mapRevenueChartPoint),
    period: dto.period,
    totalOrders: number(dto.totalOrders),
    totalRevenue: number(dto.totalRevenue),
  };
}

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

export function mapSuppliersPage(dto: SuppliersPageDto): SuppliersPage {
  return {
    hasNext: dto.hasNext ?? false,
    hasPrev: dto.hasPrev ?? false,
    items: (dto.items ?? []).map(mapSupplier),
    nextCursor: dto.nextCursor,
    prevCursor: dto.prevCursor,
    size: number(dto.size),
  };
}

export function mapTopSellingProduct(dto: TopSellingProductDto): TopSellingProduct {
  return {
    productId: text(dto.productId),
    productName: dto.productName,
    imageUrl: dto.imageUrl,
    totalQuantitySold: number(dto.totalQuantitySold),
    totalRevenue: number(dto.totalRevenue),
  };
}
