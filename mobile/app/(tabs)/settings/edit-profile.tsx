import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  mergeKairoProfileIntoUnsafe,
  parseKairoProfile,
  type KairoSocialLinks,
} from "@/src/features/profile/kairo-profile-metadata";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

type Ion = ComponentProps<typeof Ionicons>["name"];

const androidBlur =
  Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

const AVATAR = 120;

const SOCIAL_FIELDS: {
  key: keyof KairoSocialLinks;
  label: string;
  placeholder: string;
  icon: Ion;
  iconBg: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "username",
    icon: "logo-instagram",
    iconBg: "#E1306C",
  },
  {
    key: "x",
    label: "X (Twitter)",
    placeholder: "username",
    icon: "logo-twitter",
    iconBg: "#000000",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "@username",
    icon: "logo-youtube",
    iconBg: "#FF0000",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "@username",
    icon: "logo-tiktok",
    iconBg: "#000000",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "/in/username",
    icon: "logo-linkedin",
    iconBg: "#0A66C2",
  },
  {
    key: "website",
    label: "Website",
    placeholder: "www.your-site.com",
    icon: "globe-outline",
    iconBg: "#636366",
  },
];

function createEditProfileStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.screen,
    },
    flex: { flex: 1 },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      paddingHorizontal: 16,
    },
    photoBlock: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 28,
    },
    avatarTouch: {
      position: "relative",
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line,
    },
    avatarFallback: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.line,
      backgroundColor: c.inputFill,
      alignItems: "center",
      justifyContent: "center",
    },
    photoFab: {
      position: "absolute",
      right: 2,
      bottom: 2,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: c.screen,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
      elevation: 4,
    },
    photoFabInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 0,
    },
    sectionTitle: {
      marginBottom: 10,
      marginLeft: 4,
      fontSize: 15,
      fontWeight: "600",
      color: c.muted,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
      marginBottom: 22,
    },
    rowHairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.cardBorder,
      marginLeft: 14,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      minHeight: 52,
    },
    nameLabel: {
      width: 100,
      fontSize: 16,
      fontWeight: "400",
      color: c.muted,
    },
    nameValue: {
      flex: 1,
      fontSize: 16,
      fontWeight: "400",
      color: c.label,
      textAlign: "right",
      padding: 0,
      margin: 0,
    },
    bioInput: {
      minHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      lineHeight: 22,
      color: c.label,
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    brandTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    socialLabel: {
      width: 108,
      fontSize: 16,
      fontWeight: "500",
      color: c.label,
    },
    socialInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: "400",
      color: c.label,
      textAlign: "right",
      padding: 0,
      minWidth: 0,
    },
    footer: {
      marginTop: 8,
      marginHorizontal: 6,
      fontSize: 13,
      lineHeight: 19,
      color: c.hint,
      textAlign: "center",
    },
    footerLink: {
      color: c.modalLink,
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
    headerCircleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.headerBackBtnBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCircleBtnDim: {
      opacity: 0.55,
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
  });
}

type EditProfileStyles = ReturnType<typeof createEditProfileStyles>;

function BrandIcon({
  name,
  bg,
  styles,
}: {
  name: Ion;
  bg: string;
  styles: EditProfileStyles;
}) {
  return (
    <View style={[styles.brandTile, { backgroundColor: bg }]}>
      <Ionicons name={name} size={20} color="#fff" />
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoaded } = useUser();
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createEditProfileStyles(chrome), [chrome]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [social, setSocial] = useState<KairoSocialLinks>({});
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const hydrate = useCallback(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    const p = parseKairoProfile(user.unsafeMetadata);
    setBio(p.bio ?? "");
    setSocial(p.social ?? {});
  }, [user]);

  useEffect(() => {
    hydrate();
  }, [user?.id, user?.updatedAt, hydrate]);

  const dirty = useMemo(() => {
    if (!user) return false;
    const p = parseKairoProfile(user.unsafeMetadata);
    const prevSocial = p.social ?? {};
    if ((user.firstName ?? "") !== firstName) return true;
    if ((user.lastName ?? "") !== lastName) return true;
    if ((p.bio ?? "") !== bio) return true;
    for (const k of Object.keys({ ...prevSocial, ...social }) as (keyof KairoSocialLinks)[]) {
      if ((prevSocial[k] ?? "").trim() !== (social[k] ?? "").trim()) return true;
    }
    return false;
  }, [user, firstName, lastName, bio, social]);

  const onPickPhoto = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Photos",
        "Please allow photo library access in Settings to change your picture.",
      );
      return;
    }
    setPickingPhoto(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? "image/jpeg";
      const dataUri = `data:${mime};base64,${asset.base64}`;
      await user.setProfileImage({ file: dataUri });
      await user.reload();
    } catch (e) {
      Alert.alert(
        "Photo",
        e instanceof Error ? e.message : "Could not update profile photo.",
      );
    } finally {
      setPickingPhoto(false);
    }
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const nextUnsafe = mergeKairoProfileIntoUnsafe(user.unsafeMetadata, {
        bio,
        social,
      });
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        unsafeMetadata: nextUnsafe,
      });
      await user.reload();
      hydrate();
      router.back();
    } catch (e) {
      Alert.alert(
        "Save failed",
        e instanceof Error ? e.message : "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setSocialField = (key: keyof KairoSocialLinks, value: string) => {
    setSocial((prev) => ({ ...prev, [key]: value }));
  };

  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 28) + 40;

  if (!isLoaded) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={chrome.label} />
      </View>
    );
  }

  const saveDisabled = saving || !user || !dirty;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: headerPad, paddingBottom: bottomPad },
          ]}
        >
          <View style={styles.photoBlock}>
            <Pressable
              onPress={() => void onPickPhoto()}
              disabled={pickingPhoto || !user}
              style={({ pressed }) => [
                styles.avatarTouch,
                pressed && { opacity: 0.92 },
              ]}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={48} color={chrome.muted} />
                </View>
              )}
              <View style={styles.photoFab}>
                {pickingPhoto ? (
                  <ActivityIndicator color={chrome.primaryBtnText} size="small" />
                ) : (
                  <View style={styles.photoFabInner}>
                    <Ionicons name="images-outline" size={14} color={chrome.primaryBtnText} />
                    <Ionicons name="add" size={16} color={chrome.primaryBtnText} />
                  </View>
                )}
              </View>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={chrome.muted}
                style={styles.nameValue}
                autoCapitalize="words"
                autoCorrect
              />
            </View>
            <View style={styles.rowHairline} />
            <View style={styles.nameRow}>
              <Text style={styles.nameLabel}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={chrome.muted}
                style={styles.nameValue}
                autoCapitalize="words"
                autoCorrect
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Bio</Text>
          <View style={styles.card}>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about you"
              placeholderTextColor={chrome.muted}
              style={styles.bioInput}
              multiline
              maxLength={280}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionTitle}>Social Handles</Text>
          <View style={styles.card}>
            {SOCIAL_FIELDS.map(({ key, label, placeholder, icon, iconBg }, i) => (
              <View key={key}>
                {i > 0 ? <View style={styles.rowHairline} /> : null}
                <View style={styles.socialRow}>
                  <BrandIcon name={icon} bg={iconBg} styles={styles} />
                  <Text style={styles.socialLabel}>{label}</Text>
                  <TextInput
                    value={social[key] ?? ""}
                    onChangeText={(t) => setSocialField(key, t)}
                    placeholder={placeholder}
                    placeholderTextColor={chrome.muted}
                    style={styles.socialInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>
            You can edit your username in{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/(tabs)/settings/account")}
            >
              Account Settings
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

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
              styles.headerCircleBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={chrome.headerIcon} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Edit Profile
            </Text>
          </View>
          <Pressable
            onPress={() => void onSave()}
            disabled={saveDisabled}
            style={({ pressed }) => [
              styles.headerCircleBtn,
              saveDisabled && styles.headerCircleBtnDim,
              pressed && !saveDisabled && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
          >
            {saving ? (
              <ActivityIndicator color={chrome.label} size="small" />
            ) : (
              <Ionicons
                name="checkmark"
                size={22}
                color={saveDisabled ? chrome.inactiveIcon : chrome.label}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
