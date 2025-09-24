import { type JiraIssue } from "./jira-service";

// Helper function to extract insights about related JIRA issues
export async function generateJiraIssuesSummary(
  issues: JiraIssue[],
  selectedModel?: string
): Promise<string> {
  if (!issues || issues.length === 0) {
    return "No JIRA issues found.";
  }

  try {
    // Generate a summary using the dedicated JIRA summarization API
    const response = await fetch("/api/jira/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issues: issues,
        type: "multiple",
        analysisType: "summary",
        selectedModel: selectedModel, // Pass selected model to API
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        "JIRA summarization API error:",
        response.status,
        errorData
      );
      throw new Error(
        `JIRA summarization API error: ${response.status}. ${errorData || response.statusText}`
      );
    }

    const result = await response.json();

    if (result.status === "success" && result.summary) {
      return result.summary;
    } else {
      throw new Error(result.message || "Failed to generate summary");
    }
  } catch (error) {
    console.error("Error generating JIRA issues summary:", error);
    return error instanceof Error
      ? `Error: ${error.message}`
      : "Failed to generate summary. Please try again.";
  }
}

// Function to generate a summary for a single JIRA issue with more details
export async function generateSingleJiraIssueSummary(
  issue: JiraIssue,
  selectedModel?: string
): Promise<string> {
  if (!issue) {
    return "No JIRA issue provided.";
  }

  try {
    // Generate a summary using the dedicated JIRA summarization API
    const response = await fetch("/api/jira/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issues: [issue],
        type: "single",
        analysisType: "detailed",
        selectedModel: selectedModel, // Pass selected model to API
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        "JIRA summarization API error:",
        response.status,
        errorData
      );
      throw new Error(
        `JIRA summarization API error: ${response.status}. ${errorData || response.statusText}`
      );
    }

    const result = await response.json();

    if (result.status === "success" && result.summary) {
      return result.summary;
    } else {
      throw new Error(result.message || "Failed to generate analysis");
    }
  } catch (error) {
    console.error("Error generating JIRA issue analysis:", error);
    return error instanceof Error
      ? `Error: ${error.message}`
      : "Failed to generate analysis. Please try again.";
  }
}
