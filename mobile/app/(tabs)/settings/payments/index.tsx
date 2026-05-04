import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

type Ion = ComponentProps<typeof Ionicons>["name"];

type PaymentsHubStyles = ReturnType<typeof createPaymentsHubStyles>;

function IconTile({
  name,
  bg,
  styles,
}: {
  name: Ion;
  bg: string;
  styles: PaymentsHubStyles;
}) {
  return (
    <View style={[styles.iconTile, { backgroundColor: bg }]}>
      <Ionicons name={name} size={18} color="#fff" />
    </View>
  );
}

function createPaymentsHubStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.screen,
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
    group: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: c.label,
      fontSize: 16,
      fontWeight: "500",
    },
    rowSubtitle: {
      marginTop: 4,
      color: c.muted,
      fontSize: 13,
    },
    iconTile: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    footerHint: {
      marginTop: 18,
      marginHorizontal: 4,
      fontSize: 12,
      lineHeight: 17,
      color: c.hint,
    },
  });
}

function PaymentRow({
  leading,
  title,
  subtitle,
  onPress,
  showDivider,
  styles,
  chevronColor,
}: {
  leading: ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  styles: PaymentsHubStyles;
  chevronColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        pressed && { opacity: 0.75 },
      ]}
    >
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={chevronColor} />
    </Pressable>
  );
}

export default function PaymentsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 28;
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createPaymentsHubStyles(chrome), [chrome]);

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
        <Text style={styles.sectionLabel}>Billing</Text>
        <View style={styles.group}>
          <PaymentRow
            leading={<IconTile name="add-circle-outline" bg="#7C3AED" styles={styles} />}
            title="Add payment method"
            subtitle="Secure card setup via Stripe Customer Billing"
            onPress={() => router.push("/(tabs)/settings/payments/add-payment")}
            showDivider
            styles={styles}
            chevronColor={chrome.chevron}
          />
          <PaymentRow
            leading={<IconTile name="receipt-outline" bg="#0A84FF" styles={styles} />}
            title="Purchase history"
            subtitle="View charges and receipts from Stripe"
            onPress={() => router.push("/(tabs)/settings/payments/history")}
            styles={styles}
            chevronColor={chrome.chevron}
          />
        </View>
        <Text style={styles.footerHint}>
          Payments are processed by Stripe. Your Clerk user should include{" "}
          <Text style={{ fontWeight: "700", color: chrome.label }}>kairoUserId</Text> in public or unsafe metadata (Prisma
          User.id) so the server can attach billing to your account.
        </Text>
      </ScrollView>
      <SettingsStackHeader title="Payment" />
    </View>
  );
}
