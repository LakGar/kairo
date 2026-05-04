import { useUser } from "@clerk/expo";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import { FeatureEmptyState } from "@/src/components/feature-empty-state";
import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  type ApiBillingPurchase,
  KairoApiConfigurationError,
  KairoApiError,
} from "@/src/api";
import {
  type SettingsChrome,
  useSettingsChrome,
} from "@/src/settings/settings-chrome";

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase() || "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function createHistoryStyles(c: SettingsChrome) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screen },
    scroll: { paddingHorizontal: 16 },
    center: { paddingVertical: 48, alignItems: "center" },
    banner: {
      backgroundColor: c.errorBannerBg,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    bannerText: { color: c.errorBannerText, fontSize: 14, lineHeight: 20 },
    group: {
      marginTop: 8,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 12,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    rowMain: { flex: 1, minWidth: 0 },
    amount: {
      color: c.label,
      fontSize: 17,
      fontWeight: "700",
    },
    desc: {
      marginTop: 4,
      color: c.label,
      fontSize: 14,
    },
    meta: {
      marginTop: 6,
      color: c.muted,
      fontSize: 12,
    },
    receiptBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor:
        c.blurTint === "dark"
          ? "rgba(10,132,255,0.2)"
          : "rgba(37, 99, 235, 0.12)",
    },
    receiptText: {
      color: c.modalLink,
      fontSize: 13,
      fontWeight: "700",
    },
  });
}

export default function PurchaseHistoryScreen() {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const chrome = useSettingsChrome();
  const styles = useMemo(() => createHistoryStyles(chrome), [chrome]);

  const [rows, setRows] = useState<ApiBillingPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!linkedUserId) {
      setError(
        "Link your Clerk account (metadata kairoUserId → Prisma User.id) so the API can load your purchases.",
      );
      setRows([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      const list = await api.listBillingPurchases();
      setRows(list);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError(e.message);
      } else if (e instanceof KairoApiError) {
        setError(e.message);
      } else {
        setError("Could not load purchase history.");
      }
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [linkedUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6A2A"
          />
        }
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerPad, paddingBottom: bottomPad },
        ]}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FF6A2A" />
          </View>
        ) : error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        ) : rows.length === 0 ? (
          <FeatureEmptyState
            colors={{
              textPrimary: chrome.label,
              textMuted: chrome.muted,
              icon: chrome.muted,
            }}
            icon="receipt-outline"
            title="No purchases yet"
            subtitle="When you buy entries or add-ons, they will appear here with status and receipt links."
            compact
          />
        ) : (
          <View style={styles.group}>
            {rows.map((r, i) => (
              <View
                key={r.id}
                style={[styles.row, i > 0 && styles.rowBorder]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.amount}>
                    {formatMoney(r.amountCents, r.currency)}
                  </Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {r.description ?? "Payment"}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(
                      r.created > 1e12 ? r.created : r.created * 1000,
                    ).toLocaleString()}{" "}
                    · {r.status}
                  </Text>
                </View>
                {r.receiptUrl ? (
                  <Pressable
                    onPress={() => void Linking.openURL(r.receiptUrl!)}
                    style={styles.receiptBtn}
                  >
                    <Text style={styles.receiptText}>Receipt</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <SettingsStackHeader title="Purchase history" />
    </View>
  );
}
