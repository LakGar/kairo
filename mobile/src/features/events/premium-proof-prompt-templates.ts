import type { CreateEventForm, EventFormat, ProofType } from "./create-event.types";

function activityTypeLabel(format: EventFormat): string {
  switch (format) {
    case "OPEN_MEETUP":
      return "Meetup";
    case "TEAM_TOURNAMENT":
      return "Team tournament";
    case "SOLO_COMPETITION":
      return "Solo competition";
    case "ROUND_ROBIN":
      return "Round robin";
    case "SINGLE_ELIMINATION":
      return "Single elimination bracket";
    default:
      return "Event";
  }
}

function contextHaystack(form: CreateEventForm): string {
  return `${activityTypeLabel(form.format)} ${form.title} ${form.description}`.toLowerCase();
}

/**
 * Local “AI-style” copy — template strings from activity keywords + proof mode only (no network).
 */
export function suggestPremiumProofPromptContent(
  form: CreateEventForm,
  variantIndex: number,
): { title: string; description: string } {
  const proofType = form.proofType;
  if (proofType === "NONE") {
    return { title: "", description: "" };
  }

  const h = contextHaystack(form);
  const alt = variantIndex % 2 === 1;

  const photoVideoNote =
    proofType === "PHOTO_OR_VIDEO"
      ? " A photo or a short clip both work once in-app capture is available."
      : "";

  if (h.includes("basketball")) {
    if (proofType === "VIDEO") {
      return {
        title: "Record a short clip on the court before tipoff.",
        description:
          "Film briefly on the court before the game starts so it is clear your team was there.",
      };
    }
    if (proofType === "PHOTO") {
      return {
        title: "Take a team photo on the court before the game starts.",
        description: "Use a clear team photo on the court before play begins.",
      };
    }
    return {
      title: alt
        ? "Record a short clip on the court before tipoff."
        : "Take a team photo on the court before the game starts.",
      description:
        "Show your team on the court before the game — photo or short clip." + photoVideoNote,
    };
  }

  if (h.includes("pickleball")) {
    if (proofType === "VIDEO") {
      return {
        title: "Record a short clip near the court before your first match.",
        description: "A quick video by the court before you play works well.",
      };
    }
    if (proofType === "PHOTO") {
      return {
        title: "Take a team photo near the court before your first match.",
        description: "Snap a team photo by the court before your first match.",
      };
    }
    return {
      title: alt
        ? "Record a short clip near the court before your first match."
        : "Take a team photo near the court before your first match.",
      description: "Capture your group by the court before play." + photoVideoNote,
    };
  }

  if (h.includes("running") || h.includes("marathon") || h.includes("5k") || /\brun\b/.test(h)) {
    if (proofType === "VIDEO") {
      return {
        title: "Record a short clip at the finish point.",
        description: "Film a moment at the finish so your effort is visible.",
      };
    }
    if (proofType === "PHOTO") {
      return {
        title: "Take a photo at the start or finish point.",
        description: "A clear photo at the start line or finish works best.",
      };
    }
    return {
      title: alt ? "Record a short clip at the finish point." : "Take a photo at the start or finish point.",
      description: "Show you were there at the start or finish — photo or short clip." + photoVideoNote,
    };
  }

  if (proofType === "VIDEO") {
    return {
      title: alt
        ? "Record a short clip where the activity happens."
        : "Record a short clip showing you completed the commitment.",
      description:
        "Keep the clip brief and in context so others can see you participated." + photoVideoNote,
    };
  }

  if (proofType === "PHOTO") {
    return {
      title: alt
        ? "Take a clear photo where the activity happens."
        : "Take a clear photo showing you completed the commitment.",
      description: "Face and setting visible if possible; no need for perfect lighting." + photoVideoNote,
    };
  }

  return {
    title: alt
      ? "Record a short clip showing you completed the commitment."
      : "Capture a photo or short video showing you completed the commitment.",
    description:
      "Use a photo or a very short clip in the moment — whichever is easier once Kairo capture ships." +
      photoVideoNote,
  };
}

export function defaultProofTitleForApi(proofType: ProofType): string {
  switch (proofType) {
    case "PHOTO":
      return "Photo proof";
    case "VIDEO":
      return "Video proof";
    case "PHOTO_OR_VIDEO":
      return "Photo or video proof";
    default:
      return "Proof";
  }
}
