import { NextResponse } from "next/server";
import { getMessagesCount } from "@/lib/mongodb-actions";

export async function GET() {
  try {
    const result = await getMessagesCount();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in messages-count API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch messages count",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        totalMessages: 0,
        success: false,
      },
      { status: 500 }
    );
  }
}
