import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusStepper, PIPELINE_STATUSES, ALL_STATUSES } from "@/components/status-stepper";

describe("StatusStepper component", () => {
  // ── Rendering pipeline steps ─────────────────────────

  it("renders all pipeline status labels", () => {
    render(<StatusStepper currentStatus="NOT_STARTED" />);

    for (const step of PIPELINE_STATUSES) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("has a role=list container for accessibility", () => {
    render(<StatusStepper currentStatus="NOT_STARTED" />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("renders each step as a list item", () => {
    render(<StatusStepper currentStatus="NOT_STARTED" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(PIPELINE_STATUSES.length);
  });

  // ── Current step highlighting ────────────────────────

  it("marks the current step with aria-current=step", () => {
    render(<StatusStepper currentStatus="DRAFTING" />);

    const draftingItem = screen
      .getAllByRole("listitem")
      .find((el) => el.getAttribute("aria-current") === "step");

    expect(draftingItem).toBeDefined();
    expect(draftingItem?.textContent).toContain("Drafting");
  });

  it("does not mark non-current steps with aria-current", () => {
    render(<StatusStepper currentStatus="DRAFTING" />);

    const nonCurrentItems = screen
      .getAllByRole("listitem")
      .filter((el) => el.getAttribute("aria-current") !== "step");

    // All steps except DRAFTING should NOT have aria-current
    expect(nonCurrentItems).toHaveLength(PIPELINE_STATUSES.length - 1);
  });

  // ── Completed steps show check marks ─────────────────

  it("shows step numbers for upcoming steps", () => {
    render(<StatusStepper currentStatus="NOT_STARTED" />);

    // Steps 2-6 should show numbers (RESEARCHING through APPROVED)
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows step number for the current step", () => {
    render(<StatusStepper currentStatus="NOT_STARTED" />);

    // Step 1 (NOT_STARTED) is current — shows number 1
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  // ── Terminal states: REJECTED ────────────────────────

  it("shows terminal indicator for REJECTED status", () => {
    render(<StatusStepper currentStatus="REJECTED" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("does not show terminal indicator for normal statuses", () => {
    render(<StatusStepper currentStatus="DRAFTING" />);
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });

  // ── Terminal states: CLOSED ──────────────────────────

  it("shows terminal indicator for CLOSED status", () => {
    render(<StatusStepper currentStatus="CLOSED" />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("marks all pipeline steps as completed for CLOSED status", () => {
    render(<StatusStepper currentStatus="CLOSED" />);

    // When CLOSED, no step should have aria-current=step (all are past)
    const currentItems = screen
      .getAllByRole("listitem")
      .filter((el) => el.getAttribute("aria-current") === "step");

    expect(currentItems).toHaveLength(0);
  });

  it("marks all pipeline steps as completed for REJECTED status", () => {
    render(<StatusStepper currentStatus="REJECTED" />);

    // Same as CLOSED — no current step
    const currentItems = screen
      .getAllByRole("listitem")
      .filter((el) => el.getAttribute("aria-current") === "step");

    expect(currentItems).toHaveLength(0);
  });

  // ── Mid-pipeline statuses ────────────────────────────

  it("correctly renders SUBMITTED as the current step", () => {
    render(<StatusStepper currentStatus="SUBMITTED" />);

    const currentItem = screen
      .getAllByRole("listitem")
      .find((el) => el.getAttribute("aria-current") === "step");

    expect(currentItem).toBeDefined();
    expect(currentItem?.textContent).toContain("Submitted");
  });

  it("correctly renders UNDER_REVIEW as the current step", () => {
    render(<StatusStepper currentStatus="UNDER_REVIEW" />);

    const currentItem = screen
      .getAllByRole("listitem")
      .find((el) => el.getAttribute("aria-current") === "step");

    expect(currentItem).toBeDefined();
    expect(currentItem?.textContent).toContain("Under Review");
  });

  it("correctly renders APPROVED as the current step", () => {
    render(<StatusStepper currentStatus="APPROVED" />);

    const currentItem = screen
      .getAllByRole("listitem")
      .find((el) => el.getAttribute("aria-current") === "step");

    expect(currentItem).toBeDefined();
    expect(currentItem?.textContent).toContain("Approved");
  });
});

// ─── Exported constants ─────────────────────────────────

describe("StatusStepper exported constants", () => {
  it("PIPELINE_STATUSES contains the expected happy-path steps", () => {
    const keys = PIPELINE_STATUSES.map((s) => s.key);
    expect(keys).toEqual([
      "NOT_STARTED",
      "RESEARCHING",
      "DRAFTING",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
    ]);
  });

  it("ALL_STATUSES includes REJECTED and CLOSED beyond the pipeline", () => {
    const keys = ALL_STATUSES.map((s) => s.key);
    expect(keys).toContain("REJECTED");
    expect(keys).toContain("CLOSED");
    expect(keys).toHaveLength(8);
  });
});
