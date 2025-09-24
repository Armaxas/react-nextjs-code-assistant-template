"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";

function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    let currentValue: T;

    try {
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(key);
        currentValue = item ? JSON.parse(item) : defaultValue;
      } else {
        currentValue = defaultValue;
      }
    } catch (error) {
      console.log("error while setting localStorage:", error);
      currentValue = defaultValue;
    }

    return currentValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [value, key]);

  return [value, setValue];
}

export default useLocalStorage;
