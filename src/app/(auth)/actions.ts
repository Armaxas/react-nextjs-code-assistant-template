"use server";

import { signIn, signOut } from "../../auth";

export const signInW3id = async () => {
  await signIn("github");
  // await signIn("ibmw3id", { redirectTo: "/auth/github?authstep=ibmw3id" });
};

export const signOutFormAction = async () => {
  await signOut();
};

export const signInGitHub = async () => {
  await signIn("github", { redirectTo: "/chat" });
};
