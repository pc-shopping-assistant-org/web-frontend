import {expect, it} from "vitest";
import {streamChat} from "./api";
import {streamChat as statefulStreamChat} from "./stateful-api";

it("routes the public chat caller to ReAct V2, not legacy chat", () => {
  expect(streamChat).toBe(statefulStreamChat);
});
