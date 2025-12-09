import { useAuth } from '@/src/contexts/AuthContext';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Welcome() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const player = useVideoPlayer(require('../../assets/videos/hiking.mp4'), videoPlayer => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    if (!player) return;
    player.loop = true;
    player.muted = true;
    player.play();
  }, [player]);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/index" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <VideoView
        style={styles.hero}
        player={player}
        contentFit="cover"
        nativeControls={false}
        accessibilityLabel="Nature scene with a person hiking"
      />

      <View style={styles.content}>
        <Text style={styles.title}>Kneez</Text>
        <Text style={styles.subtitle}>
          An AI-powered app for anyone with knee pain. Log in to continue your plan or start a new one.
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
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  title: {
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
