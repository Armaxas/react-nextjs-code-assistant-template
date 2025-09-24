"use client";

import { useSession } from "next-auth/react";

export function useSidebarSession() {
  const { data: session } = useSession();
  return { user: session?.user };
}
