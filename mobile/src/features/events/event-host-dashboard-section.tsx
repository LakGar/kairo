import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEventPublic,
} from "@/src/api";
import { HomeColors } from "@/src/features/home/home-tokens";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC" as const, label: "Public" },
  { value: "PRIVATE" as const, label: "Private" },
  { value: "INVITE_ONLY" as const, label: "Invite-only" },
];

type Props = {
  event: ApiEventPublic;
  onSaved: () => void;
};

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PUBLISHED":
      return "Published";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function EventHostDashboardSection({ event, onSaved }: Props) {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const isHost = Boolean(linkedUserId && linkedUserId === event.organizerId);

  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [activityType, setActivityType] = useState(event.activityType);
  const [locationName, setLocationName] = useState(event.locationName ?? "");
  const [address, setAddress] = useState(event.address ?? "");
  const [city, setCity] = useState(event.city ?? "");
  const [state, setState] = useState(event.state ?? "");
  const [country, setCountry] = useState(event.country ?? "");
  const [visibility, setVisibility] = useState(event.visibility);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description ?? "");
    setActivityType(event.activityType);
    setLocationName(event.locationName ?? "");
    setAddress(event.address ?? "");
    setCity(event.city ?? "");
    setState(event.state ?? "");
    setCountry(event.country ?? "");
    setVisibility(event.visibility);
    setBanner(null);
  }, [
    event.id,
    event.updatedAt,
    event.title,
    event.description,
    event.activityType,
    event.locationName,
    event.address,
    event.city,
    event.state,
    event.country,
    event.visibility,
  ]);

  const onSave = useCallback(async () => {
    if (!linkedUserId) return;
    const payload: Record<string, unknown> = {};
    if (title.trim() !== event.title) payload.title = title.trim();
    const nextDesc = description.trim() === "" ? null : description.trim();
    const prevDesc = event.description?.trim() ?? null;
    if (nextDesc !== prevDesc) payload.description = nextDesc ?? "";
    if (activityType.trim() !== event.activityType) payload.activityType = activityType.trim();
    if ((locationName.trim() || null) !== (event.locationName?.trim() ?? null)) {
      payload.locationName = locationName.trim() || null;
    }
    if ((address.trim() || null) !== (event.address?.trim() ?? null)) {
      payload.address = address.trim() || null;
    }
    if ((city.trim() || null) !== (event.city?.trim() ?? null)) {
      payload.city = city.trim() || null;
    }
    if ((state.trim() || null) !== (event.state?.trim() ?? null)) {
      payload.state = state.trim() || null;
    }
    if ((country.trim() || null) !== (event.country?.trim() ?? null)) {
      payload.country = country.trim() || null;
    }
    if (visibility !== event.visibility) payload.visibility = visibility;

    if (Object.keys(payload).length === 0) {
      setBanner("No changes to save.");
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.updateEvent(event.id, payload);
      setBanner("Saved.");
      onSaved();
    } catch (e) {
      if (e instanceof KairoApiError) setBanner(e.message);
      else if (e instanceof KairoApiConfigurationError) setBanner(e.message);
      else setBanner(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }, [
    linkedUserId,
    event.id,
    event.title,
    event.description,
    event.activityType,
    event.locationName,
    event.address,
    event.city,
    event.state,
    event.country,
    event.visibility,
    title,
    description,
    activityType,
    locationName,
    address,
    city,
    state,
    country,
    visibility,
    onSaved,
  ]);

  const statItems = useMemo(
    () => [
      { icon: "people" as const, value: event._count.participants, label: "going" },
      { icon: "people-circle-outline" as const, value: event._count.teams, label: "teams" },
      { icon: "trophy-outline" as const, value: event._count.matches, label: "matches" },
    ],
    [event._count.matches, event._count.participants, event._count.teams],
  );

  if (!isHost) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.hostBadge}>
          <Ionicons name="star" size={14} color={HomeColors.warning} />
          <Text style={styles.hostBadgeText}>You’re hosting</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{statusLabel(event.status)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {statItems.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Ionicons name={s.icon} size={20} color={HomeColors.textMuted} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Update what guests see — title, description, visibility, activity, and address fields.
      </Text>

      <Pressable
        onPress={() => {
          setExpanded((e) => !e);
          setBanner(null);
        }}
        style={({ pressed }) => [styles.toggleBtn, pressed && styles.togglePressed]}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Hide event editor" : "Edit event details"}
      >
        <Ionicons name="create-outline" size={20} color={HomeColors.textPrimary} />
        <Text style={styles.toggleBtnText}>
          {expanded ? "Hide editor" : "Edit event details"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={HomeColors.textMuted}
        />
      </Pressable>

      {banner ? <Text style={styles.banner}>{banner}</Text> : null}

      {expanded ? (
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Event name"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What should people know?"
            placeholderTextColor={HomeColors.textMuted}
            style={[styles.input, styles.inputMulti]}
            multiline
          />

          <Text style={styles.fieldLabel}>Activity</Text>
          <TextInput
            value={activityType}
            onChangeText={setActivityType}
            placeholder="e.g. Pickup basketball"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Who can find this event</Text>
          <View style={styles.visRow}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const on = visibility === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setVisibility(opt.value)}
                  style={[styles.visChip, on && styles.visChipOn]}
                >
                  <Text style={[styles.visChipText, on && styles.visChipTextOn]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Venue / location name</Text>
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Place name"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Street address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Optional"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.input}
          />
          <View style={styles.inline2}>
            <View style={styles.inline2Item}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={HomeColors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.inline2Item}>
              <Text style={styles.fieldLabel}>State / region</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor={HomeColors.textMuted}
                style={styles.input}
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>Country</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="Country"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.input}
          />

          <Pressable
            onPress={() => void onSave()}
            disabled={busy}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              busy && styles.saveBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save event details"
          >
            {busy ? (
              <ActivityIndicator color={HomeColors.black} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostBadgeText: {
    color: HomeColors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: HomeColors.surfaceStrong,
  },
  statusPillText: {
    color: HomeColors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: HomeColors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hint: {
    color: HomeColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  togglePressed: {
    opacity: 0.75,
  },
  toggleBtnText: {
    flex: 1,
    color: HomeColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  banner: {
    color: HomeColors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  form: {
    gap: 4,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HomeColors.border,
  },
  fieldLabel: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: HomeColors.textPrimary,
    fontSize: 16,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  visRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  visChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  visChipOn: {
    backgroundColor: HomeColors.white,
    borderColor: HomeColors.white,
  },
  visChipText: {
    color: HomeColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  visChipTextOn: {
    color: HomeColors.black,
  },
  inline2: {
    flexDirection: "row",
    gap: 12,
  },
  inline2Item: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: HomeColors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: HomeColors.black,
    fontSize: 16,
    fontWeight: "800",
  },
});
