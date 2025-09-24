"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/"); // Redirect to home if not logged in
      return;
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "admin") {
      router.push("/"); // Redirect to home if not an admin
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white text-lg">Access denied. Redirecting...</div>
      </div>
    );
  }

  // Simple test layout to see if sidebar appears
  return <Dashboard />;
}
