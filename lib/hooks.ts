'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the component has hydrated on the client.
 * Use this to avoid hydration mismatches when rendering content 
 * that depends on client-side state (like localStorage).
 */
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
