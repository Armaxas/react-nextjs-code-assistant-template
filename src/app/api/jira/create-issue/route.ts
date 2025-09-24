export const dynamic = "force-dynamic";

import { auth as authenticate } from "@/auth";
import { NextRequest } from "next/server";

interface JiraCreateIssueRequest {
  summary: string;
  description: string;
  projectKey: string;
  issueType?: string;
  priority?: string;
  labels?: string[];
  reporterEmail?: string;
  reporterName?: string;
  attachments?: string[]; // Base64 encoded files with metadata
}

interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await authenticate();
    if (!session?.user?.id) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    // Get JIRA configuration
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!baseUrl || !email || !apiToken) {
      console.error("JIRA configuration is incomplete");
      return Response.json(
        {
          status: "error",
          message: "JIRA integration not configured",
        },
        { status: 500 }
      );
    }

    const requestData: JiraCreateIssueRequest = await req.json();

    // Validate required fields
    if (
      !requestData.summary ||
      !requestData.description ||
      !requestData.projectKey
    ) {
      return Response.json(
        {
          status: "error",
          message:
            "Missing required fields: summary, description, or projectKey",
        },
        { status: 400 }
      );
    }

    // Prepare JIRA issue payload
    const issuePayload = {
      fields: {
        project: {
          key: requestData.projectKey,
        },
        summary: requestData.summary,
        description: `${requestData.description}\n\n--- Reported by ---\nUser: ${requestData.reporterName || "Unknown"}\nEmail: ${requestData.reporterEmail || "Unknown"}`,
        issuetype: {
          name: requestData.issueType || "Task", // Default to Task for downvote issues
        },
        priority: requestData.priority
          ? {
              name: requestData.priority,
            }
          : undefined,
        labels: requestData.labels || [],
      },
    };

    // Remove undefined fields
    Object.keys(issuePayload.fields).forEach((key) => {
      if (
        issuePayload.fields[key as keyof typeof issuePayload.fields] ===
        undefined
      ) {
        delete issuePayload.fields[key as keyof typeof issuePayload.fields];
      }
    });

    // Create JIRA issue
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    const createUrl = `${baseUrl}/rest/api/2/issue`;

    console.log(
      `[JIRA Create] Creating issue in project ${requestData.projectKey}`
    );

    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      body: JSON.stringify(issuePayload),
    });

    if (!response.ok) {
      let errorDetails = "";
      try {
        const errorText = await response.text();
        errorDetails = errorText;
        console.error(`[JIRA Create] Error response:`, errorDetails);
      } catch {
        errorDetails = "Could not read error response";
      }

      return Response.json(
        {
          status: "error",
          message: `Failed to create JIRA issue: ${response.status} ${response.statusText}`,
          details: errorDetails,
        },
        { status: response.status }
      );
    }

    const createdIssue: JiraCreateIssueResponse = await response.json();

    console.log(
      `[JIRA Create] Successfully created issue: ${createdIssue.key}`
    );

    // Upload attachments if any
    const attachmentResults: string[] = [];
    if (requestData.attachments && requestData.attachments.length > 0) {
      console.log(
        `[JIRA Create] Uploading ${requestData.attachments.length} attachments`
      );

      for (const attachmentData of requestData.attachments) {
        try {
          const attachment = JSON.parse(attachmentData);
          const { fileName, content, mimeType } = attachment;

          // Convert base64 back to binary
          const binaryData = Buffer.from(content, "base64");

          // Create form data for attachment
          const formData = new FormData();
          const blob = new Blob([binaryData], { type: mimeType });
          formData.append("file", blob, fileName);

          const attachUrl = `${baseUrl}/rest/api/2/issue/${createdIssue.key}/attachments`;

          const attachResponse = await fetch(attachUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "X-Atlassian-Token": "no-check",
              "User-Agent": "ISC-Code-Connect-UI/1.0",
            },
            body: formData,
          });

          if (attachResponse.ok) {
            const attachResult = await attachResponse.json();
            attachmentResults.push(attachResult[0]?.filename || fileName);
            console.log(
              `[JIRA Create] Successfully uploaded attachment: ${fileName}`
            );
          } else {
            console.error(
              `[JIRA Create] Failed to upload attachment ${fileName}: ${attachResponse.status}`
            );
            attachmentResults.push(`Failed: ${fileName}`);
          }
        } catch (error) {
          console.error(`[JIRA Create] Error processing attachment:`, error);
        }
      }
    }

    return Response.json({
      status: "success",
      data: {
        issueKey: createdIssue.key,
        issueId: createdIssue.id,
        issueUrl: `${baseUrl}/browse/${createdIssue.key}`,
        attachments: attachmentResults,
      },
    });
  } catch (error) {
    console.error("[JIRA Create] Error creating JIRA issue:", error);
    return Response.json(
      {
        status: "error",
        message: "Internal server error while creating JIRA issue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
