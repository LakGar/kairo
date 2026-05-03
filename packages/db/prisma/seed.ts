/**
 * MVP demo seed — idempotent: removes prior seed events (by slug) and seed users (by email), then recreates.
 * Run: `npm run db:seed` from repo root (requires `DATABASE_URL`).
 */
import {
  EventFormat,
  EventParticipantRole,
  EventStatus,
  EventVisibility,
  MatchStatus,
  Prisma,
  PrismaClient,
  ProofStatus,
  ProofType,
  RegistrationStatus,
  StakeStatus,
  StakeType,
  TeamMemberRole,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_EMAILS = [
  "seed+alice@kairo.dev",
  "seed+bob@kairo.dev",
  "seed+cara@kairo.dev",
] as const;

const SEED_EVENT_SLUGS = ["kairo-pickleball-night", "founder-basketball-run"] as const;

async function cleanup() {
  try {
    await prisma.event.deleteMany({
      where: { slug: { in: [...SEED_EVENT_SLUGS] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [...SEED_USER_EMAILS] } },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      throw new Error(
        [
          "Kairo tables are missing or the database was never migrated to the current Prisma schema.",
          "From the repo root run:",
          "  npm run db:push",
          "",
          "If `db:push` fails on incompatible existing rows (e.g. old User rows without `email`), reset this dev database then seed (wipes all data in that database):",
          "  npm run db:dev:fresh",
        ].join("\n"),
        { cause: e },
      );
    }
    throw e;
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn("Skipping seed: DATABASE_URL is not set.");
    return;
  }

  await cleanup();

  const [alice, bob, cara] = await Promise.all([
    prisma.user.create({
      data: {
        email: SEED_USER_EMAILS[0],
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: SEED_USER_EMAILS[1],
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: SEED_USER_EMAILS[2],
        role: UserRole.USER,
      },
    }),
  ]);

  await Promise.all([
    prisma.profile.create({
      data: {
        userId: alice.id,
        name: "Alice Organizer",
        username: "seed_alice",
        bio: "Demo organizer for Kairo seed data.",
      },
    }),
    prisma.profile.create({
      data: {
        userId: bob.id,
        name: "Bob Player",
        username: "seed_bob",
        bio: "Demo participant.",
      },
    }),
    prisma.profile.create({
      data: {
        userId: cara.id,
        name: "Cara Captain",
        username: "seed_cara",
        bio: "Demo team captain.",
      },
    }),
  ]);

  const startsPickle = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const startsBasket = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const eventPickle = await prisma.event.create({
    data: {
      organizerId: alice.id,
      title: "Kairo Pickleball Night",
      slug: SEED_EVENT_SLUGS[0],
      description: "Friendly round-robin pickleball — bring a team or join solo.",
      activityType: "Pickleball",
      status: EventStatus.PUBLISHED,
      visibility: EventVisibility.PUBLIC,
      format: EventFormat.TEAM_TOURNAMENT,
      locationName: "Westside Courts",
      city: "San Francisco",
      state: "CA",
      country: "US",
      startsAt: startsPickle,
      endsAt: new Date(startsPickle.getTime() + 3 * 60 * 60 * 1000),
      maxTeams: 8,
      maxSoloPlayers: 16,
      maxWatchers: 40,
      maxVolunteers: 6,
      allowTeams: true,
      allowSoloPlayers: true,
      allowWatchers: true,
      allowVolunteers: true,
      entryFeeCents: 0,
    },
  });

  const eventBasket = await prisma.event.create({
    data: {
      organizerId: cara.id,
      title: "Founder Basketball Run",
      slug: SEED_EVENT_SLUGS[1],
      description: "Pickup basketball — founders and friends; casual competition.",
      activityType: "Basketball",
      status: EventStatus.PUBLISHED,
      visibility: EventVisibility.PUBLIC,
      format: EventFormat.OPEN_MEETUP,
      locationName: "Mission Gym",
      city: "San Francisco",
      state: "CA",
      country: "US",
      startsAt: startsBasket,
      maxTeams: 4,
      maxSoloPlayers: 20,
      allowTeams: true,
      allowSoloPlayers: true,
      allowWatchers: true,
      allowVolunteers: true,
    },
  });

  await prisma.eventParticipant.createMany({
    data: [
      {
        eventId: eventPickle.id,
        userId: alice.id,
        role: EventParticipantRole.ORGANIZER,
        status: RegistrationStatus.APPROVED,
      },
      {
        eventId: eventPickle.id,
        userId: bob.id,
        role: EventParticipantRole.PLAYER,
        status: RegistrationStatus.APPROVED,
      },
      {
        eventId: eventPickle.id,
        userId: cara.id,
        role: EventParticipantRole.PLAYER,
        status: RegistrationStatus.APPROVED,
      },
      {
        eventId: eventBasket.id,
        userId: cara.id,
        role: EventParticipantRole.ORGANIZER,
        status: RegistrationStatus.APPROVED,
      },
      {
        eventId: eventBasket.id,
        userId: alice.id,
        role: EventParticipantRole.PLAYER,
        status: RegistrationStatus.APPROVED,
      },
      {
        eventId: eventBasket.id,
        userId: bob.id,
        role: EventParticipantRole.VOLUNTEER,
        status: RegistrationStatus.APPROVED,
      },
    ],
  });

  const teamKings = await prisma.team.create({
    data: {
      eventId: eventPickle.id,
      captainId: alice.id,
      name: "Court Kings",
      description: "Alice's squad",
      seed: 1,
    },
  });

  const teamNinjas = await prisma.team.create({
    data: {
      eventId: eventPickle.id,
      captainId: bob.id,
      name: "Net Ninjas",
      description: "Bob's crew",
      seed: 2,
    },
  });

  const teamHoop = await prisma.team.create({
    data: {
      eventId: eventBasket.id,
      captainId: cara.id,
      name: "Hoop Heroes",
      description: "Cara's pickup side",
      seed: 1,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      {
        teamId: teamKings.id,
        userId: alice.id,
        role: TeamMemberRole.CAPTAIN,
      },
      {
        teamId: teamKings.id,
        userId: cara.id,
        role: TeamMemberRole.MEMBER,
      },
      {
        teamId: teamNinjas.id,
        userId: bob.id,
        role: TeamMemberRole.CAPTAIN,
      },
      {
        teamId: teamHoop.id,
        userId: cara.id,
        role: TeamMemberRole.CAPTAIN,
      },
      {
        teamId: teamHoop.id,
        userId: alice.id,
        role: TeamMemberRole.MEMBER,
      },
    ],
  });

  const bracket = await prisma.bracket.create({
    data: {
      eventId: eventPickle.id,
      name: "Main bracket",
      format: EventFormat.SINGLE_ELIMINATION,
    },
  });

  const match1 = await prisma.match.create({
    data: {
      eventId: eventPickle.id,
      bracketId: bracket.id,
      round: 1,
      matchNumber: 1,
      scheduledAt: startsPickle,
      homeTeamId: teamKings.id,
      awayTeamId: teamNinjas.id,
      status: MatchStatus.SCHEDULED,
    },
  });

  const match2 = await prisma.match.create({
    data: {
      eventId: eventPickle.id,
      bracketId: bracket.id,
      round: 1,
      matchNumber: 2,
      status: MatchStatus.SCHEDULED,
    },
  });

  const promptPickle = await prisma.proofPrompt.create({
    data: {
      eventId: eventPickle.id,
      title: "Post a photo of your team warmup",
      description: "Share a team photo before your first match.",
      proofType: ProofType.PHOTO,
      isRequired: false,
    },
  });

  const promptBasket = await prisma.proofPrompt.create({
    data: {
      eventId: eventBasket.id,
      title: "Confirm attendance",
      description: "Reply with a short text note if you're in.",
      proofType: ProofType.TEXT,
      isRequired: true,
    },
  });

  await prisma.proofSubmission.create({
    data: {
      eventId: eventPickle.id,
      matchId: match1.id,
      promptId: promptPickle.id,
      userId: alice.id,
      type: ProofType.LINK,
      url: "https://example.com/seed-team-photo",
      status: ProofStatus.PENDING,
    },
  });

  await prisma.stake.create({
    data: {
      eventId: eventPickle.id,
      matchId: match1.id,
      type: StakeType.TASK,
      title: "Warm-up challenge",
      description: "Complete a 10-minute dynamic warm-up as a team before play.",
      status: StakeStatus.PENDING,
    },
  });

  await prisma.stake.create({
    data: {
      eventId: eventBasket.id,
      type: StakeType.PRIZE,
      title: "Post-game snack fund",
      description: "Optional donation toward snacks after the run.",
      amountCents: 500,
      currency: "USD",
      status: StakeStatus.PENDING,
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        eventId: eventPickle.id,
        userId: alice.id,
        action: "EVENT_CREATED",
        metadata: { source: "seed" },
      },
      {
        eventId: eventPickle.id,
        userId: alice.id,
        action: "TEAM_CREATED",
        metadata: { teamId: teamKings.id },
      },
      {
        eventId: eventBasket.id,
        userId: cara.id,
        action: "EVENT_PUBLISHED",
        metadata: { source: "seed" },
      },
      {
        eventId: eventPickle.id,
        userId: alice.id,
        action: "PROOF_SUBMITTED",
        metadata: { note: "seed demo" },
      },
    ],
  });

  console.log("Seed complete:", {
    users: [alice.email, bob.email, cara.email],
    events: [eventPickle.slug, eventBasket.slug],
    teams: [teamKings.name, teamNinjas.name, teamHoop.name],
    bracketId: bracket.id,
    matchIds: [match1.id, match2.id],
    proofPromptIds: [promptPickle.id, promptBasket.id],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
