import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, expect, it, vi} from "vitest";

import {CategoryManagement} from "./category-management";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => Object.assign(
    (key: string, values?: {name?: string}) => values?.name ? `${key} ${values.name}` : key,
    {has: () => true},
  ),
}));

const firstId = "00000000-0000-4000-8000-000000000001";
const secondId = "00000000-0000-4000-8000-000000000002";
const childId = "00000000-0000-4000-8000-000000000003";
const categories = [
  {id: firstId, name: "CPU", seoName: "cpu", status: "ACTIVE", hardwareType: "CPU", displayOrder: 10},
  {id: secondId, name: "PC Gaming", seoName: "pc-gaming", status: "ACTIVE", hardwareType: "PC_GAMING", displayOrder: 20},
  {id: childId, name: "Child", seoName: "child", status: "ACTIVE", hardwareType: "OTHER", parentId: firstId, displayOrder: 10},
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const fetchMock = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    const data = url.endsWith("/hardware-types")
      ? [{id: firstId, code: "PC_GAMING", nameVi: "Máy tính chơi game", nameEn: "Gaming PC", displayOrder: 10}]
      : options?.method === "POST" ? {...categories[0], ...JSON.parse(String(options.body))} : categories;
    return new Response(JSON.stringify({data, message: "SUCCESS", errors: []}), {
      status: 200, headers: {"content-type": "application/json"},
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}})}>
      <CategoryManagement />
    </QueryClientProvider>,
  );
  return {fetchMock, user: userEvent.setup()};
}

it("saves sibling order after dragging and refuses a drop across parents", async () => {
  const {fetchMock} = setup();
  const handle = await screen.findByTitle("dragCategory PC Gaming");
  const dataTransfer = {setData: vi.fn(), effectAllowed: ""};
  fireEvent.dragStart(handle, {dataTransfer});
  fireEvent.drop(screen.getByText("Child").closest("tr")!);
  expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "PUT")).toHaveLength(0);

  fireEvent.dragStart(handle, {dataTransfer});
  fireEvent.drop(screen.getByText("CPU").closest("tr")!);

  await waitFor(() => expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "PUT")).toHaveLength(1));
  const [url, options] = fetchMock.mock.calls.find(([, options]) => options?.method === "PUT")!;
  expect(url).toBe("/api/backend/catalog-service/categories/order");
  expect(JSON.parse(options.body)).toEqual({items: [
    {id: secondId, displayOrder: 10}, {id: firstId, displayOrder: 20},
  ]});
});

it("loads localized hardware master data and sends the selected code when creating a category", async () => {
  const {fetchMock, user} = setup();
  await screen.findByText("CPU");
  await user.click(screen.getByRole("button", {name: "addNew"}));
  await screen.findByRole("option", {name: "Máy tính chơi game"});
  await user.type(screen.getByRole("textbox", {name: /name/}), "New gaming category");
  await user.selectOptions(screen.getByRole("combobox", {name: "hardwareType"}), "PC_GAMING");
  await user.click(screen.getByRole("button", {name: "create"}));

  await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === "POST")).toBe(true));
  const [, options] = fetchMock.mock.calls.find(([, options]) => options?.method === "POST")!;
  expect(JSON.parse(options.body)).toMatchObject({hardwareTypeCode: "PC_GAMING", displayOrder: 0});
});
