import {describe, expect, it} from "vitest";

import {isStaffRole} from "./roles";

describe("role boundaries", () => {
  it("accepts canonical and legacy staff role casing", () => {
    expect(isStaffRole("ROLE_ADMIN")).toBe(true);
    expect(isStaffRole("employee")).toBe(true);
    expect(isStaffRole(" role_manager ")).toBe(true);
  });

  it("keeps customer and missing roles out of staff-only flows", () => {
    expect(isStaffRole("CUSTOMER")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(isStaffRole(null)).toBe(false);
  });
});
