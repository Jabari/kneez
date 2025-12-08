import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to neez 👋</Text>
      <Text style={styles.copy}>
        Rapid relief for knee pain with movement modifications and short, daily routines.
      </Text>

      <Link href="/assess" asChild>
        <Button title="Start an Assessment" size="lg" accessibilityLabel="Start an assessment" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  copy: {
    opacity: 0.8,
    textAlign: 'center',
  },
});
