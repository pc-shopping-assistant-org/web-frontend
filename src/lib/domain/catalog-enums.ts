import {enumValues} from "@/lib/domain/enum-values";

export enum ResourceStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Deleted = "DELETED",
}

export enum ReviewStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Deleted = "DELETED",
}

export enum AttributeDataType {
  Number = "NUMBER",
  String = "STRING",
  Enum = "ENUM",
  Boolean = "BOOLEAN",
}

export enum SortDirection {
  Asc = "ASC",
  Desc = "DESC",
}

export type EditableResourceStatus = ResourceStatus.Active | ResourceStatus.Inactive;

export const RESOURCE_STATUS_VALUES = enumValues(ResourceStatus);
export const EDITABLE_RESOURCE_STATUS_VALUES = [
  ResourceStatus.Active,
  ResourceStatus.Inactive,
] as const;
export const REVIEW_STATUS_VALUES = enumValues(ReviewStatus);
export const ATTRIBUTE_DATA_TYPE_VALUES = enumValues(AttributeDataType);
