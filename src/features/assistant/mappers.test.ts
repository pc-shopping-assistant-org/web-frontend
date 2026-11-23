import {expect, it} from "vitest";

import {AssistantTaskKind, FlexibleTurnStatus} from "@/lib/domain/assistant-enums";
import {mapProductCard, mapStatefulTurn} from "./mappers";

it("keeps an unavailable AI catalog price unknown instead of showing zero", () => {
  expect(mapProductCard({name: "GPU", list_price: null}).list_price).toBeUndefined();
  expect(mapProductCard({name: "GPU", list_price: 0}).list_price).toBe(0);
});

it("maps flexible task_outcomes kinds for context-aware UI rendering", () => {
  const mapped = mapStatefulTurn({
    schema_version: 2,
    revision: 3,
    run: {
      conversation_id: "00000000-0000-4000-8000-000000000001",
      run_id: "00000000-0000-4000-8000-000000000002",
      request_id: "00000000-0000-4000-8000-000000000003",
      status: "COMPLETED",
      base_revision: 2,
    },
    answer: "So sánh chi tiết hai sản phẩm.",
    products: [],
    flexible: {
      status: FlexibleTurnStatus.Completed,
      answer: "So sánh chi tiết hai sản phẩm.",
      task_outcomes: [{kind: AssistantTaskKind.Compare, status: "COMPLETED"}],
      proposal: null,
      clarification: null,
      task_clarification: null,
    },
    build: null,
  });

  expect(mapped.stateful?.taskKinds).toEqual([AssistantTaskKind.Compare]);
});
