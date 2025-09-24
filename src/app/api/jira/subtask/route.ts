export const dynamic = "force-dynamic";

import { auth as authenticate } from "@/auth";
import { NextRequest } from "next/server";
import {
  fetchJiraIssueByKey,
  createJiraSubtask,
  updateJiraSubtask,
  findExistingSubtasks,
} from "@/services/jira-service";

interface CreateSubtaskRequest {
  parentTaskKey: string;
  summary: string;
  description: string;
  priority: string;
  labels: string[];
  usabilityPercentage: number;
  reporterEmail?: string;
  reporterName?: string;
  chatId: string;
  messageId: string;
  attachments?: string[]; // Base64 encoded files with metadata
  additionalDetails?: string; // Additional feedback details
}

interface UpdateSubtaskRequest {
  subtaskKey: string;
  additionalFeedback: string;
  usabilityPercentage?: number;
}

// GET - Search for existing subtasks
export async function GET(req: NextRequest) {
  try {
    const session = await authenticate();
    if (!session?.user?.id) {
      return Response.json(
        { status: "error", message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parentTaskKey = searchParams.get("parentTaskKey");
    const chatId = searchParams.get("chatId");
    const messageId = searchParams.get("messageId");

    if (parentTaskKey) {
      // Validate and fetch parent task details
      const parentTask = await fetchJiraIssueByKey(parentTaskKey);
      if (!parentTask) {
        return Response.json(
          { status: "error", message: "Parent task not found" },
          { status: 404 }
        );
      }

      return Response.json({
        status: "success",
        data: {
          parentTask: {
            key: parentTask.key,
            summary: parentTask.summary,
            description: parentTask.description,
            status: parentTask.status.name,
            issuetype: parentTask.issuetype.name,
          },
        },
      });
    }

    if (chatId && messageId) {
      // Search for existing subtasks
      const existingSubtasks = await findExistingSubtasks(chatId, messageId);
      return Response.json({
        status: "success",
        data: { existingSubtasks },
      });
    }

    return Response.json(
      { status: "error", message: "Missing required parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[JIRA Subtask] Error in GET:", error);
    return Response.json(
      {
        status: "error",
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new subtask
export async function POST(req: NextRequest) {
  try {
    const session = await authenticate();
    if (!session?.user?.id) {
      return Response.json(
        { status: "error", message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const requestData: CreateSubtaskRequest = await req.json();

    // Validate required fields
    if (
      !requestData.parentTaskKey ||
      !requestData.summary ||
      !requestData.description ||
      !requestData.usabilityPercentage ||
      !requestData.chatId ||
      !requestData.messageId
    ) {
      return Response.json(
        {
          status: "error",
          message:
            "Missing required fields: parentTaskKey, summary, description, usabilityPercentage, chatId, messageId",
        },
        { status: 400 }
      );
    }

    // Validate parent task exists
    const parentTask = await fetchJiraIssueByKey(requestData.parentTaskKey);
    if (!parentTask) {
      return Response.json(
        {
          status: "error",
          message: "Parent task not found or inaccessible",
        },
        { status: 404 }
      );
    }

    // Add context to description
    let enhancedDescription = `${requestData.description}

--- Context ---
Chat ID: ${requestData.chatId}
Message ID: ${requestData.messageId}
Parent Task: ${requestData.parentTaskKey}`;

    // Add additional details if provided
    if (requestData.additionalDetails) {
      enhancedDescription += `

--- Additional Details ---
${requestData.additionalDetails}`;
    }

    console.log("[JIRA Subtask] Attempting to create subtask with payload:", {
      parentTaskKey: requestData.parentTaskKey,
      summary: requestData.summary,
      descriptionLength: enhancedDescription.length,
      priority: requestData.priority,
      labels: requestData.labels,
      usabilityPercentage: requestData.usabilityPercentage,
      hasAttachments:
        requestData.attachments && requestData.attachments.length > 0,
      attachmentCount: requestData.attachments?.length || 0,
    });

    // Create subtask with attachment support
    const result = await createJiraSubtask(requestData.parentTaskKey, {
      summary: requestData.summary,
      description: enhancedDescription,
      priority: requestData.priority,
      labels: requestData.labels,
      usabilityPercentage: requestData.usabilityPercentage,
      reporterEmail: requestData.reporterEmail,
      reporterName: requestData.reporterName,
      attachments: requestData.attachments, // Pass attachments in the subtask data
    });

    console.log("[JIRA Subtask] Create subtask result:", result);

    if (!result) {
      console.error(
        "[JIRA Subtask] createJiraSubtask returned null - likely JIRA configuration or API error"
      );
      return Response.json(
        {
          status: "error",
          message:
            "Failed to create subtask - JIRA service returned null. Check JIRA configuration and credentials.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      status: "success",
      data: {
        subtaskKey: result.issueKey,
        subtaskUrl: result.issueUrl,
        attachments: result.attachments || [],
        parentTask: {
          key: parentTask.key,
          summary: parentTask.summary,
        },
      },
    });
  } catch (error) {
    console.error("[JIRA Subtask] Error creating subtask:", error);
    return Response.json(
      {
        status: "error",
        message: "Internal server error while creating subtask",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update existing subtask
export async function PATCH(req: NextRequest) {
  try {
    const session = await authenticate();
    if (!session?.user?.id) {
      return Response.json(
        { status: "error", message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const requestData: UpdateSubtaskRequest = await req.json();

    if (!requestData.subtaskKey || !requestData.additionalFeedback) {
      return Response.json(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Update subtask with additional feedback
    const success = await updateJiraSubtask(
      requestData.subtaskKey,
      requestData.additionalFeedback,
      requestData.usabilityPercentage
    );

    if (!success) {
      return Response.json(
        {
          status: "error",
          message: "Failed to update subtask",
        },
        { status: 500 }
      );
    }

    return Response.json({
      status: "success",
      message: "Subtask updated successfully",
    });
  } catch (error) {
    console.error("[JIRA Subtask] Error updating subtask:", error);
    return Response.json(
      {
        status: "error",
        message: "Internal server error while updating subtask",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
