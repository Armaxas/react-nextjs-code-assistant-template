import { auth } from "../auth";
import LandingPage from "@/components/landing-page";

export default async function Home() {
  const session = await auth();
  return <LandingPage session={session}></LandingPage>;
}
