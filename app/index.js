import { useAuth } from '../src/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/index" />;
  }
  return <Redirect href="/(tabs)/home" />;
  //return <Redirect href="/(public)/welcome" />;

}
