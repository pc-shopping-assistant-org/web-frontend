import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {ApiClientError} from "@/lib/api/envelope";
import type {MessageKey} from "@/lib/api/contracts/common";

import {ErrorMessage} from "./error-message";

const translated: Record<string, string> = {
  GOOGLE_ACCOUNT_NOT_LINKED: "Hãy liên kết Google với tài khoản đã đăng ký trước.",
  VALIDATION_ERROR: "Dữ liệu chưa hợp lệ.",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) =>
    Object.assign((key: string) => (namespace === "common" ? "Có lỗi xảy ra." : translated[key]), {
      has: (key: string) => key in translated,
    }),
}));

afterEach(cleanup);

const failure = (key: string, message: string) => new ApiClientError(401, key as MessageKey, [{code: key, message}]);

it("shows only the translation when the error has one, not the backend's English wording", () => {
  render(<ErrorMessage error={failure("GOOGLE_ACCOUNT_NOT_LINKED", "Google account is not linked to any local account")} />);

  expect(screen.getByText("Hãy liên kết Google với tài khoản đã đăng ký trước.")).toBeInTheDocument();
  expect(screen.queryByText(/not linked to any local account/)).not.toBeInTheDocument();
});

it("keeps the validation detail, since it is the only thing that says which field is wrong", () => {
  render(<ErrorMessage error={failure("VALIDATION_ERROR", "Invalid phone number format")} />);

  expect(screen.getByText("Dữ liệu chưa hợp lệ.")).toBeInTheDocument();
  expect(screen.getByText("Invalid phone number format")).toBeInTheDocument();
});

it("shows the backend detail for an error nobody translated, so it is not a bare generic message", () => {
  render(<ErrorMessage error={failure("SOMETHING_NEW", "Something specific went wrong")} />);

  expect(screen.getByText("Có lỗi xảy ra.")).toBeInTheDocument();
  expect(screen.getByText("Something specific went wrong")).toBeInTheDocument();
});

it("shows just the generic message for an error that is not from the API", () => {
  render(<ErrorMessage error={new Error("boom")} />);

  expect(screen.getByRole("alert")).toHaveTextContent("Có lỗi xảy ra.");
  expect(screen.queryByText("boom")).not.toBeInTheDocument();
});
