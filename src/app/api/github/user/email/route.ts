import { fetchUserEmail } from "@/actions/github-actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { login } = await req.json();

    if (!login) {
      return NextResponse.json(
        { error: "GitHub login is required" },
        { status: 400 }
      );
    }

    const email = await fetchUserEmail(login);

    if (email) {
      return NextResponse.json({ email });
    } else {
      return NextResponse.json(
        { error: "Email not found or user has no public email" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in user email route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
