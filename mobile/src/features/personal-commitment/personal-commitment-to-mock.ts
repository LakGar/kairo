import type { MockCommitment } from "@/src/features/home/home.mock";

import type { PersonalCommitment } from "./personal-commitment-types";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=480&q=80";

function cadenceLabel(c: PersonalCommitment["cadence"]): string {
  switch (c) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekly":
      return "Once a week";
    default:
      return "Flexible cadence";
  }
}

function proofLabel(p: PersonalCommitment["proofStyle"]): string {
  switch (p) {
    case "photo":
      return "Photo check-ins";
    case "note":
      return "Short notes";
    default:
      return "Partner confirmation";
  }
}

/** Renders in the home `CommitmentList` using existing row UI. */
export function personalCommitmentToMockRow(p: PersonalCommitment): MockCommitment {
  return {
    id: `personal-${p.id}`,
    title: p.title.trim(),
    imageUrl: DEFAULT_IMAGE,
    role: "Personal",
    organizerLine: "Your commitment",
    timeLabel: cadenceLabel(p.cadence),
    locationLabel: "Self-directed",
    status: "Personal goal",
    scoreImpact: `Proof: ${proofLabel(p.proofStyle)}`,
    commitmentStatus: "NO_SCORE_IMPACT",
    eventIdPlaceholder: "personal",
  };
}
