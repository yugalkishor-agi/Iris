import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../contexts/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

export default function SplashScreen({ navigation }: any) {
  const { user, loading } = useAuth();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [opacity, translateY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigation.replace("Main");
      } else {
        navigation.replace("Welcome");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading, navigation]);

  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a', '#000000']}
      style={styles.container}
    >
      <Animated.View 
        style={[styles.content, contentStyle]}
      >
        <Image
          source={require('../../public/Iris-logo-splesh-screen.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.slogan}>
          Made with Love, Shared with the World.
        </Text>
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <View style={styles.indiaContainer}>
            <Text style={styles.indiaTextSaffron}>I</Text>
            <Text style={styles.indiaTextSaffron}>n</Text>
            <Text style={styles.indiaTextWhite}>d</Text>
            <Text style={styles.indiaTextWhite}>i</Text>
            <Text style={styles.indiaTextGreen}>a</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: -30,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 40,
  },
  slogan: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredByText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  indiaContainer: {
    flexDirection: 'row',
  },
  indiaTextSaffron: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9933',
  },
  indiaTextWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  indiaTextGreen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#138808',
  },
});
