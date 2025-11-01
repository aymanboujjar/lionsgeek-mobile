import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Entry() {
  useEffect(() => {
    // Redirect to loading screen for token verification
    router.replace('/loading');
  }, []);

  return null;
}


