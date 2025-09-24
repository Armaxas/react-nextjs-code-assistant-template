import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateJiraIssueInFeedback } from "@/actions/queries";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, status, assignee, priority, labels } = body;

    if (!feedbackId || !status) {
      return NextResponse.json(
        { error: "feedbackId and status are required" },
        { status: 400 }
      );
    }

    // Build the update object
    const updateData: Record<string, unknown> = {
      status,
    };

    if (assignee !== undefined) {
      updateData.assignee = assignee;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (labels !== undefined) {
      updateData.labels = labels;
    }

    const result = await updateJiraIssueInFeedback(feedbackId, updateData);

    if (!result) {
      return NextResponse.json(
        { error: "Feedback not found or not owned by user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updated: result });
  } catch (error) {
    console.error("Error updating Jira status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
