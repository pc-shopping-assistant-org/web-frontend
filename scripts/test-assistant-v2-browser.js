// Run: npx @playwright/cli -s=pcshop-v2 run-code --filename=scripts/test-assistant-v2-browser.js
// Browser-only API fixtures: no live identity, catalog, model or database writes.
/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI consumes a function expression. */
async page => {
  const conversationId = "00000000-0000-4000-8000-000000000001";
  let revision = 0;
  let submitted;
  const requests = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const proposal = {
    proposal_id: "00000000-0000-4000-8000-000000000005",
    proposal_hash: "a".repeat(64), target_revision: 1,
    base_requirements_hash: "b".repeat(64), changes: [{operation: "SET", target: "REQUIREMENT", subject: "RAM", predicate: "capacity", value: {kind: "QUANTITY", amount: 32, unit: "GB"}}],
  };
  const wrap = data => ({data, message: "SUCCESS", errors: []});
  const view = () => ({schema_version: 2, conversation_id: conversationId, revision});
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/ai/")) requests.push({path, method: request.method()});
    if (path === "/api/ai/conversations" || path === "/api/ai/conversations/" + conversationId) {
      return route.fulfill({json: wrap(view())});
    }
    if (path.endsWith("/runs")) {
      submitted = request.postDataJSON();
      if (submitted.schema_version !== 2 || submitted.expected_revision !== revision) throw new Error("Wrong V2 admission");
      if (revision === 1 && submitted.confirmation?.proposal_hash !== proposal.proposal_hash) throw new Error("Wrong proposal confirmation");
      return route.fulfill({json: wrap({conversation_id: conversationId, run_id: conversationId,
        request_id: submitted.request_id, base_revision: revision, status: "PENDING"})});
    }
    if (path.endsWith("/events")) {
      const run = {conversation_id: conversationId, run_id: conversationId,
        request_id: submitted.request_id, base_revision: revision, status: revision === 0 ? "WAITING_INPUT" : "COMPLETED"};
      revision++;
      const answer = revision === 1 ? "Đề xuất fixture cần xác nhận." : "Đã xác nhận fixture qua ReAct V2.";
      const result = {schema_version: 2, run, revision, answer, build: null,
        flexible: {status: revision === 1 ? "WAITING_INPUT" : "COMPLETED", answer,
          proposal: revision === 1 ? proposal : null}};
      const events = [{event: "START", sequence: 1, run},
        {event: "DELTA", sequence: 2, delta: answer},
        {event: "COMPLETED", sequence: 3, result}];
      const body = events.map(event => "event: " + event.event.toLowerCase() + "\ndata: " + JSON.stringify(wrap({...event, conversation_id: conversationId, run_id: conversationId})) + "\n\n").join("");
      return route.fulfill({contentType: "text/event-stream", body});
    }
    return route.fulfill({json: wrap({items: [], nextCursor: null, hasNext: false})});
  });
  await page.goto("http://localhost:3100/vi/assistant");
  await page.getByRole("button", {name: "Cuộc trò chuyện mới", exact: true}).click();
  await page.locator("textarea").pressSequentially("Build gaming 25 triệu");
  await page.getByRole("button", {name: /^Gửi/}).click();
  await page.getByText("Đề xuất fixture cần xác nhận.", {exact: true}).waitFor();
  await page.getByText("SET RAM / capacity: 32 GB", {exact: true}).waitFor();
  await page.getByRole("button", {name: "Xác nhận đề xuất", exact: true}).click();
  await page.getByText("Đã xác nhận fixture qua ReAct V2.", {exact: true}).waitFor();
  if (requests.some(request => request.path.includes("/chat"))) throw new Error("Legacy caller used");
  if (requests.filter(request => request.path.endsWith("/events")).length !== 2) throw new Error("Unexpected reconnect");
  if (errors.length) throw new Error(errors.join("; "));
  return {turns: revision, requests, pageErrors: errors};
}
