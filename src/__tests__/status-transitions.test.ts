import { describe, it, expect } from "vitest";
import {
  isValidStatusTransition,
  getAllowedNextStatuses,
} from "@/lib/validation";

// ─── isValidStatusTransition ────────────────────────────

describe("isValidStatusTransition", () => {
  // ── Forward transitions (happy path) ─────────────────
  it("allows NOT_STARTED -> RESEARCHING", () => {
    expect(isValidStatusTransition("NOT_STARTED", "RESEARCHING")).toBe(true);
  });

  it("allows RESEARCHING -> DRAFTING", () => {
    expect(isValidStatusTransition("RESEARCHING", "DRAFTING")).toBe(true);
  });

  it("allows DRAFTING -> SUBMITTED", () => {
    expect(isValidStatusTransition("DRAFTING", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED -> UNDER_REVIEW", () => {
    expect(isValidStatusTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows UNDER_REVIEW -> APPROVED", () => {
    expect(isValidStatusTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
  });

  it("allows UNDER_REVIEW -> REJECTED", () => {
    expect(isValidStatusTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
  });

  // ── Closing from any status ──────────────────────────
  it("allows NOT_STARTED -> CLOSED", () => {
    expect(isValidStatusTransition("NOT_STARTED", "CLOSED")).toBe(true);
  });

  it("allows RESEARCHING -> CLOSED", () => {
    expect(isValidStatusTransition("RESEARCHING", "CLOSED")).toBe(true);
  });

  it("allows DRAFTING -> CLOSED", () => {
    expect(isValidStatusTransition("DRAFTING", "CLOSED")).toBe(true);
  });

  it("allows SUBMITTED -> CLOSED", () => {
    expect(isValidStatusTransition("SUBMITTED", "CLOSED")).toBe(true);
  });

  it("allows UNDER_REVIEW -> CLOSED", () => {
    expect(isValidStatusTransition("UNDER_REVIEW", "CLOSED")).toBe(true);
  });

  it("allows APPROVED -> CLOSED", () => {
    expect(isValidStatusTransition("APPROVED", "CLOSED")).toBe(true);
  });

  it("allows REJECTED -> CLOSED", () => {
    expect(isValidStatusTransition("REJECTED", "CLOSED")).toBe(true);
  });

  // ── Same-status transitions (no-op, always valid) ────
  it("allows same status (no change) for all statuses", () => {
    const statuses = [
      "NOT_STARTED", "RESEARCHING", "DRAFTING", "SUBMITTED",
      "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED",
    ];
    for (const s of statuses) {
      expect(isValidStatusTransition(s, s)).toBe(true);
    }
  });

  // ── Terminal state: CLOSED cannot go anywhere ────────
  it("prevents CLOSED -> NOT_STARTED", () => {
    expect(isValidStatusTransition("CLOSED", "NOT_STARTED")).toBe(false);
  });

  it("prevents CLOSED -> RESEARCHING", () => {
    expect(isValidStatusTransition("CLOSED", "RESEARCHING")).toBe(false);
  });

  it("prevents CLOSED -> APPROVED", () => {
    expect(isValidStatusTransition("CLOSED", "APPROVED")).toBe(false);
  });

  // ── Backward transitions are blocked ─────────────────
  it("prevents DRAFTING -> NOT_STARTED", () => {
    expect(isValidStatusTransition("DRAFTING", "NOT_STARTED")).toBe(false);
  });

  it("prevents DRAFTING -> RESEARCHING", () => {
    expect(isValidStatusTransition("DRAFTING", "RESEARCHING")).toBe(false);
  });

  it("prevents SUBMITTED -> DRAFTING", () => {
    expect(isValidStatusTransition("SUBMITTED", "DRAFTING")).toBe(false);
  });

  it("prevents SUBMITTED -> NOT_STARTED", () => {
    expect(isValidStatusTransition("SUBMITTED", "NOT_STARTED")).toBe(false);
  });

  it("prevents UNDER_REVIEW -> SUBMITTED", () => {
    expect(isValidStatusTransition("UNDER_REVIEW", "SUBMITTED")).toBe(false);
  });

  it("prevents APPROVED -> UNDER_REVIEW", () => {
    expect(isValidStatusTransition("APPROVED", "UNDER_REVIEW")).toBe(false);
  });

  it("prevents REJECTED -> UNDER_REVIEW", () => {
    expect(isValidStatusTransition("REJECTED", "UNDER_REVIEW")).toBe(false);
  });

  // ── Skipping stages is blocked ───────────────────────
  it("prevents NOT_STARTED -> SUBMITTED (skipping stages)", () => {
    expect(isValidStatusTransition("NOT_STARTED", "SUBMITTED")).toBe(false);
  });

  it("prevents RESEARCHING -> SUBMITTED (skipping DRAFTING)", () => {
    expect(isValidStatusTransition("RESEARCHING", "SUBMITTED")).toBe(false);
  });

  it("prevents NOT_STARTED -> APPROVED (skipping everything)", () => {
    expect(isValidStatusTransition("NOT_STARTED", "APPROVED")).toBe(false);
  });

  // ── Unknown status is handled gracefully ─────────────
  it("returns false for unknown current status", () => {
    expect(isValidStatusTransition("UNKNOWN", "CLOSED")).toBe(false);
  });

  it("returns false for unknown target status", () => {
    expect(isValidStatusTransition("NOT_STARTED", "UNKNOWN")).toBe(false);
  });
});

// ─── getAllowedNextStatuses ─────────────────────────────

describe("getAllowedNextStatuses", () => {
  it("returns RESEARCHING and CLOSED for NOT_STARTED (plus self)", () => {
    const allowed = getAllowedNextStatuses("NOT_STARTED");
    expect(allowed).toContain("NOT_STARTED");
    expect(allowed).toContain("RESEARCHING");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(3);
  });

  it("returns DRAFTING and CLOSED for RESEARCHING (plus self)", () => {
    const allowed = getAllowedNextStatuses("RESEARCHING");
    expect(allowed).toContain("RESEARCHING");
    expect(allowed).toContain("DRAFTING");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(3);
  });

  it("returns SUBMITTED and CLOSED for DRAFTING (plus self)", () => {
    const allowed = getAllowedNextStatuses("DRAFTING");
    expect(allowed).toContain("DRAFTING");
    expect(allowed).toContain("SUBMITTED");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(3);
  });

  it("returns UNDER_REVIEW and CLOSED for SUBMITTED (plus self)", () => {
    const allowed = getAllowedNextStatuses("SUBMITTED");
    expect(allowed).toContain("SUBMITTED");
    expect(allowed).toContain("UNDER_REVIEW");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(3);
  });

  it("returns APPROVED, REJECTED, and CLOSED for UNDER_REVIEW (plus self)", () => {
    const allowed = getAllowedNextStatuses("UNDER_REVIEW");
    expect(allowed).toContain("UNDER_REVIEW");
    expect(allowed).toContain("APPROVED");
    expect(allowed).toContain("REJECTED");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(4);
  });

  it("returns only CLOSED for APPROVED (plus self)", () => {
    const allowed = getAllowedNextStatuses("APPROVED");
    expect(allowed).toContain("APPROVED");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(2);
  });

  it("returns only CLOSED for REJECTED (plus self)", () => {
    const allowed = getAllowedNextStatuses("REJECTED");
    expect(allowed).toContain("REJECTED");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(2);
  });

  it("returns only self for CLOSED (terminal state)", () => {
    const allowed = getAllowedNextStatuses("CLOSED");
    expect(allowed).toContain("CLOSED");
    expect(allowed).toHaveLength(1);
  });

  it("returns only self for unknown status", () => {
    const allowed = getAllowedNextStatuses("UNKNOWN");
    expect(allowed).toEqual(["UNKNOWN"]);
  });

  // ── Every non-terminal status can reach CLOSED ───────
  it("every non-terminal status includes CLOSED as a valid next status", () => {
    const nonTerminal = [
      "NOT_STARTED", "RESEARCHING", "DRAFTING",
      "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED",
    ];
    for (const s of nonTerminal) {
      const allowed = getAllowedNextStatuses(s);
      expect(allowed).toContain("CLOSED");
    }
  });
});
