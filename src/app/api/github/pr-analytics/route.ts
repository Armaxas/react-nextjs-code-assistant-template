export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { WatsonxLLM } from "@langchain/community/llms/ibm";
import {
  extractJiraIssueReferences,
  fetchJiraIssues,
  formatJiraIssuesForAI,
} from "@/services/jira-service";

interface PRData {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
  };
  repository?: {
    name: string;
    language?: string;
  };
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized access",
        },
        { status: 401 }
      );
    }

    const { prData, userInfo } = await req.json();

    if (!prData || !Array.isArray(prData)) {
      return Response.json(
        {
          status: "error",
          message: "Invalid PR data provided",
        },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${prData.length} PRs for insights`);

    // Extract JIRA references from all PRs and fetch issue data
    let jiraContext = "";
    try {
      const allJiraReferences: string[] = [];

      prData.forEach((pr: PRData) => {
        const titleRefs = extractJiraIssueReferences(pr.title || "");
        const bodyRefs = extractJiraIssueReferences(pr.body || "");
        // Extract just the issue keys from the references
        allJiraReferences.push(
          ...titleRefs.map((ref) => ref.issueKey),
          ...bodyRefs.map((ref) => ref.issueKey)
        );
      });

      const uniqueJiraRefs = [...new Set(allJiraReferences)];

      if (uniqueJiraRefs.length > 0) {
        console.log(
          `Found ${uniqueJiraRefs.length} unique JIRA references, fetching issue data...`
        );
        const jiraIssues = await fetchJiraIssues(uniqueJiraRefs);

        if (jiraIssues.length > 0) {
          jiraContext = formatJiraIssuesForAI(jiraIssues);
          console.log(
            `Successfully fetched ${jiraIssues.length} JIRA issues for context`
          );
        }
      }
    } catch (jiraError) {
      console.warn("Failed to fetch JIRA context for analytics:", jiraError);
      // Continue without JIRA context
    }

    // Prepare comprehensive PR data summary for AI analysis
    const prSummary = {
      total_prs: prData.length,
      user: userInfo?.githubLogin || "User",
      time_span: {
        earliest_pr:
          prData.length > 0
            ? new Date(
                Math.min(
                  ...prData.map((pr: PRData) =>
                    new Date(pr.created_at).getTime()
                  )
                )
              )
                .toISOString()
                .split("T")[0]
            : null,
        latest_pr:
          prData.length > 0
            ? new Date(
                Math.max(
                  ...prData.map((pr: PRData) =>
                    new Date(pr.created_at).getTime()
                  )
                )
              )
                .toISOString()
                .split("T")[0]
            : null,
      },
      repositories: [
        ...new Set(
          prData.map((pr: PRData) => pr.repository?.name).filter(Boolean)
        ),
      ],
      languages: [
        ...new Set(
          prData.map((pr: PRData) => pr.repository?.language).filter(Boolean)
        ),
      ],
      state_distribution: {
        open: prData.filter((pr: PRData) => pr.state === "open").length,
        merged: prData.filter((pr: PRData) => pr.merged_at).length,
        closed: prData.filter(
          (pr: PRData) => pr.state === "closed" && !pr.merged_at
        ).length,
      },
      size_metrics: {
        avg_files_changed:
          prData.length > 0
            ? Math.round(
                prData.reduce(
                  (sum: number, pr: PRData) => sum + (pr.changed_files || 0),
                  0
                ) / prData.length
              )
            : 0,
        avg_lines_added:
          prData.length > 0
            ? Math.round(
                prData.reduce(
                  (sum: number, pr: PRData) => sum + (pr.additions || 0),
                  0
                ) / prData.length
              )
            : 0,
        avg_lines_deleted:
          prData.length > 0
            ? Math.round(
                prData.reduce(
                  (sum: number, pr: PRData) => sum + (pr.deletions || 0),
                  0
                ) / prData.length
              )
            : 0,
        largest_pr: Math.max(
          ...prData.map((pr: PRData) => pr.changed_files || 0)
        ),
        smallest_pr: Math.min(
          ...prData.map((pr: PRData) => pr.changed_files || 0)
        ),
      },
      timing_metrics: {
        avg_merge_time_days: (() => {
          const mergedPRs = prData.filter(
            (pr: PRData) => pr.merged_at && pr.created_at
          );
          if (mergedPRs.length === 0) return 0;
          const totalTime = mergedPRs.reduce((sum: number, pr: PRData) => {
            const created = new Date(pr.created_at).getTime();
            const merged = new Date(pr.merged_at!).getTime();
            return sum + (merged - created);
          }, 0);
          return Math.round(
            totalTime / mergedPRs.length / (1000 * 60 * 60 * 24)
          );
        })(),
        merge_success_rate:
          prData.length > 0
            ? Math.round(
                (prData.filter((pr: PRData) => pr.merged_at).length /
                  prData.length) *
                  100
              )
            : 0,
      },
      recent_activity: {
        last_30_days: prData.filter((pr: PRData) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(pr.created_at) > thirtyDaysAgo;
        }).length,
        last_7_days: prData.filter((pr: PRData) => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return new Date(pr.created_at) > sevenDaysAgo;
        }).length,
      },
      pr_titles_sample: prData.slice(0, 10).map((pr: PRData) => pr.title),
      description_quality: {
        with_description: prData.filter(
          (pr: PRData) => pr.body && pr.body.length > 50
        ).length,
        total: prData.length,
      },
    };

    // Create detailed prompt for AI analysis
    const promptTemplate = `You are an expert software engineering analyst specializing in GitHub pull request patterns and developer productivity insights. 

Analyze the following pull request data for developer "${prSummary.user}" and provide actionable insights:

**PR SUMMARY DATA:**
- Total PRs: ${prSummary.total_prs}
- Time span: ${prSummary.time_span.earliest_pr} to ${prSummary.time_span.latest_pr}
- Repositories: ${prSummary.repositories.join(", ")}
- Languages: ${prSummary.languages.join(", ")}
- State distribution: ${prSummary.state_distribution.open} open, ${prSummary.state_distribution.merged} merged, ${prSummary.state_distribution.closed} closed
- Average files changed per PR: ${prSummary.size_metrics.avg_files_changed}
- Average lines added per PR: ${prSummary.size_metrics.avg_lines_added}
- Average lines deleted per PR: ${prSummary.size_metrics.avg_lines_deleted}
- Largest PR size: ${prSummary.size_metrics.largest_pr} files
- Average merge time: ${prSummary.timing_metrics.avg_merge_time_days} days
- Merge success rate: ${prSummary.timing_metrics.merge_success_rate}%
- Recent activity: ${prSummary.recent_activity.last_30_days} PRs in last 30 days, ${prSummary.recent_activity.last_7_days} in last 7 days
- Description quality: ${prSummary.description_quality.with_description}/${prSummary.description_quality.total} PRs have detailed descriptions
- Sample PR titles: ${prSummary.pr_titles_sample.slice(0, 5).join("; ")}

${
  jiraContext
    ? `**JIRA CONTEXT:**
${jiraContext}

This JIRA context shows the types of issues being worked on, which can provide insights into the developer's work patterns, project involvement, and the complexity of tasks being handled.

`
    : ""
}**INSTRUCTIONS:**
Provide a comprehensive analysis in the following JSON format. Be specific, actionable, and insightful. Focus on patterns, productivity metrics, and professional development opportunities${jiraContext ? ". Consider the JIRA context to understand work types and project complexity" : ""}:

{
  "pattern_analysis": {
    "content": "A detailed 2-3 sentence analysis of the developer's PR patterns, including size, frequency, and scope insights. Be specific about what the data reveals."
  },
  "strengths": [
    "List 3-5 specific strengths based on the data",
    "Focus on positive patterns and good practices",
    "Be specific and reference the actual metrics"
  ],
  "improvement_areas": [
    "List 3-4 specific areas for improvement",
    "Base recommendations on the actual data",
    "Be constructive and actionable"
  ],
  "recommendations": [
    {
      "title": "Specific Action Title",
      "description": "Detailed recommendation with concrete steps based on the analysis"
    }
  ]
}

**IMPORTANT:** 
- Base ALL insights on the actual data provided
- Be specific with numbers and patterns
- Provide actionable, practical advice
- Consider both technical and professional development aspects
- Return ONLY the JSON object, no additional text or formatting
`;

    try {
      // Initialize WatsonX LLM
      const model = new WatsonxLLM({
        model: "ibm/granite-3-2-8b-instruct",
        watsonxAIAuthType: "iam",
        watsonxAIApikey: process.env.WATSONX_API_KEY || "",
        serviceUrl: "https://us-south.ml.cloud.ibm.com",
        projectId: process.env.WATSONX_PROJECT_ID || "",
        version: "2023-05-29",
        maxNewTokens: 8000,
        minNewTokens: 200,
        temperature: 0.7,
        topP: 0.9,
      });

      console.log("Sending request to WatsonX for PR analytics...");
      const aiResponse = await model.invoke(promptTemplate);
      console.log("Received AI response:", aiResponse);

      if (!aiResponse || aiResponse.trim() === "") {
        throw new Error("Empty response from AI model");
      }

      // Parse the AI response as JSON
      let parsedInsights;
      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        parsedInsights = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.log("Raw AI response:", aiResponse);
        throw new Error("Invalid JSON response from AI model");
      }

      // Validate and format the response
      const insights = {
        pattern_analysis: {
          title: "Pattern Analysis",
          content:
            parsedInsights.pattern_analysis?.content ||
            "Analysis of your PR patterns shows interesting development trends.",
          color: "bg-blue-900/20 border-blue-700/50",
          textColor: "text-blue-300",
          type: "text" as const,
        },
        strengths: {
          title: "Strengths",
          content: Array.isArray(parsedInsights.strengths)
            ? parsedInsights.strengths
            : ["Building good development practices"],
          color: "bg-green-900/20 border-green-700/50",
          textColor: "text-green-300",
          type: "list" as const,
        },
        improvement_areas: {
          title: "Improvement Areas",
          content: Array.isArray(parsedInsights.improvement_areas)
            ? parsedInsights.improvement_areas
            : ["Continue current practices and explore new opportunities"],
          color: "bg-orange-900/20 border-orange-700/50",
          textColor: "text-orange-300",
          type: "list" as const,
        },
        recommendations: Array.isArray(parsedInsights.recommendations)
          ? parsedInsights.recommendations.slice(0, 4)
          : [
              {
                title: "Maintain Excellence",
                description:
                  "Continue with current development practices and explore new opportunities for growth.",
              },
            ],
      };

      return Response.json({
        status: "success",
        insights,
      });
    } catch (aiError) {
      console.error("WatsonX API request failed:", aiError);

      // Check if it's a service unavailability error (503)
      const errorMessage =
        aiError instanceof Error ? aiError.message : "Unknown error";
      const isServiceUnavailable =
        errorMessage.includes("503") ||
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("unavailable");

      // Provide enhanced fallback insights when WatsonX is unavailable
      if (isServiceUnavailable) {
        console.log(
          "WatsonX service unavailable - providing enhanced fallback insights"
        );

        // Generate fallback insights based on actual data
        const avgPRSize = prSummary.size_metrics.avg_files_changed;
        const mergeRate = prSummary.timing_metrics.merge_success_rate;
        const recentActivity = prSummary.recent_activity.last_30_days;
        const totalPRs = prSummary.total_prs;

        const fallbackInsights = {
          pattern_analysis: {
            title: "Pattern Analysis",
            content: `Analysis of ${totalPRs} PRs shows an average of ${avgPRSize} files changed per PR with a ${mergeRate}% merge success rate. You've had ${recentActivity} PRs in the last 30 days. AI-powered insights temporarily unavailable due to service maintenance.`,
            color: "bg-blue-900/20 border-blue-700/50",
            textColor: "text-blue-300",
            type: "text" as const,
          },
          strengths: {
            title: "Strengths (Data-Based)",
            content: [
              mergeRate >= 80
                ? "High PR success rate"
                : "Active contribution pattern",
              avgPRSize <= 8
                ? "Well-sized PR changes"
                : "Comprehensive code contributions",
              recentActivity > 0
                ? "Consistent recent activity"
                : "Established development history",
              "Building good development practices",
            ].slice(0, 3),
            color: "bg-green-900/20 border-green-700/50",
            textColor: "text-green-300",
            type: "list" as const,
          },
          improvement_areas: {
            title: "Areas to Consider",
            content: [
              avgPRSize > 10
                ? "Consider smaller, focused PRs"
                : "Maintain current PR sizing",
              mergeRate < 70
                ? "Focus on PR quality and testing"
                : "Continue current practices",
              "Explore advanced development techniques",
            ].slice(0, 2),
            color: "bg-orange-900/20 border-orange-700/50",
            textColor: "text-orange-300",
            type: "list" as const,
          },
          recommendations: [
            {
              title: "Service Notice",
              description:
                "AI analysis service is temporarily unavailable. Basic insights are shown based on your PR data. Please try again later for detailed AI-powered recommendations.",
            },
            avgPRSize > 10
              ? {
                  title: "Optimize PR Size",
                  description:
                    "Consider breaking larger changes into smaller, focused PRs for better review efficiency.",
                }
              : {
                  title: "Maintain Current Approach",
                  description:
                    "Your PR sizing looks good. Continue with current development practices.",
                },
          ],
        };

        return Response.json({
          status: "success",
          insights: fallbackInsights,
          serviceNotice:
            "AI analysis temporarily unavailable - showing data-based insights",
        });
      }

      // For other errors, return error response
      return Response.json(
        {
          status: "error",
          message: "AI analysis service failed",
          details: errorMessage,
          serviceUnavailable: isServiceUnavailable,
        },
        { status: isServiceUnavailable ? 503 : 500 }
      );
    }
  } catch (error) {
    console.error("PR analytics error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
