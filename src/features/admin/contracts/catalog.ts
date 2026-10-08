import {z} from "zod";

import {
  ATTRIBUTE_DATA_TYPE_VALUES,
  EDITABLE_RESOURCE_STATUS_VALUES,
  RESOURCE_STATUS_VALUES,
} from "@/lib/domain/catalog-enums";
import {EMPLOYEE_GENDER_VALUES} from "@/lib/domain/account-enums";
import {
  nonEmptyText,
  optionalDate,
  optionalEnum,
  optionalText,
  optionalUuid,
  password,
  phone,
  uuid,
  money,
} from "@/lib/api/contracts/primitives";

/** One gallery image: a file already stored in media-service. */
export const productImageRequestSchema = z.object({
  fileId: uuid,
  main: z.boolean(),
}).strict();

/** A free `name: value` option such as Color: Blue. */
export const variantOptionRequestSchema = z.object({
  name: nonEmptyText.max(100),
  value: nonEmptyText.max(255),
}).strict();

export const createProductVariantRequestSchema = z.object({
  price: money,
  quantity: z.number().int().nonnegative(),
  sku: nonEmptyText.max(100),
  model: optionalText,
  description: optionalText,
  warrantyMonths: z.number().int().positive(),
  barcode: optionalText,
  releaseAt: optionalDate,
  imageFileId: optionalUuid,
  options: z.array(variantOptionRequestSchema).optional(),
}).strict();

/** The backend takes the status through its own call, so it is split off by the adapter. */
export const updateProductVariantRequestSchema = createProductVariantRequestSchema.extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createProductRequestSchema = z.object({
  name: nonEmptyText.max(255),
  seoName: optionalText,
  brandId: optionalUuid,
  categoryId: uuid,
  description: optionalText,
  specifications: z.record(z.string(), z.unknown()).optional(),
  images: z.array(productImageRequestSchema).optional(),
}).strict();

/** Omitting `images` keeps the gallery; a list (even an empty one) replaces it. */
export const updateProductRequestSchema = createProductRequestSchema;

export const createCategoryRequestSchema = z.object({
  name: nonEmptyText.max(255),
  seoName: optionalText,
  description: optionalText,
  parentId: optionalUuid,
}).strict();

export const updateCategoryRequestSchema = createCategoryRequestSchema.extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createBrandRequestSchema = z.object({
  name: nonEmptyText.max(255),
  seoName: optionalText,
  description: optionalText,
  imageFileId: optionalUuid,
}).strict();

export const updateBrandRequestSchema = createBrandRequestSchema.extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createSupplierRequestSchema = z.object({
  name: nonEmptyText,
  email: z.email().optional(),
  phone: phone.optional(),
  address: optionalText,
  description: optionalText,
}).strict();

export const updateSupplierRequestSchema = createSupplierRequestSchema.extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createEmployeeRequestSchema = z.object({
  fullName: nonEmptyText.min(2),
  email: z.email(),
  phone,
  password,
  roleId: uuid,
  gender: z.enum(EMPLOYEE_GENDER_VALUES),
  salary: money.optional(),
  joinedAt: optionalDate,
  birthday: optionalDate,
  address: optionalText,
  avatarFileId: optionalUuid,
}).strict();

export const updateEmployeeRequestSchema = z.object({
  fullName: nonEmptyText.min(2),
  roleId: uuid,
  email: z.email().optional(),
  phone: phone.optional(),
  gender: optionalEnum(EMPLOYEE_GENDER_VALUES),
  salary: money.optional(),
  joinedAt: optionalDate,
  birthday: optionalDate,
  address: optionalText,
  avatarFileId: optionalUuid,
}).strict();

export const createOptionRequestSchema = z.object({
  name: nonEmptyText,
  type: nonEmptyText,
  value: nonEmptyText,
}).strict();

export const updateOptionRequestSchema = createOptionRequestSchema.extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createAttributeDefinitionRequestSchema = z.object({
  key: nonEmptyText,
  displayName: nonEmptyText,
  dataType: z.enum(ATTRIBUTE_DATA_TYPE_VALUES),
  unit: optionalText,
  allowedValues: z.array(nonEmptyText).optional(),
  aliases: z.array(nonEmptyText).optional(),
  filterable: z.boolean().optional(),
  comparable: z.boolean().optional(),
}).strict();

export const updateAttributeDefinitionRequestSchema = createAttributeDefinitionRequestSchema.omit({
  key: true,
}).extend({
  status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
}).strict();

export const createCategoryGroupRequestSchema = z.object({
  categoryId: uuid,
  name: nonEmptyText,
  displayOrder: z.number().int().nonnegative().optional(),
}).strict();

export const updateCategoryGroupRequestSchema = z.object({
  name: nonEmptyText,
  displayOrder: z.number().int().nonnegative().optional(),
  status: optionalEnum(RESOURCE_STATUS_VALUES),
}).strict();

export const assignAttributeRequestSchema = z.object({
  categoryGroupId: uuid,
  attributeId: uuid,
  required: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
}).strict();

export type ProductImageRequest = z.infer<typeof productImageRequestSchema>;
export type VariantOptionRequest = z.infer<typeof variantOptionRequestSchema>;
export type CreateProductVariantRequest = z.infer<typeof createProductVariantRequestSchema>;
export type UpdateProductVariantRequest = z.infer<typeof updateProductVariantRequestSchema>;
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type UpdateBrandRequest = z.infer<typeof updateBrandRequestSchema>;
export type CreateSupplierRequest = z.infer<typeof createSupplierRequestSchema>;
export type UpdateSupplierRequest = z.infer<typeof updateSupplierRequestSchema>;
export type CreateEmployeeRequest = z.infer<typeof createEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeRequestSchema>;
export type CreateOptionRequest = z.infer<typeof createOptionRequestSchema>;
export type UpdateOptionRequest = z.infer<typeof updateOptionRequestSchema>;
export type CreateAttributeDefinitionRequest = z.infer<typeof createAttributeDefinitionRequestSchema>;
export type UpdateAttributeDefinitionRequest = z.infer<typeof updateAttributeDefinitionRequestSchema>;
export type CreateCategoryGroupRequest = z.infer<typeof createCategoryGroupRequestSchema>;
export type UpdateCategoryGroupRequest = z.infer<typeof updateCategoryGroupRequestSchema>;
export type AssignAttributeRequest = z.infer<typeof assignAttributeRequestSchema>;
