import {describe, expect, it} from "vitest";

import {Gender, type EmployeeGender} from "@/lib/domain/account-enums";

import {employeeFormValues, toCreateRequest, toUpdateRequest} from "./employee-form-values";
import type {Employee} from "./models";

const employee: Employee = {
  accountId: "a",
  email: "emp@pcshop.local",
  phone: "0900000002",
  status: "ACTIVE",
  firstName: "Minh",
  lastName: "Tran",
  fullName: "Tran Minh",
  gender: "MALE",
  address: "Hanoi",
  avatarFileId: "f1",
};

describe("employee form values", () => {
  it("sends nothing for an edit that changed nothing", () => {
    expect(toUpdateRequest(employeeFormValues(employee), employee)).toEqual({});
  });

  it("sends only the fields that changed, and an address emptied on purpose", () => {
    const values = {
      ...employeeFormValues(employee),
      phone: "0911111111",
      gender: Gender.Female as EmployeeGender,
      address: "  ",
      avatarFileId: "f2",
    };
    expect(toUpdateRequest(values, employee)).toEqual({phone: "0911111111", gender: "FEMALE", address: "  ", avatarFileId: "f2"});
  });

  it("does not send a birthday that was cleared, which the backend cannot take back", () => {
    const withBirthday = {...employee, birthday: "1990-01-01"};
    expect(toUpdateRequest({...employeeFormValues(withBirthday), birthday: ""}, withBirthday)).toEqual({});
  });

  it("leaves the optional fields out of a new employee when they are blank", () => {
    const values = {...employeeFormValues(employee), password: "Passw0rdOk", address: " ", avatarFileId: undefined};
    expect(toCreateRequest(values)).toMatchObject({
      email: "emp@pcshop.local",
      password: "Passw0rdOk",
      address: undefined,
      birthday: undefined,
      avatarFileId: undefined,
    });
  });
});
