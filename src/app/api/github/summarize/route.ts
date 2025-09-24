export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { WatsonxLLM } from "@langchain/community/llms/ibm";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  extractJiraIssueReferences,
  fetchJiraIssues,
  formatJiraIssuesForAI,
} from "@/services/jira-service";
import { getServerDefaultModel } from "@/lib/models-config";

export async function POST(req: Request) {
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

    const requestData = await req.json();
    let { content, type } = requestData;
    const { title, description, branchName, selectedModel } = requestData;

    // Handle both parameter formats (client-side and server-side)
    if (!content && requestData.data) {
      // Server-side format with { type, data, repoName }
      content = JSON.stringify(requestData.data);
      type =
        type ||
        (requestData.type === "pullrequest"
          ? "pull_request"
          : requestData.type);
    }

    if (!content) {
      return Response.json(
        {
          status: "error",
          message: "Content is required for summarization",
        },
        { status: 400 }
      );
    }

    // Use selected model or fall back to default
    const modelToUse = selectedModel || getServerDefaultModel();

    // Extract and fetch JIRA issues if this is a PR or commit
    let jiraContext = "";
    if (
      (type === "pull_request" || type === "commit") &&
      (title || description || branchName)
    ) {
      try {
        const references = extractJiraIssueReferences(
          title,
          description,
          branchName
        );
        if (references.length > 0) {
          const uniqueKeys = [
            ...new Set(references.map((ref) => ref.issueKey)),
          ];
          const jiraIssues = await fetchJiraIssues(uniqueKeys);
          if (jiraIssues.length > 0) {
            jiraContext = formatJiraIssuesForAI(jiraIssues);
            console.log(
              `Found ${jiraIssues.length} JIRA issues for ${type} analysis`
            );
          }
        }
      } catch (error) {
        console.warn("Failed to fetch JIRA context for summary:", error);
        // Continue without JIRA context
      }
    }

    // WatsonX API credentials
    // const apiKey = process.env.WATSONX_API_KEY;
    // const apiUrl = process.env.WATSONX_API_URL;
    // const projectId = process.env.WATSONX_PROJECT_ID;

    // if (!apiKey || !apiUrl) {
    //   console.error("Missing WatsonX API configuration");
    //   return Response.json(
    //     {
    //       status: "error",
    //       message: "AI service configuration is incomplete",
    //     },
    //     { status: 500 }
    //   );
    // }

    // Create prompt template based on content type
    let promptTemplate = "";

    if (type === "pull_request") {
      promptTemplate = `You are a senior developer reviewing a pull request. Provide a concise, actionable summary that helps developers quickly understand what this PR does and why it matters.

      Format your response as a brief, easy-to-scan summary:

      **What it does:** One clear sentence describing the main purpose and outcome.

      **Key changes:** 
      - List 3-4 most important changes (files, features, fixes)
      - Focus on what actually changed, not technical jargon

      **Why it matters:** Briefly explain the business value or problem it solves.

      ${jiraContext ? `**JIRA context:** ${jiraContext}\n` : ""}**Developer notes:** Any important implementation details, risks, or review points (keep it short).

      Keep it concise - developers should be able to read and understand this in 30 seconds.

      {content}`;
    } else if (type === "commit") {
      promptTemplate = `You are a senior developer analyzing a commit. Provide a concise summary that helps developers quickly understand what changed and why.

      Format your response as a brief summary:

      **Summary:** One clear sentence describing what this commit accomplishes.

      **Changes made:**
      - List the most important file/code changes (3-4 key items)
      - Focus on functional impact, not technical details

      **Impact:** Briefly explain what this means for the codebase or users.

      ${jiraContext ? `**JIRA context:** ${jiraContext}\n` : ""}**Notes:** Any important implementation details or side effects (keep it brief).

      Keep it concise and actionable - developers should understand the commit's purpose in 20 seconds.

      {content}`;
    } else if (type === "repository") {
      promptTemplate = `You are an AI assistant specialized in analyzing GitHub repositories. 
      Analyze and provide a brief overview of this GitHub repository in 2-3 concise sentences:
      
      {content}`;
    } else {
      promptTemplate = `Analyze and summarize the following GitHub information in 2-3 concise sentences:
      
      {content}`;
    }

    // Create prompt template
    const prompt = PromptTemplate.fromTemplate(promptTemplate);

    // Format the prompt with the content
    const formattedPrompt = await prompt.format({
      content: content,
    });

    try {
      // Initialize WatsonX LLM with optimized configuration for faster response
      const model = new WatsonxLLM({
        model: modelToUse, // Use selected model
        watsonxAIAuthType: "iam",
        watsonxAIApikey: process.env.WATSONX_API_KEY || "",
        serviceUrl: "https://us-south.ml.cloud.ibm.com",
        projectId: process.env.WATSONX_PROJECT_ID || "",
        version: "2023-05-29", // Using a standard date format
        maxNewTokens: 600, // Reduced for more concise responses
        minNewTokens: 150, // Minimum for meaningful content
        temperature: 0.4, // Lower temperature for focused, consistent responses
        topP: 0.9,
        // Using standard parameters supported by the WatsonxLLM
      });

      // Generate summary using the model
      let summary = await model.invoke(formattedPrompt);
      console.log(`Generated summary for ${type}:`, summary);

      if (!summary || summary.trim() === "") {
        console.error("Empty summary generated by the model");
        return Response.json(
          {
            status: "error",
            message: "Generated summary was empty",
          },
          { status: 500 }
        );
      }

      // Clean up the summary - trim whitespace and normalize newlines
      summary = summary.trim();

      return Response.json({
        status: "success",
        summary: summary,
      });
    } catch (aiError) {
      console.error("WatsonX API request failed:", aiError);
      return Response.json(
        {
          status: "error",
          message: "AI service request failed",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Summary generation error:", error);
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
