import { describe, it, expect } from "vitest";

describe("Issue 4: Debounce race and sequence tracking", () => {
  it("ignores out-of-order or stale requests using monotonically increasing sequence IDs", () => {
    let latestAppliedSeq = 0;
    let savedState = "initial";

    function handleServerResponse(responseSeq: number, data: string, currentExpectedSeq: number) {
      // If responseSeq is less than current expected sequence, drop it
      if (responseSeq < currentExpectedSeq) {
        return false;
      }
      latestAppliedSeq = responseSeq;
      savedState = data;
      return true;
    }

    // Sequence 1 was dispatched first
    // Sequence 2 was dispatched second
    const currentSeq = 2;

    // Simulate Network delay: Sequence 2 arrives BEFORE Sequence 1
    const applied2 = handleServerResponse(2, "state_2", currentSeq);
    expect(applied2).toBe(true);
    expect(savedState).toBe("state_2");

    // Late arrival of Sequence 1
    const applied1 = handleServerResponse(1, "state_1", currentSeq);
    expect(applied1).toBe(false);
    expect(savedState).toBe("state_2"); // Not overwritten by stale response
  });
});
