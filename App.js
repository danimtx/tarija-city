import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

// Ignorar advertencias no críticas de Firebase
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted from react-native core'
]);

import Navigation from './src/navigation/Navigation';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Navigation />
    </>
  );
}
