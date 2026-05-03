import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const Index = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });
  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6A2A" />
      </View>
    );
  }

  if (authLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/auth-bg.jpeg")}
          style={styles.image}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.95)"]}
          locations={[0, 0.4, 1]}
          style={styles.gradient}
        />
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Kairo.</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>PUT YOUR GOALS ON THE LINE.</Text>

        <Text style={styles.subTitle}>
          Make a commitment. Submit proof. Let your circle verify you followed
          through.
        </Text>
        <Pressable
          onPress={() => router.push("/sign-up")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.footerText}>
          No excuses. Just proof, stakes, and people watching.
        </Text>
      </View>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "flex-end",
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

  logoContainer: {
    position: "absolute",
    top: 64,
    left: 24,
    zIndex: 10,
  },

  logo: {
    color: "#F8FAFC",
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.8,
  },

  content: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 48,
    zIndex: 10,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 44,
    lineHeight: 54,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -2.2,
    marginBottom: 16,
  },

  subTitle: {
    color: "#CBD5E1",
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
  },
  button: {
    width: "100%",
    height: 58,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  buttonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  footerText: {
    color: "#8B95A1",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 18,
  },
});
