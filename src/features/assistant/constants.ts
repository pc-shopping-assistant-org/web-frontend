/** Owned wire limits mirror the AI contract; api:check guards generated references. */
export const STATEFUL_SCHEMA_VERSION = 2;
export const CONVERSATION_ID_PARAM = "conversationId";
export const CONVERSATION_HISTORY_PAGE_SIZE = 100;
export const RUN_RESULT_POLL_INTERVAL_MS = 1_000;
export const RUN_RESULT_MAX_TRANSPORT_FAILURES = 5;
export const RUN_RESULT_TRANSIENT_HTTP_STATUSES = [502, 503, 504] as const;
export const MAX_TURN_MESSAGE_CHARS = 4_000;
export const MAX_PRODUCT_QUESTION_CHARS = 1_000;
export const MIN_COMPARISON_PRODUCTS = 2;
export const MAX_SELECTED_PRODUCTS = 5;
// Search-service caps a page at 50; the picker uses the same size for its
// initial catalog list and keyword searches.
export const PRODUCT_PICKER_PAGE_SIZE = 50;
