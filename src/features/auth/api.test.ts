import {afterEach, describe, expect, it, vi} from "vitest";

import {ApiClientError} from "@/lib/api/envelope";

import {changePassword, getProfile, login, register, verifyPasswordChange} from "./api";

afterEach(() => vi.restoreAllMocks());

function stubFetch(data: unknown, message = "SUCCESS", status = 200) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data, message, errors: []}), {status, headers: {"content-type": "application/json"}}),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const summary = {
  accountId: "00000000-0000-4000-8000-000000000001",
  email: "an@example.com",
  phone: "0911222333",
  role: "ROLE_CUSTOMER",
  firstName: "An",
  lastName: "Nguyễn",
  gender: "FEMALE",
  birthday: "1999-05-20",
};

describe("auth API", () => {
  it("logs in through the BFF and shows the family name first", async () => {
    const fetchMock = stubFetch({accessToken: "a", refreshToken: "r", tokenType: "Bearer", expiresIn: 86400, user: summary});

    const result = await login({identifier: "an@example.com", password: "Passw0rdA"});

    expect(fetchMock).toHaveBeenCalledWith("/api/backend/auth/login", expect.objectContaining({method: "POST"}));
    expect(result.user?.fullName).toBe("Nguyễn An");
  });

  it("reads the profile from identity-service with gender and birthday", async () => {
    const fetchMock = stubFetch(summary);

    const profile = await getProfile();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/identity-service/profile");
    expect(profile).toMatchObject({gender: "FEMALE", birthday: "1999-05-20", fullName: "Nguyễn An"});
  });

  it("registers with separate first and last names", async () => {
    const fetchMock = stubFetch(null);

    await register({firstName: "An", lastName: "Nguyễn", email: "an@example.com", phone: "0911222333", password: "Passw0rdA", address: "12 Lê Lợi"});

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({firstName: "An", lastName: "Nguyễn"});
  });

  it("changes a password in two steps", async () => {
    const fetchMock = stubFetch(null);

    await changePassword({currentPassword: "Passw0rdA", newPassword: "NewPassw0rd"});
    await verifyPasswordChange({otp: "123456"});

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/backend/auth/change-password",
      "/api/backend/auth/verify-password-change",
    ]);
  });

  it("rejects a malformed request before calling the backend", async () => {
    const fetchMock = stubFetch(null);

    expect(() => verifyPasswordChange({otp: "12"})).toThrow(ApiClientError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the backend error key for the UI to translate", async () => {
    stubFetch(null, "INVALID_CREDENTIALS", 401);

    await expect(login({identifier: "an@example.com", password: "x"})).rejects.toMatchObject({status: 401, messageKey: "INVALID_CREDENTIALS"});
  });
});
