import { useCallback, useState } from 'react';
import { locationService } from '@/services/location.service';
import type { Coordinates } from '@/services/location.service';

interface UseLocationReturn {
  location: Coordinates | null;
  address: string;
  isLoading: boolean;
  error: string | null;
  fetchLocation: () => Promise<void>;
  setAddress: (address: string) => void;
  setLocation: (location: Coordinates | null) => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const granted = await locationService.requestPermission();
      if (!granted) {
        setError('Location permission denied. Please enter your address manually.');
        return;
      }
      const coords = await locationService.getCurrentPosition();
      setLocation(coords);
      const addr = await locationService.reverseGeocode(coords);
      setAddress(addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get your location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { location, address, isLoading, error, fetchLocation, setAddress, setLocation };
}
