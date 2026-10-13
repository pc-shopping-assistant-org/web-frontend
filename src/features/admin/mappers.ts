import type {
  AttributeDefinitionDto,
  CategorySpecsDto,
  DiscountDto,
  DiscountsPageDto,
  FileResponseDto,
  GroupSchemaItemDto,
  PaymentDetailDto,
  PaymentsPageDto,
  SupplierDto,
  SuppliersPageDto,
} from "@/features/admin/contracts/dto";
import type {
  AttributeDefinition,
  AttributeSchemaItem,
  CategorySpecs,
  DiscountDetail,
  DiscountSummary,
  DiscountsPage,
  FileResponse,
  PaymentDetail,
  PaymentsPage,
  Supplier,
  SuppliersPage,
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

export function mapCategorySpecs(dto: CategorySpecsDto): CategorySpecs {
  return {
    categoryId: dto.categoryId,
    categoryName: "",
    groups: (dto.groups ?? []).map(mapGroupSchemaItem),
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

