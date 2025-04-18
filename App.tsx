import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

import { NhostClient, NhostProvider } from '@nhost/react';
import { NhostApolloProvider } from '@nhost/react-apollo';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

// Ensure Buffer and atob are globally available for compatibility
if (!global.Buffer) {
  global.Buffer = Buffer;
}

if (!global.atob) {
  global.atob = (input: string) => Buffer.from(input, 'base64').toString('binary');
}

// Initialize Nhost client
const nhost = new NhostClient({
  subdomain: 'yqqznnymyrqpxvnneivt',
  region: 'ap-south-1',
  clientStorageType: 'expo-secure-storage', // Use expo-secure-storage for secure storage
  clientStorage: SecureStore,
});

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <NhostProvider nhost={nhost}>
          <NhostApolloProvider nhost={nhost}>
            <Navigation colorScheme={colorScheme} />
          </NhostApolloProvider>
        </NhostProvider>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}
