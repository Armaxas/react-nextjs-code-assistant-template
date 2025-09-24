import { useEffect, useState } from "react";

type ColorScheme = "dark" | "light";

const useColorScheme = (): ColorScheme => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    // Check if window is defined (browser environment)
    if (typeof window !== "undefined") {
      // Check if user has system-level dark mode enabled
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create media query list
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Define update function
    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? "dark" : "light");
    };

    // Add listener for changes
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return colorScheme;
};

export default useColorScheme;
