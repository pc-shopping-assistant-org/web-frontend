import {expect, it} from "vitest";

import {AssistantTaskKind, FlexibleTurnStatus, RequirementOperation, RequirementValueKind} from "@/lib/domain/assistant-enums";
import {formatProposalChange} from "./components/proposal-card";
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

it("splits unit clarification options into individual clickable chips", () => {
  const mapped = mapStatefulTurn({
    schema_version: 2,
    revision: 4,
    run: {
      conversation_id: "00000000-0000-4000-8000-000000000001",
      run_id: "00000000-0000-4000-8000-000000000002",
      request_id: "00000000-0000-4000-8000-000000000003",
      status: "WAITING_INPUT",
      base_revision: 3,
    },
    answer: "Bạn muốn RAM 32 theo đơn vị nào?",
    products: [],
    flexible: {
      status: FlexibleTurnStatus.WaitingInput,
      answer: "Bạn muốn RAM 32 theo đơn vị nào?",
      task_outcomes: [],
      proposal: null,
      clarification: {
        items: [
          {
            reason: "QUANTITY_UNIT_REQUIRED",
            quantity_amount: 32,
            options: [],
            unit_options: ["GB", "TB"],
          },
          {
            reason: "QUANTITY_UNIT_REQUIRED",
            quantity_amount: null,
            options: [],
            unit_options: ["MHz", "GHz"],
          },
        ],
      },
      task_clarification: null,
    },
    build: null,
  });

  expect(mapped.stateful?.clarificationOptions).toEqual(["32 GB", "32 TB", "MHz", "GHz"]);
});

it("maps proposal changes into structured items and formats them for humans without raw enums or UUIDs", () => {
  const hash = "a".repeat(64);
  const variantId = "00000000-0000-4000-8000-000000000099";
  const mapped = mapStatefulTurn({
    schema_version: 2,
    revision: 5,
    run: {
      conversation_id: "00000000-0000-4000-8000-000000000001",
      run_id: "00000000-0000-4000-8000-000000000002",
      request_id: "00000000-0000-4000-8000-000000000003",
      status: "WAITING_INPUT",
      base_revision: 4,
    },
    answer: "Xác nhận cập nhật yêu cầu?",
    products: [],
    flexible: {
      status: FlexibleTurnStatus.WaitingInput,
      answer: "Xác nhận cập nhật yêu cầu?",
      task_outcomes: [],
      proposal: {
        proposal_id: "00000000-0000-4000-8000-000000000010",
        proposal_hash: hash,
        target_revision: 4,
        base_requirements_hash: hash,
        changes: [
          {
            operation: RequirementOperation.Set,
            target: "REQUIREMENT",
            subject: "SETUP",
            predicate: "budget",
            operator: "LTE",
            strength: "HARD",
            value: {kind: RequirementValueKind.Quantity, amount: 25_000_000, unit: "VND"},
          },
          {
            operation: RequirementOperation.Set,
            target: "GOAL",
            subject: "WORKLOAD",
            predicate: "use_case",
            operator: "EQ",
            strength: "HARD",
            value: {kind: RequirementValueKind.Text, text: "GAMING_1440P"},
          },
          {
            operation: RequirementOperation.Clear,
            target: "REQUIREMENT",
            subject: "GPU",
            predicate: "identity",
            operator: "EQ",
            strength: "SOFT",
            value: {kind: RequirementValueKind.Reference, variant_id: variantId},
          },
        ],
      },
      clarification: null,
      task_clarification: null,
    },
    build: null,
  });

  const changes = mapped.stateful?.proposal?.changes ?? [];
  expect(changes).toHaveLength(3);
  expect(changes[0]).toMatchObject({
    operation: "SET",
    subject: "SETUP",
    predicate: "budget",
    operator: "LTE",
    value: {kind: "QUANTITY", amount: 25_000_000, unit: "VND"},
  });

  const t = (key: string, values?: Record<string, string | number>) => {
    const dict: Record<string, string> = {
      "proposal.predicates.budget": "Ngân sách",
      "proposal.predicates.use_case": "Nhu cầu sử dụng",
      "proposal.subjects.GPU": "Card đồ họa (GPU)",
      "proposal.predicates.identity": "Linh kiện cố định",
      "proposal.values.GAMING_1440P": "Chơi game 1440p (2K)",
      "proposal.selectedComponent": "Linh kiện đã chọn",
      "proposal.operators.LTE": `Tối đa ${values?.value ?? ""}`,
      "proposal.operators.GTE": `Tối thiểu ${values?.value ?? ""}`,
    };
    return dict[key] ?? key;
  };

  const budget = formatProposalChange(changes[0], t, "vi");
  expect(budget.label).toBe("Ngân sách");
  expect(budget.value).toContain("Tối đa");
  expect(budget.value).toContain("25.000.000");
  expect(budget.value).not.toContain("SET SETUP");

  const useCase = formatProposalChange(changes[1], t, "vi");
  expect(useCase).toEqual({
    label: "Nhu cầu sử dụng",
    value: "Chơi game 1440p (2K)",
    isClear: false,
    isSoft: false,
  });

  const clearedWithKnownPart = formatProposalChange(
    changes[2],
    t,
    "vi",
    new Map([[variantId, "RTX 4070 Super"]]),
  );
  expect(clearedWithKnownPart).toEqual({
    label: "Card đồ họa (GPU) · Linh kiện cố định",
    value: "RTX 4070 Super",
    isClear: true,
    isSoft: true,
  });

  const clearedFallback = formatProposalChange(changes[2], t, "vi");
  expect(clearedFallback.value).toBe("Linh kiện đã chọn");
  expect(clearedFallback.value).not.toContain(variantId);
});
