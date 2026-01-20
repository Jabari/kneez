import { Button } from '../components/ui/button';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginModal() {
  const router = useRouter();
  const {
    loginWithEmail,
    loginWithGoogle,
    isAuthenticated,
    isLoading,
    authError,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, router]);

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (!success) {
      setEmailSent(false);
    }
  };

  const handleEmailLogin = async () => {
    clearError();
    setEmailSent(false);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }
    const success = await loginWithEmail(trimmedEmail);
    setEmailSent(success);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Log in to continue</Text>
        <Text style={styles.subtitle}>
          Choose how you want to continue. You can switch methods anytime.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (authError) {
                clearError();
              }
            }}
            editable={!isLoading}
          />
          {emailSent && (
            <Text style={styles.helperText}>Check your email for the sign-in link.</Text>
          )}
          {authError && <Text style={styles.errorText}>{authError}</Text>}
        </View>

        <View style={styles.buttons}>
          <Button
            title="Continue with Google"
            size="lg"
            style={styles.button}
            onPress={handleGoogleLogin}
            loading={isLoading}
          />
          <Button
            title="Continue with Email"
            size="lg"
            variant="secondary"
            style={styles.button}
            onPress={handleEmailLogin}
            loading={isLoading}
            disabled={!email.trim()}
          />
          <Button
            title="Not now"
            variant="ghost"
            size="lg"
            style={styles.button}
            onPress={() => router.push('/(tabs)/home')}
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
  form: {
    gap: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  helperText: {
    fontSize: 13,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  buttons: {
    gap: 10,
    marginTop: 8,
  },
  button: {
    width: '100%',
  },
});
