import { NextResponse } from "next/server";
import { getDashboardFeedbackMetrics } from "@/lib/mongodb-actions";

export async function GET() {
  try {
    const metricsData = await getDashboardFeedbackMetrics();

    return NextResponse.json({
      success: true,
      data: metricsData,
    });
  } catch (error) {
    console.error("Error fetching metrics data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics data",
        data: {
          ratingDistribution: [],
          ratingTrends: [],
          categoryBreakdown: [],
          timeBasedMetrics: {
            lastHour: { count: 0, avgRating: 0 },
            last24Hours: { count: 0, avgRating: 0 },
            lastWeek: { count: 0, avgRating: 0 },
            lastMonth: { count: 0, avgRating: 0 },
          },
        },
      },
      { status: 500 }
    );
  }
}
