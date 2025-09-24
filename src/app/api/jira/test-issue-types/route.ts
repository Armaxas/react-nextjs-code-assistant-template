import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This is a placeholder API route for testing Jira issue types
    return NextResponse.json({
      message: "Jira test issue types endpoint",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in jira test-issue-types route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
