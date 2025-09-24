import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth"; // TODO: Re-enable authentication later
import {
  getUserAnalytics,
  getUserGrowthData,
  getUserActivityData,
  exportUserData,
  getMostActiveUsers,
} from "@/actions/user-analytics-actions";

export async function GET(request: NextRequest) {
  try {
    console.log("API endpoint called");

    // TODO: Add authentication back later
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const format = searchParams.get("format");

    console.log("User Analytics API called with action:", action);

    switch (action) {
      case "analytics":
        console.log("Fetching user analytics...");
        const analytics = await getUserAnalytics();
        console.log("Analytics result:", analytics.length, "users found");
        return NextResponse.json({ data: analytics });

      case "growth":
        console.log("Fetching user growth data...");
        const growthData = await getUserGrowthData();
        console.log("Growth data result:", growthData.length, "data points");
        return NextResponse.json({ data: growthData });

      case "activity":
        console.log("Fetching user activity data...");
        const activityData = await getUserActivityData();
        console.log(
          "Activity data result:",
          activityData.length,
          "data points"
        );
        return NextResponse.json({ data: activityData });

      case "export":
        if (format === "csv") {
          const csvData = await exportUserData();
          return new NextResponse(csvData, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="user-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
            },
          });
        }
        return NextResponse.json(
          { error: "Invalid export format" },
          { status: 400 }
        );

      case "top-users":
        const limit = parseInt(searchParams.get("limit") || "10");
        const topUsers = await getMostActiveUsers(limit);
        return NextResponse.json({ data: topUsers });

      default:
        // Default to returning basic analytics
        console.log("Fetching default analytics...");
        const defaultAnalytics = await getUserAnalytics();
        console.log(
          "Default analytics result:",
          defaultAnalytics.length,
          "users found"
        );
        return NextResponse.json({ data: defaultAnalytics });
    }
  } catch (error) {
    console.error("Error in user analytics API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for potential future updates (like user actions)
export async function POST() {
  try {
    // TODO: Add authentication back later
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // For future user management actions
    return NextResponse.json(
      { message: "Not implemented yet" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in user analytics POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
