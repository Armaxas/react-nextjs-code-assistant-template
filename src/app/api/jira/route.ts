export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import {
  fetchJiraIssue,
  fetchJiraIssues,
  extractJiraIssueReferences,
} from "@/services/jira-service";

interface JiraFetchRequest {
  issueKeys?: string[];
  issueKey?: string;
  extractFrom?: {
    title?: string;
    description?: string;
    branchName?: string;
  };
}

export async function POST(req: Request) {
  try {
    // Attempt authentication but continue even if it fails
    try {
      // const session = await auth(); // Unused variable commented out
      // const isAuthenticated = !!session?.user?.id; // Unused variable commented out
    } catch (authError) {
      console.warn("[JIRA API] Auth error but continuing:", authError);
      // Continue without authentication for testing
    }

    // Skip authentication check for now to diagnose JIRA API issues
    // if (!isAuthenticated) {
    //   return Response.json(
    //     {
    //       status: "error",
    //       message: "Unauthorized access",
    //     },
    //     { status: 401 }
    //   );
    // }

    const requestData: JiraFetchRequest = await req.json();

    // Handle single issue fetch
    if (requestData.issueKey) {
      const issue = await fetchJiraIssue(requestData.issueKey);
      return Response.json({
        status: "success",
        issue,
        found: !!issue,
      });
    }

    // Handle multiple issues fetch
    if (requestData.issueKeys && requestData.issueKeys.length > 0) {
      const issues = await fetchJiraIssues(requestData.issueKeys);
      return Response.json({
        status: "success",
        issues,
        found: issues.length,
        total: requestData.issueKeys.length,
      });
    }

    // Handle extraction and fetch
    if (requestData.extractFrom) {
      const { title, description, branchName } = requestData.extractFrom;

      // Extract JIRA issue references
      const references = extractJiraIssueReferences(
        title || "",
        description,
        branchName
      );

      if (references.length === 0) {
        return Response.json({
          status: "success",
          references: [],
          issues: [],
          found: 0,
        });
      }

      // Fetch the actual issues
      const uniqueKeys = [...new Set(references.map((ref) => ref.issueKey))];
      console.log(`[JIRA API] Fetching issues for keys:`, uniqueKeys);
      const issues = await fetchJiraIssues(uniqueKeys);
      console.log(
        `[JIRA API] Fetched ${issues.length} issues out of ${uniqueKeys.length} requested`
      );

      // Log each issue for debugging
      issues.forEach((issue) => {
        console.log(`[JIRA API] Fetched issue ${issue.key}: ${issue.summary}`);
      });

      return Response.json({
        status: "success",
        references,
        issues,
        found: issues.length,
        total: uniqueKeys.length,
      });
    }

    return Response.json(
      {
        status: "error",
        message:
          "Invalid request. Provide issueKey, issueKeys, or extractFrom parameters.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("JIRA API error:", error);
    return Response.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const issueKey = url.searchParams.get("issueKey");

    if (!issueKey) {
      return Response.json(
        {
          status: "error",
          message: "issueKey parameter is required",
        },
        { status: 400 }
      );
    }

    const issue = await fetchJiraIssue(issueKey);

    return Response.json({
      status: "success",
      issue,
      found: !!issue,
    });
  } catch (error) {
    console.error("JIRA API error:", error);
    return Response.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
