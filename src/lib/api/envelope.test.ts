import {describe, expect, it} from "vitest";

import {ApiClientError, envelope, parseApiResponse} from "./envelope";

describe("API envelope", () => {
  it("keeps the stable data/message/errors contract", () => {
    expect(envelope({id: "1"}, "SUCCESS")).toEqual({data: {id: "1"}, message: "SUCCESS", errors: []});
  });

  it("parses a valid envelope without moving details into message", () => {
    expect(parseApiResponse({data: null, message: "VALIDATION_ERROR", errors: [{field: "email"}]})).toEqual({
      data: null,
      message: "VALIDATION_ERROR",
      errors: [{field: "email"}],
    });
  });

  it("rejects malformed upstream payloads with a static key", () => {
    expect(() => parseApiResponse({data: {}, message: "bad"})).toThrowError(ApiClientError);
    try {
      parseApiResponse({data: {}, message: "bad"});
    } catch (error) {
      expect(error).toMatchObject({messageKey: "SERVICE_UNAVAILABLE", status: 502});
    }
  });
});
