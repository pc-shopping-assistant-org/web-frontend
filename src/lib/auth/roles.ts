import {AccountRole} from "@/lib/domain/account-enums";

const STAFF_ROLES = new Set<string>(Object.values(AccountRole));
const ADMIN_ROLES = new Set<string>([AccountRole.Admin, AccountRole.LegacyAdmin]);
const EMPLOYEE_ROLES = new Set<string>([AccountRole.Employee, AccountRole.LegacyEmployee]);

export function isStaffRole(role: string | null | undefined) {
  return Boolean(role && STAFF_ROLES.has(role.trim().toUpperCase()));
}

/** The admin alone manages the employees; the other staff roles run the shop. */
export function isAdminRole(role: string | null | undefined) {
  return Boolean(role && ADMIN_ROLES.has(role.trim().toUpperCase()));
}

/** The employee alone runs the customers; the backend refuses the admin there. */
export function isEmployeeRole(role: string | null | undefined) {
  return Boolean(role && EMPLOYEE_ROLES.has(role.trim().toUpperCase()));
}
