import {describe, expect, it} from "vitest";

import {isAdminRole, isEmployeeRole, isStaffRole} from "./roles";

describe("role boundaries", () => {
  it("accepts canonical and legacy staff role casing", () => {
    expect(isStaffRole("ROLE_ADMIN")).toBe(true);
    expect(isStaffRole("employee")).toBe(true);
    expect(isStaffRole(" role_manager ")).toBe(true);
  });

  it("lets only the admin through to the admin-only flows", () => {
    expect(isAdminRole("ROLE_ADMIN")).toBe(true);
    expect(isAdminRole(" admin ")).toBe(true);
    expect(isAdminRole("ROLE_EMPLOYEE")).toBe(false);
    expect(isAdminRole("ROLE_MANAGER")).toBe(false);
    expect(isAdminRole("CUSTOMER")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });

  it("lets only the employee through to the employee-only flows", () => {
    expect(isEmployeeRole("ROLE_EMPLOYEE")).toBe(true);
    expect(isEmployeeRole(" employee ")).toBe(true);
    expect(isEmployeeRole("ROLE_ADMIN")).toBe(false);
    expect(isEmployeeRole("ROLE_MANAGER")).toBe(false);
    expect(isEmployeeRole("CUSTOMER")).toBe(false);
    expect(isEmployeeRole(undefined)).toBe(false);
  });

  it("keeps customer and missing roles out of staff-only flows", () => {
    expect(isStaffRole("CUSTOMER")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });
});
