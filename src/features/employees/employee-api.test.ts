import {afterEach, describe, expect, it, vi} from "vitest";

import {Gender} from "@/lib/domain/account-enums";

import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  getEmployee,
  getEmployees,
  lockEmployee,
  updateEmployee,
} from "./api";

afterEach(() => vi.restoreAllMocks());

const ID = "00000000-0000-4000-8000-000000000001";
const AVATAR = "00000000-0000-4000-8000-000000000002";

function stubFetch(payload: unknown) {
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify({data: payload, message: "SUCCESS", errors: []}), {
          status: 200,
          headers: {"content-type": "application/json"},
        }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const employee = {
  accountId: ID,
  email: "emp@pcshop.local",
  phone: "0900000002",
  status: "ACTIVE",
  firstName: "Minh",
  lastName: "Tran",
  gender: "MALE",
  birthday: null,
  address: null,
  avatarFileId: null,
  avatarUrl: null,
  createdAt: "2026-10-08T00:00:00Z",
};

const valid = {
  email: " New@PcShop.local ",
  phone: "0912345678",
  password: "Passw0rdOk",
  firstName: " An ",
  lastName: "Nguyen",
  gender: Gender.Female as const,
};

describe("employee api", () => {
  it("lists employees by page with the keyword and status, and drops the empty filters", async () => {
    const fetchMock = stubFetch({content: [employee], page: 1, size: 20, totalElements: 41, totalPages: 3, last: false});
    const page = await getEmployees({page: 1, size: 20, keyword: "minh", status: "LOCKED"});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/identity-service/employees?page=1&size=20&keyword=minh&status=LOCKED");
    expect(page).toMatchObject({page: 1, totalPages: 3, last: false});
    expect(page.items[0]).toMatchObject({accountId: ID, fullName: "Tran Minh", birthday: undefined, avatarUrl: undefined});

    await getEmployees({keyword: "", status: undefined});
    expect(fetchMock.mock.calls[1][0]).toBe("/api/backend/identity-service/employees");
  });

  it("reads one employee", async () => {
    const fetchMock = stubFetch({...employee, avatarFileId: AVATAR, avatarUrl: "http://m/a.png"});
    expect(await getEmployee(ID)).toMatchObject({accountId: ID, avatarFileId: AVATAR, avatarUrl: "http://m/a.png"});
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/identity-service/employees/${ID}`);
  });

  it("creates an employee with a trimmed body and no role", async () => {
    const fetchMock = stubFetch(employee);
    await createEmployee(valid);
    expect(fetchMock.mock.calls[0]).toEqual(["/api/backend/identity-service/employees", expect.objectContaining({method: "POST"})]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "New@PcShop.local",
      phone: "0912345678",
      password: "Passw0rdOk",
      firstName: "An",
      lastName: "Nguyen",
      gender: "FEMALE",
    });
  });

  it("refuses a bad employee before it is sent", async () => {
    const fetchMock = stubFetch(employee);
    await expect(createEmployee({...valid, email: "nope"})).rejects.toThrow();
    await expect(createEmployee({...valid, phone: "123"})).rejects.toThrow();
    await expect(createEmployee({...valid, password: "alllowercase1"})).rejects.toThrow();
    await expect(createEmployee({...valid, password: "Short1a"})).rejects.toThrow();
    await expect(createEmployee({...valid, firstName: "   "})).rejects.toThrow();
    await expect(createEmployee({...valid, gender: "OTHER" as never})).rejects.toThrow();
    await expect(createEmployee({...valid, birthday: "2999-01-01"})).rejects.toThrow();
    await expect(createEmployee({...valid, address: "x".repeat(256)})).rejects.toThrow();
    await expect(createEmployee({...valid, role: "ROLE_ADMIN"} as never)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("edits with a PATCH of only the fields given, and needs at least one", async () => {
    const fetchMock = stubFetch(employee);
    await updateEmployee(ID, {phone: "0987654321", avatarFileId: AVATAR});
    expect(fetchMock.mock.calls[0]).toEqual([
      `/api/backend/identity-service/employees/${ID}`,
      expect.objectContaining({method: "PATCH", body: JSON.stringify({phone: "0987654321", avatarFileId: AVATAR})}),
    ]);

    await expect(updateEmployee(ID, {})).rejects.toThrow();
    await expect(updateEmployee(ID, {firstName: "  "})).rejects.toThrow();
    await expect(updateEmployee(ID, {role: "ROLE_ADMIN"} as never)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("locks with a POST", async () => {
    const fetchMock = stubFetch({...employee, status: "LOCKED"});
    expect(await lockEmployee(ID)).toMatchObject({status: "LOCKED"});
    expect(fetchMock.mock.calls[0]).toEqual([
      `/api/backend/identity-service/employees/${ID}/lock`,
      expect.objectContaining({method: "POST"}),
    ]);
  });
  it("switches an employee off and on with a POST each", async () => {
    const fetchMock = stubFetch({...employee, status: "INACTIVE"});
    expect(await deactivateEmployee(ID)).toMatchObject({status: "INACTIVE"});
    await activateEmployee(ID);
    expect(fetchMock.mock.calls.map((call) => [call[0], call[1].method])).toEqual([
      [`/api/backend/identity-service/employees/${ID}/deactivate`, "POST"],
      [`/api/backend/identity-service/employees/${ID}/activate`, "POST"],
    ]);
  });

  it("deletes with a DELETE and expects no employee back", async () => {
    const fetchMock = stubFetch(null);
    await expect(deleteEmployee(ID)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]).toEqual([`/api/backend/identity-service/employees/${ID}`, expect.objectContaining({method: "DELETE"})]);
  });
});
