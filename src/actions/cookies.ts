"use server";

import { cookies } from "next/headers";

export async function getCookie(key: string) {
  const cookieStore = await cookies();
  return cookieStore.get(key);
}

export async function setCookie(key: string) {
  const cookieStore = await cookies();
  cookieStore.set("theme", key);
}

export async function deleteCookie(key: string) {
  const cookieStore = await cookies();
  cookieStore.delete(key);
}
