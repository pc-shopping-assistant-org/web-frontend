import {AccountRole} from "@/lib/domain/account-enums";

const STAFF_ROLES = new Set<string>(Object.values(AccountRole));

export function isStaffRole(role: string | null | undefined) {
  return Boolean(role && STAFF_ROLES.has(role.trim().toUpperCase()));
}
