"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
// import { signInGitHub } from "../../actions";

const AuthenticateGitHub = () => {
  //   const router = useRouter();
  const searchParams = useSearchParams();
  const authStep = searchParams.get("authstep");
  useEffect(() => {
    // If user just logged in with OAuth, trigger GitHub sign-in
    if (authStep === "ibmw3id") {
      //   signInGitHub();
    }
  }, [authStep]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      Authenticating Github...
    </div>
  );
};

export default function GitHub() {
  return (
    <Suspense>
      <AuthenticateGitHub />
    </Suspense>
  );
}
