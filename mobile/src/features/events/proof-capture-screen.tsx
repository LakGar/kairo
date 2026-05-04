import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { submitProofSchema, type SubmitProofInput } from "@kairo/shared";

import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
} from "@/src/api";
import { buildEventDetailFocusHref } from "@/src/features/home/event-proof-nav";

import type { ProofCaptureMode } from "./proof-capture.types";

const BG = "#0B0F14";
const SURFACE = "#11161D";
const BORDER = "rgba(255,255,255,0.12)";
const TEXT = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.62)";

function pickParam(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

function parseCaptureMode(raw: string): ProofCaptureMode | null {
  const u = raw.trim().toUpperCase();
  if (u === "PHOTO" || u === "VIDEO") return u;
  return null;
}

export function ProofCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const params = useLocalSearchParams<{
    eventId?: string | string[];
    proofType?: string | string[];
    promptId?: string | string[];
    matchId?: string | string[];
    promptTitle?: string | string[];
  }>();

  const eventId = pickParam(params.eventId);
  const proofTypeRaw = pickParam(params.proofType);
  const proofType = parseCaptureMode(proofTypeRaw);
  const promptIdRaw = pickParam(params.promptId);
  const matchIdRaw = pickParam(params.matchId);
  const promptTitle = pickParam(params.promptTitle);

  const promptId = promptIdRaw.trim() || null;
  const matchId = matchIdRaw.trim() || null;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [phase, setPhase] = useState<"camera" | "preview" | "unsupported">(
    Platform.OS === "web" ? "unsupported" : "camera",
  );
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  const cameraGranted = cameraPermission?.granted === true;
  const micGranted = micPermission?.granted === true;

  const handleRequestCamera = useCallback(async () => {
    setError(null);
    await requestCameraPermission();
  }, [requestCameraPermission]);

  const handleBack = useCallback(() => {
    if (phase === "preview" && capturedUri) {
      setCapturedUri(null);
      setPhase("camera");
      setCameraReady(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(tabs)/events/${encodeURIComponent(eventId)}` as const);
    }
  }, [capturedUri, eventId, phase, router]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || proofType !== "PHOTO") return;
    setError(null);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (pic?.uri) {
        setCapturedUri(pic.uri);
        setPhase("preview");
      } else {
        setError("Could not capture photo.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not capture photo.");
    }
  }, [cameraReady, proofType]);

  const startVideo = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || proofType !== "VIDEO") return;
    setError(null);
    if (!micGranted) {
      await requestMicPermission();
    }
    try {
      recordingPromiseRef.current = cameraRef.current.recordAsync({ maxDuration: 10 });
      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording.");
    }
  }, [cameraReady, micGranted, proofType, requestMicPermission]);

  const stopVideo = useCallback(async () => {
    if (!cameraRef.current) return;
    cameraRef.current.stopRecording();
    setIsRecording(false);
    try {
      const res = recordingPromiseRef.current ? await recordingPromiseRef.current : undefined;
      recordingPromiseRef.current = null;
      if (res?.uri) {
        setCapturedUri(res.uri);
        setPhase("preview");
      } else {
        setError("No video file was produced. Try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish recording.");
    }
  }, []);

  const submitCaptured = useCallback(async () => {
    if (!capturedUri || !proofType || !eventId) return;
    setSubmitting(true);
    setError(null);
    const body: SubmitProofInput = {
      eventId,
      matchId,
      promptId,
      type: proofType,
      // TODO: Replace temporary `file:` URI with CDN/storage URL after upload pipeline exists.
      url: capturedUri,
      text: "Captured in Kairo",
    };
    const parsed = submitProofSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        parsed.error.message;
      setError(first ?? "Invalid proof payload.");
      setSubmitting(false);
      return;
    }
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      await api.submitProof(eventId, parsed.data);
      router.replace(buildEventDetailFocusHref(eventId, { focus: "proof" }));
    } catch (e) {
      if (e instanceof KairoApiError) setError(e.message);
      else if (e instanceof KairoApiConfigurationError) setError(e.message);
      else setError(e instanceof Error ? e.message : "Could not submit proof.");
    } finally {
      setSubmitting(false);
    }
  }, [capturedUri, eventId, linkedUserId, matchId, promptId, proofType, router]);

  if (!eventId || !proofType) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header title="Capture Proof" onBack={() => router.back()} />
        <Text style={styles.errorBanner}>Missing event or proof type.</Text>
      </View>
    );
  }

  if (phase === "unsupported") {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header title="Capture Proof" onBack={() => router.back()} />
        <Text style={styles.mutedCenter}>In-app capture is not available on web yet.</Text>
      </View>
    );
  }

  if (!cameraPermission) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header title="Capture Proof" onBack={handleBack} />
        <ActivityIndicator color={TEXT} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!cameraGranted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header title="Capture Proof" onBack={handleBack} />
        <Text style={styles.promptTitle}>{promptTitle || "Proof"}</Text>
        <Text style={styles.mutedCenter}>Camera access is needed to capture proof.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void handleRequestCamera()}>
          <Text style={styles.primaryBtnLabel}>Grant access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header title="Capture Proof" onBack={handleBack} />

      {promptTitle ? (
        <Text style={styles.promptTitle} numberOfLines={2}>
          {promptTitle}
        </Text>
      ) : null}

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {phase === "camera" ? (
        <View style={styles.cameraShell}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode={proofType === "VIDEO" ? "video" : "picture"}
            mute={proofType === "VIDEO" && !micGranted}
            onCameraReady={() => setCameraReady(true)}
          />
          {isRecording ? (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording… max 10s</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.previewShell}>
          {proofType === "PHOTO" && capturedUri ? (
            <Image source={{ uri: capturedUri }} style={styles.previewImage} contentFit="contain" />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={48} color={MUTED} />
              <Text style={styles.mutedSmall}>Video captured</Text>
              <Text style={styles.monoTiny} numberOfLines={2}>
                {capturedUri ?? ""}
              </Text>
              <Text style={styles.mutedSmall}>
                {/* TODO: Add expo-av or native preview when product wants polished video playback. */}
                Preview playback deferred — file is saved locally.
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {phase === "camera" ? (
          <>
            {proofType === "PHOTO" ? (
              <Pressable
                style={[styles.shutter, !cameraReady && styles.disabled]}
                onPress={() => void takePhoto()}
                disabled={!cameraReady}
                accessibilityLabel="Capture photo"
              >
                <View style={styles.shutterInner} />
              </Pressable>
            ) : (
              <View style={styles.videoControls}>
                {!isRecording ? (
                  <Pressable
                    style={[styles.primaryBtn, !cameraReady && styles.disabled]}
                    onPress={() => void startVideo()}
                    disabled={!cameraReady}
                  >
                    <Text style={styles.primaryBtnLabel}>Start recording</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.dangerBtn} onPress={() => void stopVideo()}>
                    <Text style={styles.primaryBtnLabel}>Stop</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.previewActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => { setCapturedUri(null); setPhase("camera"); setCameraReady(false); }} disabled={submitting}>
              <Text style={styles.secondaryBtnLabel}>Retake</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, submitting && styles.disabled]}
              onPress={() => void submitCaptured()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#0B0F14" />
              ) : (
                <Text style={styles.primaryBtnLabel}>Submit proof</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={28} color={TEXT} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "600",
  },
  promptTitle: {
    color: MUTED,
    fontSize: 15,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  mutedCenter: {
    color: MUTED,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 16,
  },
  mutedSmall: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  monoTiny: {
    color: MUTED,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 6,
    paddingHorizontal: 16,
  },
  errorBanner: {
    color: "#F87171",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 20,
    marginTop: 8,
  },
  cameraShell: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  recordingBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  recordingText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
  },
  previewShell: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  shutter: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEXT,
  },
  videoControls: {
    alignItems: "stretch",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: TEXT,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryBtnLabel: {
    color: BG,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  secondaryBtnLabel: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
  },
  dangerBtn: {
    flex: 1,
    backgroundColor: "#B91C1C",
    borderRadius: 999,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.45,
  },
});
