import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: '600',
        }}
      >
        Welcome to neez 👋
      </Text>

      <Text
        style={{
          opacity: 0.8,
          textAlign: 'center',
          paddingHorizontal: 24,
        }}
      >
        Rapid relief for knee pain with movement modifications and short, daily
        routines.
      </Text>

      <Link href="/assess" asChild>
        <Pressable
          style={{
            backgroundColor: '#6C2EB7',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '600',
            }}
          >
            Start an Assessment
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
