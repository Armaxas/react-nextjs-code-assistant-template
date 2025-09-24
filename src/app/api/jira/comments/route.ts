import { NextRequest, NextResponse } from "next/server";
import {
  fetchJiraIssueComments,
  addJiraIssueComment,
} from "@/services/jira-service";

// GET: Fetch comments for a Jira issue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get("issueKey");

    if (!issueKey) {
      return NextResponse.json(
        { error: "Issue key is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching comments for Jira issue: ${issueKey}`);

    const comments = await fetchJiraIssueComments(issueKey);

    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("[API] Error fetching Jira comments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Jira comments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: Add a comment to a Jira issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueKey, comment } = body;

    if (!issueKey || !comment) {
      return NextResponse.json(
        { error: "Issue key and comment are required" },
        { status: 400 }
      );
    }

    console.log(`[API] Adding comment to Jira issue: ${issueKey}`);

    const newComment = await addJiraIssueComment(issueKey, comment);

    if (!newComment) {
      return NextResponse.json(
        { error: "Failed to add comment to Jira issue" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error("[API] Error adding Jira comment:", error);
    return NextResponse.json(
      {
        error: "Failed to add Jira comment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
