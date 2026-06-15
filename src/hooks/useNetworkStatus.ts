import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => {
        setStatus({
          isConnected: navigator.onLine,
          isInternetReachable: navigator.onLine,
        });
      };
      update();
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }

    let mounted = true;

    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (mounted) setStatus({ isConnected: true, isInternetReachable: true });
      } catch {
        if (mounted) setStatus({ isConnected: false, isInternetReachable: false });
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
