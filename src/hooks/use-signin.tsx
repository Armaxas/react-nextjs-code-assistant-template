"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  const signInGitHub = async () => {
    try {
      setIsSigningIn(true);
      const result = await signIn("github", { redirect: false });

      if (result?.error) {
        console.error("GitHub sign in error:", result.error);
        return false;
      }

      // Refresh to update the session
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error during GitHub sign in:", error);
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    signInGitHub,
    isSigningIn,
  };
}
