import { useCallback, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  isClerkAPIResponseError,
  useClerk,
  useUser,
} from "@clerk/expo";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

function shortAddr(addr: string, head = 6, tail = 4) {
  if (!addr || addr.length <= head + tail + 1) return addr || "—";
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function classifyWeb3(
  wallets:
    | { web3Wallet: string; verification?: { status: string | null } }[]
    | null
    | undefined,
) {
  const list = wallets ?? [];
  let eth = "—";
  let sol = "—";
  const verified = (w: { verification?: { status: string | null } }) =>
    w.verification?.status === "verified";
  for (const w of list) {
    if (!verified(w)) continue;
    const a = w.web3Wallet;
    if (a.startsWith("0x")) {
      if (eth === "—") eth = shortAddr(a);
    } else if (a.length >= 32) {
      if (sol === "—") sol = shortAddr(a);
    }
  }
  return { eth, sol };
}

function createAccountStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.screen,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    mutedText: {
      color: c.muted,
      fontSize: 15,
    },
    scroll: {
      paddingHorizontal: 16,
    },
    sectionLabel: {
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
      fontSize: 13,
      fontWeight: "600",
      color: c.muted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 10,
    },
    accountRowLabel: {
      width: 108,
      fontSize: 16,
      fontWeight: "500",
      color: c.label,
    },
    accountRowValue: {
      flex: 1,
      fontSize: 16,
      fontWeight: "400",
      color: c.label,
      textAlign: "right",
      marginRight: 4,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.line,
      marginLeft: 14,
    },
    cryptoHint: {
      marginTop: 10,
      marginHorizontal: 4,
      fontSize: 12,
      lineHeight: 17,
      color: c.cryptoHint,
    },
    deleteBtn: {
      marginTop: 28,
      alignItems: "center",
      paddingVertical: 16,
    },
    deleteBtnText: {
      color: c.destructive,
      fontSize: 17,
      fontWeight: "600",
    },
    headerShell: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: "hidden",
      minHeight: 48,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
    headerRightSpacer: {
      width: 40,
    },
    modalRoot: {
      flex: 1,
      backgroundColor: c.screen,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.line,
    },
    modalCancel: {
      color: c.modalLink,
      fontSize: 17,
      fontWeight: "400",
      width: 56,
    },
    modalTitle: {
      flex: 1,
      textAlign: "center",
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
    modalBody: {
      padding: 20,
      paddingBottom: 40,
    },
    errorBanner: {
      backgroundColor: c.errorBannerBg,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorBannerText: {
      color: c.errorBannerText,
      fontSize: 14,
      fontWeight: "500",
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: c.muted,
      marginBottom: 8,
    },
    fieldHint: {
      fontSize: 14,
      color: c.muted,
      marginBottom: 16,
      lineHeight: 20,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.inputFill,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      color: c.label,
      marginBottom: 18,
    },
    primaryBtn: {
      backgroundColor: c.primaryBtnBg,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      color: c.primaryBtnText,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}

type AccountSettingsStyles = ReturnType<typeof createAccountStyles>;

function SectionLabel({
  children,
  styles,
}: {
  children: string;
  styles: AccountSettingsStyles;
}) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function AccountRow({
  label,
  value,
  onPress,
  trailing = "chevron",
  styles,
  chevronColor,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  trailing?: "chevron" | "edit";
  styles: AccountSettingsStyles;
  chevronColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.accountRow,
        pressed && onPress && { opacity: 0.75 },
      ]}
    >
      <Text style={styles.accountRowLabel}>{label}</Text>
      <Text style={styles.accountRowValue} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons
        name={trailing === "edit" ? "pencil" : "chevron-forward"}
        size={18}
        color={chevronColor}
      />
    </Pressable>
  );
}

function StaticRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: AccountSettingsStyles;
}) {
  return (
    <View style={styles.accountRow}>
      <Text style={styles.accountRowLabel}>{label}</Text>
      <Text style={styles.accountRowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createAccountStyles(chrome), [chrome]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [flow, setFlow] = useState<
    | "username"
    | "email"
    | "emailCode"
    | "phone"
    | "phoneCode"
    | "password"
    | null
  >(null);

  const pendingEmailId = useRef<string | null>(null);
  const pendingPhoneId = useRef<string | null>(null);
  const oldPrimaryEmailId = useRef<string | null>(null);
  const oldPrimaryPhoneId = useRef<string | null>(null);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setFlow(null);
    setModalError(null);
    setUsernameInput("");
    setEmailInput("");
    setCodeInput("");
    setPhoneInput("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    pendingEmailId.current = null;
    pendingPhoneId.current = null;
    oldPrimaryEmailId.current = null;
    oldPrimaryPhoneId.current = null;
  }, []);

  const openUsername = () => {
    if (!user) return;
    setFlow("username");
    setModalTitle("Username");
    setUsernameInput(user.username ?? "");
    setModalError(null);
    setModalVisible(true);
  };

  const openEmail = () => {
    if (!user) return;
    setFlow("email");
    setModalTitle("Change email");
    setEmailInput("");
    setCodeInput("");
    setModalError(null);
    oldPrimaryEmailId.current = user.primaryEmailAddressId;
    setModalVisible(true);
  };

  const openPhone = () => {
    if (!user) return;
    setFlow("phone");
    setModalTitle("Phone number");
    setPhoneInput(user.primaryPhoneNumber?.phoneNumber ?? "");
    setCodeInput("");
    setModalError(null);
    oldPrimaryPhoneId.current = user.primaryPhoneNumberId;
    setModalVisible(true);
  };

  const openPassword = () => {
    if (!user) return;
    setFlow("password");
    setModalTitle("Change password");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setModalError(null);
    setModalVisible(true);
  };

  const reloadUser = async () => {
    if (user) await user.reload();
  };

  const submitUsername = async () => {
    if (!user) return;
    const next = usernameInput.trim();
    setModalBusy(true);
    setModalError(null);
    try {
      await user.update({ username: next || undefined });
      await reloadUser();
      closeModal();
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Could not update username."
          : "Could not update username.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const submitEmailRequest = async () => {
    if (!user) return;
    const next = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setModalError("Enter a valid email address.");
      return;
    }
    if (user.primaryEmailAddress?.emailAddress.toLowerCase() === next) {
      setModalError("That is already your primary email.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      const em = await user.createEmailAddress({ email: next });
      await em.prepareVerification({ strategy: "email_code" });
      pendingEmailId.current = em.id;
      setFlow("emailCode");
      setModalTitle("Verify email");
      setCodeInput("");
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Could not start email change."
          : "Could not start email change.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const submitEmailCode = async () => {
    if (!user || !pendingEmailId.current) return;
    const code = codeInput.trim();
    if (!code) {
      setModalError("Enter the code from your email.");
      return;
    }
    const em = user.emailAddresses.find((a) => a.id === pendingEmailId.current);
    if (!em) {
      setModalError("Verification expired. Close and try again.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await em.attemptVerification({ code });
      await user.update({ primaryEmailAddressId: em.id });
      await user.reload();
      const oldId = oldPrimaryEmailId.current;
      if (oldId && oldId !== em.id) {
        const old = user.emailAddresses.find((a) => a.id === oldId);
        if (old && !old.matchesSsoConnection) {
          try {
            await old.destroy();
          } catch {
            /* keep old if destroy not allowed */
          }
        }
      }
      await reloadUser();
      closeModal();
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Invalid code."
          : "Invalid code.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const submitPhoneRequest = async () => {
    if (!user) return;
    const raw = phoneInput.trim();
    if (!raw.startsWith("+") || raw.length < 8) {
      setModalError("Use international format with country code (e.g. +14085551234).");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      const ph = await user.createPhoneNumber({ phoneNumber: raw });
      await ph.prepareVerification();
      pendingPhoneId.current = ph.id;
      setFlow("phoneCode");
      setModalTitle("Verify phone");
      setCodeInput("");
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Could not add this phone number."
          : "Could not add this phone number.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const submitPhoneCode = async () => {
    if (!user || !pendingPhoneId.current) return;
    const code = codeInput.trim();
    if (!code) {
      setModalError("Enter the SMS code.");
      return;
    }
    const ph = user.phoneNumbers.find((p) => p.id === pendingPhoneId.current);
    if (!ph) {
      setModalError("Verification expired. Close and try again.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await ph.attemptVerification({ code });
      await user.update({ primaryPhoneNumberId: ph.id });
      await user.reload();
      const oldId = oldPrimaryPhoneId.current;
      if (oldId && oldId !== ph.id) {
        const old = user.phoneNumbers.find((p) => p.id === oldId);
        if (old) {
          try {
            await old.destroy();
          } catch {
            /* ignore */
          }
        }
      }
      await reloadUser();
      closeModal();
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Invalid code."
          : "Invalid code.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const submitPassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      setModalError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError("New password and confirmation do not match.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      if (user.passwordEnabled) {
        if (!currentPassword) {
          setModalError("Enter your current password.");
          setModalBusy(false);
          return;
        }
        await user.updatePassword({
          currentPassword,
          newPassword,
          signOutOfOtherSessions: false,
        });
      } else {
        await user.updatePassword({ newPassword });
      }
      await reloadUser();
      closeModal();
    } catch (e) {
      setModalError(
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Could not update password."
          : "Could not update password.",
      );
    } finally {
      setModalBusy(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (!user) return;
    if (!user.deleteSelfEnabled) {
      Alert.alert(
        "Delete account",
        "Account deletion is not enabled for this app instance. Ask an admin or remove your account from the Clerk dashboard.",
      );
      return;
    }
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteAccount(),
        },
      ],
    );
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await user.delete();
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (e) {
      Alert.alert(
        "Could not delete",
        isClerkAPIResponseError(e)
          ? e.errors[0]?.message ?? "Try again later."
          : "Try again later.",
      );
    }
  };

  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const phone =
    user?.primaryPhoneNumber?.phoneNumber?.trim() || "—";
  const username = user?.username?.trim() || "—";
  const passkeyCount = user?.passkeys?.length ?? 0;
  const { eth, sol } = user?.web3Wallets
    ? classifyWeb3(user.web3Wallets)
    : { eth: "—", sol: "—" };

  if (!isLoaded) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#FF6A2A" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.mutedText}>Sign in to manage your account.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerPad, paddingBottom: bottomPad },
        ]}
      >
        <SectionLabel styles={styles}>Basic Info</SectionLabel>
        <View style={styles.card}>
          <AccountRow
            label="Email"
            value={email}
            onPress={openEmail}
            trailing="chevron"
            styles={styles}
            chevronColor={chrome.chevron}
          />
          <View style={styles.rowDivider} />
          <AccountRow
            label="Phone Number"
            value={phone}
            onPress={openPhone}
            trailing="edit"
            styles={styles}
            chevronColor={chrome.chevron}
          />
          <View style={styles.rowDivider} />
          <AccountRow
            label="Username"
            value={username}
            onPress={openUsername}
            trailing="edit"
            styles={styles}
            chevronColor={chrome.chevron}
          />
        </View>

        <SectionLabel styles={styles}>Security</SectionLabel>
        <View style={styles.card}>
          <AccountRow
            label="Passkeys"
            value={String(passkeyCount)}
            onPress={() =>
              Alert.alert(
                "Passkeys",
                "Manage passkeys from your device settings or Clerk’s web account portal for now.",
              )
            }
            styles={styles}
            chevronColor={chrome.chevron}
          />
          <View style={styles.rowDivider} />
          <AccountRow
            label="Password"
            value={user.passwordEnabled ? "••••••••" : "Not set"}
            onPress={openPassword}
            trailing="edit"
            styles={styles}
            chevronColor={chrome.chevron}
          />
        </View>

        <SectionLabel styles={styles}>Crypto Identities</SectionLabel>
        <View style={styles.card}>
          <StaticRow label="Ethereum Address" value={eth} styles={styles} />
          <View style={styles.rowDivider} />
          <StaticRow label="Solana Address" value={sol} styles={styles} />
        </View>
        <Text style={styles.cryptoHint}>
          We don&apos;t support linking crypto wallets in-app at this time. You
          can do so on the website.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </Pressable>
      </ScrollView>

      <View
        style={[styles.headerShell, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <BlurView
          pointerEvents="none"
          tint={chrome.blurTint}
          intensity={22}
          style={StyleSheet.absoluteFill}
          {...androidBlur}
        />
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={chrome.headerIcon} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Account Settings
            </Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={closeModal} hitSlop={12}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalBody}
          >
            {modalError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{modalError}</Text>
              </View>
            ) : null}

            {flow === "username" ? (
              <>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  placeholder="username"
                  placeholderTextColor={chrome.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitUsername()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Save</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {flow === "email" ? (
              <>
                <Text style={styles.fieldHint}>
                  Current: {user.primaryEmailAddress?.emailAddress}
                </Text>
                <Text style={styles.fieldLabel}>New email</Text>
                <TextInput
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="you@example.com"
                  placeholderTextColor={chrome.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitEmailRequest()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send code</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {flow === "emailCode" ? (
              <>
                <Text style={styles.fieldHint}>
                  Enter the code we sent to {emailInput.trim() || "your inbox"}.
                </Text>
                <Text style={styles.fieldLabel}>Verification code</Text>
                <TextInput
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="6-digit code"
                  placeholderTextColor={chrome.muted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitEmailCode()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & set primary</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {flow === "phone" ? (
              <>
                <Text style={styles.fieldHint}>
                  Use E.164 format with + and country code.
                </Text>
                <Text style={styles.fieldLabel}>Phone number</Text>
                <TextInput
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="+14085551234"
                  placeholderTextColor={chrome.muted}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitPhoneRequest()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send SMS code</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {flow === "phoneCode" ? (
              <>
                <Text style={styles.fieldHint}>
                  Enter the code we texted to {phoneInput.trim()}.
                </Text>
                <Text style={styles.fieldLabel}>SMS code</Text>
                <TextInput
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="6-digit code"
                  placeholderTextColor={chrome.muted}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitPhoneCode()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & set primary</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {flow === "password" ? (
              <>
                {user.passwordEnabled ? (
                  <>
                    <Text style={styles.fieldLabel}>Current password</Text>
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Current password"
                      placeholderTextColor={chrome.muted}
                      secureTextEntry
                      style={styles.input}
                    />
                  </>
                ) : null}
                <Text style={styles.fieldLabel}>New password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={chrome.muted}
                  secureTextEntry
                  style={styles.input}
                />
                <Text style={styles.fieldLabel}>Confirm new password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat new password"
                  placeholderTextColor={chrome.muted}
                  secureTextEntry
                  style={styles.input}
                />
                <Pressable
                  style={[styles.primaryBtn, modalBusy && styles.btnDisabled]}
                  disabled={modalBusy}
                  onPress={() => void submitPassword()}
                >
                  {modalBusy ? (
                    <ActivityIndicator color={chrome.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Update password</Text>
                  )}
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
