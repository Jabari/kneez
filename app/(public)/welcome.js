// app/(public)/welcome.js
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Welcome() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Create the player and configure it once
  const player = useVideoPlayer("https://kneez.s3.us-west-2.amazonaws.com/welcome1.mp4", (player) => {
    player.loop = true;   // isLooping
    player.muted = true;  // isMuted
    player.play();        // shouldPlay
  });

  useEffect(() => {
    if (!player) return;
    player.loop = true;   // isLooping
    player.muted = true;  // isMuted
    player.play();        // shouldPlay
  },[player])

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background video */}
      <VideoView
        style={styles.hero}
        player={player}
        contentFit="cover"           // same as before
        nativeControls={false}       // useNativeControls={false}
        accessibilityLabel="Nature scene with a person hiking"
      />

      {/* Overlay content */}
      <View style={styles.content}>
        <Text style={styles.title}>neez</Text>
        <Text style={styles.subtitle}>
          An AI-powered app for anyone with knee pain.
        </Text>

        <Pressable
          onPress={() => router.push('/login-modal')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  hero: {
    width: '100%',
    height: '50%',
  },
  content: {
    flex: 1,
    fontFamily: 'SpaceGrotesk_400Regular',
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: Platform.select({ ios: '700', android: '700', default: '700' }),
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    color: '#4B4B4B',
  },
  cta: {
    marginTop: 'auto',
    marginBottom: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
