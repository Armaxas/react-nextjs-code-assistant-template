import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserFeedbackHistory, getUser } from "@/actions/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database to obtain the user ID
    const user = await getUser(session.user.email);

    if (!user || !user._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const filter = searchParams.get("filter") || "all";
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build filter conditions
    const filterConditions: Record<string, unknown> = {};

    // Apply type filter
    if (filter === "upvote") {
      filterConditions.isUpvoted = true;
    } else if (filter === "downvote") {
      filterConditions.isUpvoted = false;
    } else if (filter === "jira") {
      filterConditions.hasJiraIssue = true;
    } else if (filter === "no-jira") {
      filterConditions.hasJiraIssue = { $ne: true };
    }

    // Apply category filter
    if (category !== "all") {
      filterConditions.category = category;
    }

    // Apply search filter
    if (search) {
      filterConditions.comments = { $regex: search, $options: "i" };
    }

    // Build sort options
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const result = await getUserFeedbackHistory(
      user._id.toString(),
      page,
      pageSize,
      filterConditions,
      sortOptions
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching feedback history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
