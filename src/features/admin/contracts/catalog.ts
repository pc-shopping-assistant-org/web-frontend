import {z} from "zod";

import {ATTRIBUTE_DATA_TYPE_VALUES, EDITABLE_RESOURCE_STATUS_VALUES} from "@/lib/domain/catalog-enums";
import {nonEmptyText, optionalDate, optionalEnum, optionalText, optionalUuid, phone, uuid, money} from "@/lib/api/contracts/primitives";

/** One gallery image: a file already stored in media-service. */
export const productImageRequestSchema = z
  .object({
    fileId: uuid,
    main: z.boolean(),
  })
  .strict();

/** A free `name: value` option such as Color: Blue. */
export const variantOptionRequestSchema = z
  .object({
    name: nonEmptyText.max(100),
    value: nonEmptyText.max(255),
  })
  .strict();

export const createProductVariantRequestSchema = z
  .object({
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
  })
  .strict();

/** The backend takes the status through its own call, so it is split off by the adapter. */
export const updateProductVariantRequestSchema = createProductVariantRequestSchema
  .extend({
    status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
  })
  .strict();

export const createProductRequestSchema = z
  .object({
    name: nonEmptyText.max(255),
    seoName: optionalText,
    brandId: optionalUuid,
    categoryId: uuid,
    description: optionalText,
    specifications: z.record(z.string(), z.unknown()).optional(),
    images: z.array(productImageRequestSchema).optional(),
  })
  .strict();

/** Omitting `images` keeps the gallery; a list (even an empty one) replaces it. */
export const updateProductRequestSchema = createProductRequestSchema;

export const createCategoryRequestSchema = z
  .object({
    name: nonEmptyText.max(255),
    seoName: optionalText,
    description: optionalText,
    parentId: optionalUuid,
    displayOrder: z.number().int().nonnegative().optional(),
    hardwareTypeCode: optionalText,
  })
  .strict();

export const updateCategoryRequestSchema = createCategoryRequestSchema
  .extend({
    status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
  })
  .strict();

export const reorderCategoriesRequestSchema = z
  .object({
    items: z.array(z.object({id: uuid, displayOrder: z.number().int().nonnegative()}).strict()).min(1),
  })
  .strict();

export const createBrandRequestSchema = z
  .object({
    name: nonEmptyText.max(255),
    seoName: optionalText,
    description: optionalText,
    imageFileId: optionalUuid,
  })
  .strict();

export const updateBrandRequestSchema = createBrandRequestSchema
  .extend({
    status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
  })
  .strict();

export const createSupplierRequestSchema = z
  .object({
    name: nonEmptyText,
    email: z.email().optional(),
    phone: phone.optional(),
    address: optionalText,
    description: optionalText,
  })
  .strict();

export const updateSupplierRequestSchema = createSupplierRequestSchema
  .extend({
    status: optionalEnum(EDITABLE_RESOURCE_STATUS_VALUES),
  })
  .strict();

export const createAttributeDefinitionRequestSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z][a-z0-9_]*$/, "key must be lower snake_case"),
    displayName: nonEmptyText.max(255),
    dataType: z.enum(ATTRIBUTE_DATA_TYPE_VALUES),
    unit: optionalText,
    allowedValues: z.array(nonEmptyText).optional(),
    aliases: z.array(nonEmptyText).optional(),
    filterable: z.boolean().optional(),
    comparable: z.boolean().optional(),
  })
  .strict();

/** The key and the data type are fixed once created: stored specifications are keyed and typed by them. */
export const updateAttributeDefinitionRequestSchema = createAttributeDefinitionRequestSchema
  .omit({
    key: true,
    dataType: true,
  })
  .strict();

export const replaceCategorySpecsRequestSchema = z
  .object({
    attributes: z.array(
      z
        .object({
          attributeId: uuid,
          required: z.boolean().optional(),
          displayOrder: z.number().int().nonnegative().optional(),
        })
        .strict(),
    ),
  })
  .strict();

export type ProductImageRequest = z.infer<typeof productImageRequestSchema>;
export type VariantOptionRequest = z.infer<typeof variantOptionRequestSchema>;
export type CreateProductVariantRequest = z.infer<typeof createProductVariantRequestSchema>;
export type UpdateProductVariantRequest = z.infer<typeof updateProductVariantRequestSchema>;
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type ReorderCategoriesRequest = z.infer<typeof reorderCategoriesRequestSchema>;
export type CreateBrandRequest = z.infer<typeof createBrandRequestSchema>;
export type UpdateBrandRequest = z.infer<typeof updateBrandRequestSchema>;
export type CreateSupplierRequest = z.infer<typeof createSupplierRequestSchema>;
export type UpdateSupplierRequest = z.infer<typeof updateSupplierRequestSchema>;
export type CreateAttributeDefinitionRequest = z.infer<typeof createAttributeDefinitionRequestSchema>;
export type UpdateAttributeDefinitionRequest = z.infer<typeof updateAttributeDefinitionRequestSchema>;
export type ReplaceCategorySpecsRequest = z.infer<typeof replaceCategorySpecsRequestSchema>;
