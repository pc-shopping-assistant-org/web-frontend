"use client";

import {useState} from "react";

/**
 * The backend pages forward only (`nextCursor`). This remembers the cursors of the pages already visited so the
 * UI can still go back; the trail starts over whenever `resetKey` (the filters) changes.
 */
export function useCursorTrail(resetKey: string) {
  const [state, setState] = useState<{key: string; cursors: (string | undefined)[]}>({key: resetKey, cursors: []});
  const cursors = state.key === resetKey ? state.cursors : [];
  return {
    hasPrev: cursors.length > 0,
    prevCursor: cursors[cursors.length - 1],
    /** Call before moving forward, with the cursor of the page being left. */
    push: (current?: string) => setState({key: resetKey, cursors: [...cursors, current]}),
    pop: () => setState({key: resetKey, cursors: cursors.slice(0, -1)}),
  };
}
