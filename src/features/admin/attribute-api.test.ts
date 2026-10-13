import {afterEach, describe, expect, it, vi} from "vitest";

import {AttributeDataType} from "@/lib/domain/catalog-enums";

import {createAttribute, deleteAttribute, getAttributes, replaceCategorySpecs, updateAttribute} from "./api";

afterEach(() => vi.restoreAllMocks());

function stubFetch(...payloads: unknown[]) {
  const queue = [...payloads];
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify({data: queue.shift() ?? null, message: "SUCCESS", errors: []}), {
      status: 200,
      headers: {"content-type": "application/json"},
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const definition = {id: "a1", key: "ram_gb", displayName: "RAM", dataType: "NUMBER", unit: "GB", allowedValues: [], aliases: [], filterable: true, comparable: false};
const attribute = "00000000-0000-4000-8000-0000000000a1";
const category = "00000000-0000-4000-8000-0000000000c1";

describe("attribute definitions", () => {
  it("reads and writes through catalog-service attribute-definitions", async () => {
    const fetchMock = stubFetch([definition], definition, definition, null);

    const list = await getAttributes();
    await createAttribute({key: "ram_gb", displayName: "RAM", dataType: AttributeDataType.Number, unit: "GB"});
    await updateAttribute("a1", {displayName: "RAM size"});
    await deleteAttribute("a1");

    expect(list[0]).toMatchObject({key: "ram_gb", filterable: true});
    expect(fetchMock.mock.calls.map((call) => `${call[1]?.method ?? "GET"} ${call[0]}`)).toEqual([
      "GET /api/backend/catalog-service/attribute-definitions",
      "POST /api/backend/catalog-service/attribute-definitions",
      "PUT /api/backend/catalog-service/attribute-definitions/a1",
      "DELETE /api/backend/catalog-service/attribute-definitions/a1",
    ]);
  });

  it("rejects a key that is not lower snake_case and never sends the key or type of an update", async () => {
    const fetchMock = stubFetch(definition);

    expect(() => createAttribute({key: "RAM Size", displayName: "RAM", dataType: AttributeDataType.Number})).toThrow();
    await updateAttribute("a1", {displayName: "RAM size"});

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({displayName: "RAM size"});
  });
});

describe("category specification form", () => {
  it("replaces the whole form of a category in one call", async () => {
    const fetchMock = stubFetch({categoryId: category, groups: []});

    await replaceCategorySpecs(category, {groups: [{name: "General", displayOrder: 0, attributes: [{attributeId: attribute, required: true, displayOrder: 0}]}]});

    expect(fetchMock.mock.calls[0][0]).toBe(`/api/backend/catalog-service/categories/${category}/attributes`);
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).groups[0].attributes[0]).toEqual({attributeId: attribute, required: true, displayOrder: 0});
  });

  it("rejects a group without a name", () => {
    stubFetch(null);
    expect(() => replaceCategorySpecs(category, {groups: [{name: " ", attributes: []}]})).toThrow();
  });
});
