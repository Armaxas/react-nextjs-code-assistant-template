import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This is a simple endpoint to verify the feedback system is working
    return NextResponse.json({
      message: "Feedback system API is working",
      user: session.user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in feedback API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
