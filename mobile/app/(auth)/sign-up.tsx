import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useFonts,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { isClerkAPIResponseError, useAuth } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";

type FormErrors = {
  email?: string;
  password?: string;
  code?: string;
  general?: string;
  terms?: string;
};

type ClerkSignUpStatus = "missing_requirements" | "complete" | "abandoned" | null;

function formatMissingSignUpField(field: string): string {
  const labels: Record<string, string> = {
    legal_accepted: "Terms and Privacy acceptance",
    first_name: "First name",
    last_name: "Last name",
    username: "Username",
    password: "Password",
    email_address: "Email address",
    phone_number: "Phone number",
  };
  return labels[field] ?? field.replace(/_/g, " ");
}

async function resolveSignUpSession(signUp: {
  reload: () => Promise<unknown>;
  status: string | null;
  createdSessionId: string | null;
}): Promise<{ status: ClerkSignUpStatus; sessionId: string | null }> {
  await signUp.reload();
  return {
    status: signUp.status as ClerkSignUpStatus,
    sessionId: signUp.createdSessionId,
  };
}

const SignUp = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signUp, setActive, isLoaded: signUpLoaded } = useSignUp();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [finishingSignup, setFinishingSignup] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [needsLegalAcceptance, setNeedsLegalAcceptance] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else     if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Accept the terms to continue.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignUp = async () => {
    setErrors({});

    if (!validateForm()) return;
    if (!signUpLoaded || !signUp) {
      setErrors({ general: "Authentication is not ready yet. Try again." });
      return;
    }

    try {
      setIsSubmitting(true);

      const created = await signUp.create({
        emailAddress: email.trim(),
        password,
        legalAccepted: acceptedTerms,
      });

      if (created.status === "complete" && created.createdSessionId) {
        setFinishingSignup(true);
        await setActive({ session: created.createdSessionId });
        router.replace("/(onboarding)");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNeedsLegalAcceptance(false);
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const msg = err.errors[0]?.message;
        setErrors({
          general: msg ?? "Could not create your account. Try again.",
        });
      } else {
        setErrors({
          general: "Could not create your account. Try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activateSession = async (sessionId: string) => {
    if (!setActive) return;
    setFinishingSignup(true);
    await setActive({ session: sessionId });
    router.replace("/(onboarding)");
  };

  const handleVerifyCode = async () => {
    setErrors({});
    setNeedsLegalAcceptance(false);
    const trimmed = verificationCode.trim();
    if (!trimmed) {
      setErrors({ code: "Enter the verification code from your email." });
      return;
    }
    if (!signUpLoaded || !signUp) return;

    try {
      setIsSubmitting(true);
      const result = await signUp.attemptEmailAddressVerification({
        code: trimmed,
      });

      let sessionId = result.createdSessionId;
      let status = result.status as ClerkSignUpStatus;

      if (status === "complete" && sessionId) {
        await activateSession(sessionId);
        return;
      }

      const synced = await resolveSignUpSession(signUp);
      sessionId = synced.sessionId;
      status = synced.status;

      if (status === "complete" && sessionId) {
        await activateSession(sessionId);
        return;
      }

      if (status === "missing_requirements") {
        const missing = signUp.missingFields ?? [];
        const onlyLegal =
          missing.length === 1 && missing[0] === "legal_accepted";
        if (onlyLegal) {
          setNeedsLegalAcceptance(true);
          setErrors({
            general:
              "Your email is verified. Accept the terms below to finish creating your account.",
          });
          return;
        }
        const human = missing.map(formatMissingSignUpField).join(", ");
        setErrors({
          general: human
            ? `Your email is verified, but sign-up still needs: ${human}. Adjust required fields in Clerk Dashboard → User & authentication, or collect them in this app.`
            : "Your email is verified, but sign-up is still incomplete. Check Clerk Dashboard sign-up requirements.",
        });
        return;
      }

      setErrors({
        general: "Verification incomplete. Check the code and try again.",
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const msg = err.errors[0]?.message;
        setErrors({
          general: msg ?? "Invalid or expired code. Try again.",
        });
      } else {
        setErrors({ general: "Invalid or expired code. Try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptLegalAndFinish = async () => {
    if (!signUpLoaded || !signUp) return;
    setErrors({});
    try {
      setIsSubmitting(true);
      const updated = await signUp.update({ legalAccepted: true });
      let sessionId = updated.createdSessionId;
      let status = updated.status as ClerkSignUpStatus;
      if (status !== "complete" || !sessionId) {
        const synced = await resolveSignUpSession(signUp);
        sessionId = synced.sessionId;
        status = synced.status;
      }
      if (status === "complete" && sessionId) {
        setNeedsLegalAcceptance(false);
        await activateSession(sessionId);
        return;
      }
      setErrors({
        general: "Could not finish sign-up. Try again or start over from Create Account.",
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const msg = err.errors[0]?.message;
        setErrors({ general: msg ?? "Could not complete sign-up." });
      } else {
        setErrors({ general: "Could not complete sign-up." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoaded && isSignedIn && !finishingSignup) {
    return <Redirect href="/(tabs)" />;
  }

  if (!fontsLoaded || !signUpLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6A2A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/auth-bg.jpeg")}
            style={styles.image}
            resizeMode="cover"
          />

          <LinearGradient
            colors={[
              "rgba(0,0,0,0.2)",
              "rgba(0,0,0,0.55)",
              "rgba(11,15,20,0.98)",
            ]}
            locations={[0, 0.45, 1]}
            style={styles.gradient}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <AntDesign name="left" size={18} color="#F8FAFC" />
            </Pressable>

            <Text style={styles.logo}>Kairo.</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>
                {pendingVerification ? "Verify email" : "Join Kairo"}
              </Text>

              <Text style={styles.title}>
                {pendingVerification
                  ? "CHECK YOUR INBOX."
                  : "CREATE YOUR ACCOUNT."}
              </Text>

              <Text style={styles.subTitle}>
                {pendingVerification
                  ? `We sent a code to ${email.trim()}. Enter it below to continue.`
                  : "Start tracking goals with proof, stakes, and people holding you accountable."}
              </Text>

              {errors.general ? (
                <View style={styles.generalErrorBox}>
                  <Text style={styles.generalErrorText}>{errors.general}</Text>
                </View>
              ) : null}

              {pendingVerification ? (
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Verification code</Text>
                    <TextInput
                      value={verificationCode}
                      onChangeText={(text) => {
                        setVerificationCode(text);
                        setErrors((prev) => ({ ...prev, code: undefined }));
                      }}
                      placeholder="6-digit code"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, errors.code && styles.inputError]}
                    />
                    {errors.code ? (
                      <Text style={styles.errorText}>{errors.code}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={handleVerifyCode}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0B0F14" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & continue</Text>
                    )}
                  </Pressable>

                  {needsLegalAcceptance ? (
                    <Pressable
                      onPress={handleAcceptLegalAndFinish}
                      disabled={isSubmitting}
                      style={({ pressed }) => [
                        styles.buttonSecondary,
                        pressed && styles.buttonSecondaryPressed,
                        isSubmitting && styles.buttonDisabled,
                      ]}
                    >
                      <Text style={styles.buttonSecondaryText}>
                        Accept terms & finish sign-up
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, errors.email && styles.inputError]}
                    />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        errors.password && styles.inputError,
                      ]}
                    />
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => {
                      setAcceptedTerms((v) => !v);
                      setErrors((prev) => ({ ...prev, terms: undefined }));
                    }}
                    style={styles.termsRow}
                  >
                    <View
                      style={[
                        styles.checkboxOuter,
                        acceptedTerms && styles.checkboxOuterOn,
                      ]}
                    >
                      {acceptedTerms ? (
                        <AntDesign name="check" size={14} color="#0B0F14" />
                      ) : null}
                    </View>
                    <Text style={styles.termsLabel}>
                      I agree to the Terms of Service and Privacy Policy.
                    </Text>
                  </Pressable>
                  {errors.terms ? (
                    <Text style={styles.errorText}>{errors.terms}</Text>
                  ) : null}

                  <Pressable
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0B0F14" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </Pressable>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Pressable onPress={() => router.push("/sign-in")}>
                  <Text style={styles.footerLink}> Sign in</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  loading: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    color: "#F8FAFC",
    fontSize: 26,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.8,
  },

  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 80,
  },

  card: {
    width: "100%",
    borderRadius: 28,
  },

  eyebrow: {
    color: "#FF6A2A",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.7,
    marginBottom: 12,
  },

  subTitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },

  generalErrorBox: {
    backgroundColor: "rgba(239,68,68,0.13)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.36)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
  },

  generalErrorText: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_600SemiBold",
  },

  form: {
    gap: 15,
  },

  field: {
    gap: 8,
  },

  label: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 16,
    color: "white",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },

  inputError: {
    borderColor: "rgba(239,68,68,0.5)",
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_500Medium",
  },

  button: {
    width: "100%",
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
    marginTop: 6,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  buttonSecondary: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  buttonSecondaryPressed: {
    opacity: 0.85,
  },

  buttonSecondaryText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 2,
  },

  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    backgroundColor: "transparent",
  },

  checkboxOuterOn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },

  termsLabel: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
  },

  footer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  footerLink: {
    color: "#F8FAFC",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
