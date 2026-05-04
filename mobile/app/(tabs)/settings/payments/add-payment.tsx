import { useUser } from "@clerk/expo";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsStackHeader } from "@/components/settings-stack-header";
import {
  createKairoApiFromEnv,
  getLinkedKairoUserId,
  KairoApiConfigurationError,
  KairoApiError,
} from "@/src/api";
import { useSettingsChrome } from "@/src/settings/settings-chrome";

function createAddPaymentStyles() {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: 16,
    },
    warn: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
    },
    warnText: {
      fontSize: 14,
      lineHeight: 20,
    },
    errorBanner: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 14,
      fontWeight: "500",
    },
    primaryBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 4,
    },
    btnDisabled: {
      opacity: 0.55,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "700",
    },
    note: {
      marginTop: 20,
      fontSize: 13,
      lineHeight: 19,
    },
  });
}

export default function AddPaymentMethodScreen() {
  const { user } = useUser();
  const linkedUserId = getLinkedKairoUserId(user);
  const insets = useSafeAreaInsets();
  const headerPad = insets.top + 52;
  const bottomPad = Math.max(insets.bottom, 16) + 32;
  const chrome = useSettingsChrome();
  const base = useMemo(() => createAddPaymentStyles(), []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openStripe = useCallback(async () => {
    setError(null);
    if (!linkedUserId) {
      setError(
        "Link your Clerk account to Kairo (set publicMetadata or unsafeMetadata kairoUserId to your Prisma User id) so the API can identify you.",
      );
      return;
    }
    setBusy(true);
    try {
      const api = createKairoApiFromEnv({ userId: linkedUserId });
      const { url } = await api.createBillingPortalSession({
        flow: "payment_method_update",
      });
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      if (e instanceof KairoApiConfigurationError) {
        setError(e.message);
      } else if (e instanceof KairoApiError) {
        setError(e.message);
      } else {
        setError("Could not open Stripe. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }, [linkedUserId]);

  return (
    <View style={{ flex: 1, backgroundColor: chrome.screen }}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          base.scroll,
          { paddingTop: headerPad, paddingBottom: bottomPad },
        ]}
      >
        <Text style={{ color: chrome.label, fontSize: 16, lineHeight: 24, marginBottom: 20 }}>
          Add or update the card on file using Stripe&apos;s hosted Customer Billing flow. Kairo does not
          store your full card number.
        </Text>
        {!linkedUserId ? (
          <View
            style={[
              base.warn,
              {
                backgroundColor: "rgba(255, 193, 7, 0.12)",
                borderColor: "rgba(255, 193, 7, 0.35)",
              },
            ]}
          >
            <Text style={[base.warnText, { color: "rgba(180, 120, 0, 0.95)" }]}>
              No linked Kairo user id on your Clerk account. Set metadata{" "}
              <Text style={{ fontWeight: "700" }}>kairoUserId</Text> to your database User id (see
              Settings → Developer).
            </Text>
          </View>
        ) : null}
        {error ? (
          <View style={[base.errorBanner, { backgroundColor: chrome.errorBannerBg }]}>
            <Text style={[base.errorText, { color: chrome.errorBannerText }]}>{error}</Text>
          </View>
        ) : null}
        <Pressable
          style={[
            base.primaryBtn,
            { backgroundColor: chrome.primaryBtnBg },
            (busy || !linkedUserId) && base.btnDisabled,
          ]}
          disabled={busy || !linkedUserId}
          onPress={() => void openStripe()}
        >
          {busy ? (
            <ActivityIndicator color={chrome.primaryBtnText} />
          ) : (
            <Text style={[base.primaryBtnText, { color: chrome.primaryBtnText }]}>Continue to Stripe</Text>
          )}
        </Pressable>
        <Text style={[base.note, { color: chrome.muted }]}>
          Configure the Stripe Customer portal and products in your Stripe Dashboard. If the
          dedicated “update payment method” flow is disabled, we fall back to the full billing portal.
        </Text>
      </ScrollView>
      <SettingsStackHeader title="Add payment" />
    </View>
  );
}
