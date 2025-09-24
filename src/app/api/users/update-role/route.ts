import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/lib/mongodb-actions";

export async function PUT(request: NextRequest) {
  try {
    const { userId, newRole } = await request.json();

    const result = await updateUserRole(userId, newRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "User not found" ? 404 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
