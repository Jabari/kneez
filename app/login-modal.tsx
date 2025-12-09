import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function LoginModal() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (provider: 'google' | 'email') => {
    login(provider);
    router.replace('/(tabs)/index');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Log in to continue</Text>
        <Text style={styles.subtitle}>
          Choose how you want to continue. You can switch methods anytime.
        </Text>

        <View style={styles.buttons}>
          <Button
            title="Continue with Google"
            size="lg"
            style={styles.button}
            onPress={() => handleLogin('google')}
          />
          <Button
            title="Continue with Email"
            size="lg"
            variant="secondary"
            style={styles.button}
            onPress={() => handleLogin('email')}
          />
          <Button
            title="Not now"
            variant="ghost"
            size="lg"
            style={styles.button}
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 20,
  },
  buttons: {
    gap: 10,
    marginTop: 8,
  },
  button: {
    width: '100%',
  },
});
