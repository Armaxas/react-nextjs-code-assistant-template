import { NextResponse } from "next/server";
import { getModelsForAPI } from "@/lib/models-config";

export async function GET() {
  try {
    const config = await getModelsForAPI();

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error fetching models configuration:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch models configuration",
      },
      { status: 500 }
    );
  }
}
