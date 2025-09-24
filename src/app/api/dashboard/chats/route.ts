import { NextResponse } from "next/server";
import { getDashboardChatData } from "@/lib/mongodb-actions";

export async function GET() {
  try {
    const chatData = await getDashboardChatData();

    return NextResponse.json({
      success: true,
      data: chatData,
    });
  } catch (error) {
    console.error("Error fetching chat data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat data",
        data: [],
      },
      { status: 500 }
    );
  }
}
