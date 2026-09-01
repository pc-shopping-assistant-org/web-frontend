export type SseFrame<T> = {
  event: string;
  data: T;
  id?: string;
};

/**
 * Parse a server-sent event stream without coupling the transport to a
 * feature. The caller owns JSON/schema validation for each data payload.
 */
export async function* parseSse<T>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseFrame<T>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const {done, value} = await reader.read();
      buffer += decoder.decode(value, {stream: !done});
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const parsed = parseFrame<T>(frame);
        if (parsed) yield parsed;
      }
      if (done) break;
    }

    const parsed = parseFrame<T>(buffer);
    if (parsed) yield parsed;
  } finally {
    reader.releaseLock();
  }
}

function parseFrame<T>(frame: string): SseFrame<T> | null {
  const eventLines = frame.replaceAll("\r\n", "\n").split("\n");
  let event = "message";
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const line of eventLines) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator >= 0 ? line.slice(0, separator) : line;
    const rawValue = separator >= 0 ? line.slice(separator + 1) : "";
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
    if (field === "event") event = value || "message";
    else if (field === "id") id = value;
    else if (field === "data") dataLines.push(value);
  }

  if (dataLines.length === 0) return null;
  try {
    return {event, data: JSON.parse(dataLines.join("\n")) as T, ...(id ? {id} : {})};
  } catch {
    throw new Error("SSE data is not valid JSON");
  }
}
