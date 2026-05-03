import type { OnboardingStepConfig } from "./onboarding-types";

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: "welcome",
    kind: "welcome",
    eyebrow: "Welcome",
    title: "Build proof behind your goals.",
    subtitle:
      "Kairo helps you commit, show up, and let your circle verify the follow-through.",
  },
  {
    id: "primary-goal",
    kind: "single",
    eyebrow: "Your focus",
    title: "What are you here to improve?",
    subtitle: "Pick the outcome that matters most right now. You can evolve this later.",
    field: "primaryGoal",
    options: [
      { id: "fitness-consistency", label: "Fitness consistency" },
      { id: "sports-competition", label: "Sports and competition" },
      { id: "personal-discipline", label: "Personal discipline" },
      { id: "social-accountability", label: "Social accountability" },
      { id: "hosting-events", label: "Hosting events" },
      { id: "meeting-active", label: "Meeting active people" },
    ],
  },
  {
    id: "accountability-style",
    kind: "single",
    eyebrow: "Accountability",
    title: "How should accountability feel?",
    subtitle: "Choose the style that keeps you honest without burning you out.",
    field: "accountabilityStyle",
    options: [
      {
        id: "self-checkins",
        label: "Self-led check-ins",
        description: "You own reminders and proof cadence.",
      },
      {
        id: "partner",
        label: "One accountability partner",
        description: "A single person you trust to verify progress.",
      },
      {
        id: "team",
        label: "Team expectations",
        description: "Small group pressure and shared wins.",
      },
      {
        id: "group-visibility",
        label: "Group visibility",
        description: "A wider circle sees commitments and proof.",
      },
      {
        id: "organizer-led",
        label: "Coach or organizer led",
        description: "Structured check-ins from a host or coach.",
      },
    ],
  },
  {
    id: "participation",
    kind: "multi",
    eyebrow: "Participation",
    title: "How do you want to show up?",
    subtitle: "Select every mode you are open to. You can refine this before any event.",
    multiField: "participationModes",
    minSelections: 1,
    options: [
      { id: "solo", label: "Join solo" },
      { id: "team", label: "Create or join a team" },
      { id: "watch", label: "Watch events" },
      { id: "volunteer", label: "Volunteer" },
      { id: "host", label: "Host events" },
    ],
  },
  {
    id: "activities",
    kind: "multi",
    eyebrow: "Activities",
    title: "What sounds fun?",
    subtitle: "Pick the lanes you actually want to show up for.",
    multiField: "activityInterests",
    minSelections: 1,
    options: [
      { id: "basketball", label: "Basketball" },
      { id: "pickleball", label: "Pickleball" },
      { id: "running", label: "Running" },
      { id: "soccer", label: "Soccer" },
      { id: "volleyball", label: "Volleyball" },
      { id: "fitness-challenges", label: "Fitness challenges" },
      { id: "founder-games", label: "Founder games" },
      { id: "community-tournaments", label: "Community tournaments" },
    ],
  },
  {
    id: "event-types",
    kind: "multi",
    eyebrow: "Events",
    title: "Which event shapes fit you?",
    subtitle: "We will prioritize invites and discovery around these formats.",
    multiField: "preferredEventTypes",
    minSelections: 1,
    options: [
      { id: "tournaments", label: "Tournaments" },
      { id: "leagues", label: "Leagues and seasons" },
      { id: "pickup", label: "Pickup games" },
      { id: "social-meets", label: "Social meets" },
      { id: "charity", label: "Charity and causes" },
      { id: "corporate", label: "Corporate challenges" },
    ],
  },
  {
    id: "stakes",
    kind: "single",
    eyebrow: "Stakes",
    title: "What kind of stakes feel right?",
    subtitle: "You can always start light and add stakes when trust is high.",
    field: "stakePreference",
    options: [
      { id: "none", label: "No stakes yet" },
      { id: "fun-tasks", label: "Fun loser tasks" },
      { id: "donation", label: "Donation-based stakes" },
      { id: "prize", label: "Prize or reward-based challenges" },
    ],
  },
  {
    id: "proof",
    kind: "single",
    eyebrow: "Proof",
    title: "How do you want proof to work?",
    subtitle: "Pick the default you are most comfortable submitting.",
    field: "proofPreference",
    options: [
      { id: "photo", label: "Photo proof" },
      { id: "video", label: "Video proof" },
      { id: "score", label: "Score confirmation" },
      { id: "friend", label: "Friend verification" },
      { id: "organizer", label: "Organizer approval" },
    ],
  },
  {
    id: "social-circle",
    kind: "single",
    eyebrow: "Social",
    title: "Who should see your commitments?",
    subtitle: "This guides defaults for visibility and invites.",
    field: "socialCirclePreference",
    options: [
      {
        id: "close-friends",
        label: "Close friends only",
        description: "Tight circle, high trust.",
      },
      {
        id: "wider-friends",
        label: "Wider friend network",
        description: "Friends-of-friends can discover you.",
      },
      {
        id: "new-people",
        label: "Open to new connections",
        description: "Meet people through events and proof.",
      },
      {
        id: "community",
        label: "Community-first",
        description: "Optimize for local groups and organizers.",
      },
    ],
  },
  {
    id: "notifications",
    kind: "single",
    eyebrow: "Notifications",
    title: "How chatty should Kairo be?",
    subtitle: "You can fine-tune per event once you join one.",
    field: "notificationPreference",
    options: [
      { id: "all", label: "Everything that matters" },
      { id: "important", label: "Important only" },
      { id: "minimal", label: "Minimal pings" },
      { id: "mostly-off", label: "Mostly off for now" },
    ],
  },
  {
    id: "location",
    kind: "single",
    eyebrow: "Location",
    title: "Where do you want to play?",
    subtitle: "Helps us prioritize local drops versus digital-friendly events.",
    field: "locationPreference",
    options: [
      {
        id: "local-in-person",
        label: "Local and in-person first",
        description: "Nearby courts, fields, and studios.",
      },
      {
        id: "city-wide",
        label: "City-wide",
        description: "Comfortable commuting across town.",
      },
      {
        id: "regional",
        label: "Regional travel ok",
        description: "Weekend trips for the right event.",
      },
      {
        id: "digital-ok",
        label: "Digital check-ins ok",
        description: "Remote accountability and hybrid events.",
      },
    ],
  },
  {
    id: "profile",
    kind: "profile",
    eyebrow: "Profile",
    title: "Set up your profile.",
    subtitle:
      "This is how teammates and organizers will recognize you. Bio is optional.",
  },
  {
    id: "review",
    kind: "review",
    eyebrow: "Review",
    title: "Review your Kairo setup.",
    subtitle: "Everything below is private to you until you join or host events.",
  },
];

export function getOptionLabel(
  step: OnboardingStepConfig,
  valueId: string,
): string {
  const opt = step.options?.find((o) => o.id === valueId);
  return opt?.label ?? valueId;
}

export function getStepByIndex(index: number): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS[index];
}
