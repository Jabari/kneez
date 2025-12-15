import { useAuth } from '@/src/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/index" />;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24 }}>Hello from Kneez 👋</Text>
    </View>
  );
}



// export default function Index() {
//   const { isAuthenticated } = useAuth();

//   if (isAuthenticated) {
//     return <Redirect href="/(tabs)/index" />;
//   }

//   return <Redirect href="/welcome" />;
// }