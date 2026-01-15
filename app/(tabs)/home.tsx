import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { loginMethod, user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>neez</Text>
        {loginMethod && (
          <Text style={styles.loginMethod}>
            Signed in with {loginMethod}
            {user?.email ? ` · ${user.email}` : ''}
          </Text>
        )}
      </View>

      <Text style={styles.copy}>
        Feeling knee pain? Talk to me - we'll figure it out together!
      </Text>

      <Button
        title="Start New Assessment"
        size="lg"
        accessibilityLabel="Start a new assessment"
        onPress={() => router.push('/intake-chat')}
        style={styles.primaryAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
    backgroundColor: '#fff',
  },
  header: {
    gap: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  loginMethod: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  copy: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  primaryAction: {
    alignSelf: 'flex-start',
  },
});
