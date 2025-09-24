"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BlueprintRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/blueprint");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Blueprint...</h1>
      <p>
        If you are not redirected,{" "}
        <Link href="/blueprint" className="text-blue-500 hover:underline">
          click here
        </Link>
        .
      </p>
    </div>
  );
}
