// app/(public)/welcome.js
import { ResizeMode, Video } from 'expo-video';
import { useRouter } from 'expo-router';
import { default as React } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';


export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background video */}
      <Video
        source={require('../../assets/videos/hiking.mp4')}
        style={styles.hero}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        useNativeControls={false}
        accessibilityLabel="Nature scene with a person hiking"
        onError={(e) => console.warn('Video error:', e)}
      />

      {/* Overlay content */}
      <View style={styles.content}>
        <Text style={styles.title}>Kneez</Text>
        <Text style={styles.subtitle}>
          An AI-powered app for anyone with knee pain.
        </Text>

        <Pressable
          onPress={() => router.push('/auth/login')}
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