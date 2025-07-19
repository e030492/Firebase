"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorageSync<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // This effect runs only on the client, after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // This is important to ensure the default value is set if nothing exists.
        window.localStorage.setItem(key, JSON.stringify(defaultValue));
      }
    } catch (error) {
      console.log(error);
      setStoredValue(defaultValue);
    }
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // This dispatches a storage event that other tabs can listen to.
          window.dispatchEvent(new StorageEvent("storage", { key }));
        }
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        // The event is only fired for other tabs, not the one that triggered the change.
        // We also check for our specific custom event for the originating tab.
      if (event.key === key) {
        const item = window.localStorage.getItem(key);
        if(item) {
            setStoredValue(JSON.parse(item));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export { useLocalStorageSync };
