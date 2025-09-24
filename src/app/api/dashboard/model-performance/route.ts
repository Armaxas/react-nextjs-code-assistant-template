import { NextResponse } from "next/server";
import { getModelPerformanceMetrics } from "@/lib/mongodb-actions";

export async function GET() {
  try {
    const modelMetrics = await getModelPerformanceMetrics();
    
    return NextResponse.json({
      success: true,
      data: modelMetrics,
    });
  } catch (error) {
    console.error("Error in model performance API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch model performance metrics",
      },
      { status: 500 }
    );
  }
}
