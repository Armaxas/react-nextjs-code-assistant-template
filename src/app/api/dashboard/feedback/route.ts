import { NextResponse } from "next/server";
import { getDashboardFeedbackData } from "@/lib/mongodb-actions";

export async function GET() {
  try {
    const feedbackData = await getDashboardFeedbackData();

    return NextResponse.json({
      success: true,
      data: feedbackData,
    });
  } catch (error) {
    console.error("Error fetching feedback data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch feedback data",
        data: [],
      },
      { status: 500 }
    );
  }
}
