import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth"; // TODO: Re-enable authentication later
import {
  createApplicationFeedback,
  getApplicationFeedbacks,
  voteOnApplicationFeedback,
  getApplicationFeedbackStats,
  updateApplicationFeedbackStatus,
} from "@/actions/application-feedback-actions";

// GET - Fetch application feedbacks with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    console.log("Application feedback API endpoint called");

    // TODO: Add authentication back later
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const feedbackType = searchParams.get("feedbackType") as
      | "bug_report"
      | "feature_request"
      | "improvement_suggestion"
      | "general_feedback"
      | "usability_issue"
      | null;
    const status = searchParams.get("status") as
      | "open"
      | "in_review"
      | "in_progress"
      | "resolved"
      | "closed"
      | null;
    const priority = searchParams.get("priority") as
      | "low"
      | "medium"
      | "high"
      | "critical"
      | null;
    const userId = searchParams.get("userId");
    const sortBy = searchParams.get("sortBy") as
      | "createdAt"
      | "updatedAt"
      | "priority"
      | "upvotes"
      | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc";
    const getStats = searchParams.get("stats") === "true";
    const exportFormat = searchParams.get("export");

    // Handle export request
    if (exportFormat === "csv") {
      try {
        // Get all feedbacks for export
        const result = await getApplicationFeedbacks({
          page: 1,
          limit: 1000, // Get a large number for export
          feedbackType: feedbackType || undefined,
          status: status || undefined,
          priority: priority || undefined,
          userId: userId || undefined,
          sortBy: sortBy || "createdAt",
          sortOrder: sortOrder || "desc",
        });

        // Generate CSV data
        const csvHeaders = [
          "ID",
          "User ID",
          "Type",
          "Title",
          "Description",
          "Category",
          "Priority",
          "Status",
          "Tags",
          "Upvotes",
          "Created At",
          "Updated At",
        ].join(",");

        const csvRows = result.feedbacks.map((feedback) =>
          [
            feedback._id,
            `"${feedback.userId || ""}"`,
            `"${feedback.feedbackType || ""}"`,
            `"${(feedback.title || "").replace(/"/g, '""')}"`,
            `"${(feedback.description || "").replace(/"/g, '""')}"`,
            `"${feedback.category || ""}"`,
            `"${feedback.priority || ""}"`,
            `"${feedback.status || ""}"`,
            `"${(feedback.tags || []).join("; ")}"`,
            feedback.upvotes || 0,
            feedback.createdAt
              ? new Date(feedback.createdAt).toISOString()
              : "",
            feedback.updatedAt
              ? new Date(feedback.updatedAt).toISOString()
              : "",
          ].join(",")
        );

        const csvData = [csvHeaders, ...csvRows].join("\n");

        return new NextResponse(csvData, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="application-feedback-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } catch (error) {
        console.error("Error exporting application feedback data:", error);
        return NextResponse.json(
          { error: "Failed to export data" },
          { status: 500 }
        );
      }
    }

    if (getStats) {
      const stats = await getApplicationFeedbackStats();
      return NextResponse.json({ stats });
    }

    const result = await getApplicationFeedbacks({
      page,
      limit,
      feedbackType: feedbackType || undefined,
      status: status || undefined,
      priority: priority || undefined,
      userId: userId || undefined,
      sortBy: sortBy || undefined,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/application-feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new application feedback
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication back later
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const {
      feedbackType,
      title,
      description,
      category,
      priority,
      tags,
      browserInfo,
      contactInfo,
      rating,
    } = body;

    // Validate required fields
    if (!feedbackType || !title || !description || !priority) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = [
      "bug_report",
      "feature_request",
      "improvement_suggestion",
      "general_feedback",
      "usability_issue",
    ];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "critical"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const result = await createApplicationFeedback({
      userId: "anonymous", // TODO: Use session.user.id when authentication is re-enabled
      feedbackType,
      title,
      description,
      category,
      priority,
      tags,
      browserInfo,
      contactInfo,
      rating,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Feedback created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/application-feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Vote on application feedback or update status
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication back later
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { feedbackId, vote, status, adminNotes } = body;

    // Handle status update
    if (status) {
      if (!feedbackId) {
        return NextResponse.json(
          { error: "Missing feedbackId" },
          { status: 400 }
        );
      }

      if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Must be 'open', 'in_progress', 'resolved', or 'closed'",
          },
          { status: 400 }
        );
      }

      const result = await updateApplicationFeedbackStatus(
        feedbackId,
        status,
        adminNotes
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to update status" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Status updated successfully",
      });
    }

    // Handle voting
    if (vote) {
      if (!feedbackId || !vote) {
        return NextResponse.json(
          { error: "Missing feedbackId or vote" },
          { status: 400 }
        );
      }

      if (!["up", "down"].includes(vote)) {
        return NextResponse.json(
          { error: "Invalid vote. Must be 'up' or 'down'" },
          { status: 400 }
        );
      }

      const result = await voteOnApplicationFeedback(
        feedbackId,
        "anonymous", // TODO: Use session.user.id when authentication is re-enabled
        vote
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to vote" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Vote recorded successfully",
      });
    }

    return NextResponse.json(
      { error: "Missing required parameters (vote or status)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PUT /api/application-feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
