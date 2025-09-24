import { auth } from "@/auth";
import { fetchOrganizationMembers } from "@/actions/github-actions";

export async function GET() {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const orgName = process.env.GITHUB_ISC_ORG || "IBMSC";
    const members = await fetchOrganizationMembers(orgName);

    return Response.json(members);
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return Response.json(
      { error: "Failed to fetch organization members" },
      { status: 500 }
    );
  }
}
