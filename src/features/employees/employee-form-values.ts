import {Gender, type EmployeeGender} from "@/lib/domain/account-enums";

import type {CreateEmployeeRequest, UpdateEmployeeRequest} from "./contracts/requests";
import type {Employee} from "./models";

/** What the form holds while the admin types: every field as text. */
export type EmployeeFormValues = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: EmployeeGender;
  birthday: string;
  address: string;
  avatarFileId?: string;
  avatarUrl?: string;
};

export function emptyEmployeeFormValues(): EmployeeFormValues {
  return {email: "", phone: "", password: "", firstName: "", lastName: "", gender: Gender.Male, birthday: "", address: ""};
}

export function employeeFormValues(employee: Employee): EmployeeFormValues {
  return {
    email: employee.email,
    phone: employee.phone,
    password: "",
    firstName: employee.firstName,
    lastName: employee.lastName,
    gender: employee.gender === Gender.Female ? Gender.Female : Gender.Male,
    birthday: employee.birthday ?? "",
    address: employee.address ?? "",
    avatarFileId: employee.avatarFileId,
    avatarUrl: employee.avatarUrl,
  };
}

export function toCreateRequest(values: EmployeeFormValues): CreateEmployeeRequest {
  return {
    email: values.email,
    phone: values.phone,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    gender: values.gender,
    birthday: values.birthday || undefined,
    address: values.address.trim() || undefined,
    avatarFileId: values.avatarFileId,
  };
}

/**
 * Only what the admin changed is sent: the backend keeps what is left out, and an untouched email or phone would
 * be checked against the other accounts for nothing. A birthday cannot be taken back, so a cleared one is left out.
 */
export function toUpdateRequest(values: EmployeeFormValues, employee: Employee): UpdateEmployeeRequest {
  const request: UpdateEmployeeRequest = {};
  if (values.email.trim() !== employee.email) request.email = values.email;
  if (values.phone.trim() !== employee.phone) request.phone = values.phone;
  if (values.firstName.trim() !== employee.firstName) request.firstName = values.firstName;
  if (values.lastName.trim() !== employee.lastName) request.lastName = values.lastName;
  if (values.gender !== employee.gender) request.gender = values.gender;
  if (values.birthday && values.birthday !== (employee.birthday ?? "")) request.birthday = values.birthday;
  if (values.address.trim() !== (employee.address ?? "")) request.address = values.address;
  if (values.avatarFileId && values.avatarFileId !== employee.avatarFileId) request.avatarFileId = values.avatarFileId;
  return request;
}
