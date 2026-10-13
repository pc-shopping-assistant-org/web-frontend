import {backendFetch} from "@/lib/api/client";
import {parseRequest} from "@/lib/api/parse-request";

import {createEmployeeRequestSchema, updateEmployeeRequestSchema, type CreateEmployeeRequest, type UpdateEmployeeRequest} from "./contracts/requests";
import type {EmployeeDto, EmployeePageDto} from "./contracts/dto";
import {mapEmployee, mapEmployeePage} from "./mappers";

const IDENTITY = "/identity-service";

export type EmployeeFilters = {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
};

const employeeUrl = (accountId: string) => `${IDENTITY}/employees/${encodeURIComponent(accountId)}`;

/** Employees by page, narrowed by the keyword and status the admin typed; the empty ones are dropped. */
export async function getEmployees(filters: EmployeeFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return mapEmployeePage(await backendFetch<EmployeePageDto>(`${IDENTITY}/employees${params.size ? `?${params.toString()}` : ""}`));
}

export async function getEmployee(accountId: string) {
  return mapEmployee(await backendFetch<EmployeeDto>(employeeUrl(accountId)));
}

export async function createEmployee(request: CreateEmployeeRequest) {
  const payload = parseRequest(createEmployeeRequestSchema, request);
  return mapEmployee(await backendFetch<EmployeeDto>(`${IDENTITY}/employees`, {method: "POST", body: JSON.stringify(payload)}));
}

export async function updateEmployee(accountId: string, request: UpdateEmployeeRequest) {
  const payload = parseRequest(updateEmployeeRequestSchema, request);
  return mapEmployee(await backendFetch<EmployeeDto>(employeeUrl(accountId), {method: "PATCH", body: JSON.stringify(payload)}));
}

/** Switches an active employee off; they cannot sign in until they are activated again. */
export async function deactivateEmployee(accountId: string) {
  return mapEmployee(await backendFetch<EmployeeDto>(`${employeeUrl(accountId)}/deactivate`, {method: "POST"}));
}

/** Brings back an employee that was switched off; a locked one stays locked. */
export async function activateEmployee(accountId: string) {
  return mapEmployee(await backendFetch<EmployeeDto>(`${employeeUrl(accountId)}/activate`, {method: "POST"}));
}

/** The employee stays in the backend as deleted, out of the list, and cannot be brought back. */
export async function deleteEmployee(accountId: string) {
  await backendFetch<null>(employeeUrl(accountId), {method: "DELETE"});
}

/** There is no way back: the backend has no unlock. */
export async function lockEmployee(accountId: string) {
  return mapEmployee(await backendFetch<EmployeeDto>(`${employeeUrl(accountId)}/lock`, {method: "POST"}));
}
