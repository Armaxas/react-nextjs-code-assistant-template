import { WatsonxLLM } from "@langchain/community/llms/ibm";
import { getServerDefaultModel } from "./models-config";

export async function generateChatTitle(query: string): Promise<string> {
  try {
    // Initialize WatsonX LLM
    const watsonxLLM = new WatsonxLLM({
      model: getServerDefaultModel(),
      watsonxAIAuthType: "iam",
      watsonxAIApikey: process.env.WATSONX_API_KEY || "",
      serviceUrl: "https://us-south.ml.cloud.ibm.com",
      projectId: process.env.WATSONX_PROJECT_ID || "",
      version: "2023-05-29",
      maxNewTokens: 8000,
      minNewTokens: 50,
      temperature: 0.7,
      topP: 0.9,
    });

    // Create a prompt for title generation
    const titlePrompt = `Generate a concise, descriptive title (maximum 6 words) for the following user query. The title should capture the main intent or topic.

Important: Return ONLY the title text without any quotes, punctuation marks, or extra formatting.

User query: "${query}"

Title:`;

    // Generate title using WatsonX
    const generatedTitle = await watsonxLLM.invoke(titlePrompt);

    // Clean up the response - remove quotes, extra whitespace, and limit length
    let cleanTitle = generatedTitle
      .trim()
      .replace(/\n[\s\S]*$/, "") // Remove anything after first line
      .replace(/^\s*-\s*/, "") // Remove leading dash and whitespace
      .replace(/^\s*\*\s*/, "") // Remove leading asterisk and whitespace
      .replace(/^\s*\d+\.\s*/, "") // Remove leading numbers like "1. "
      .trim();

    // Remove all quote variations (straight & curly quotes) - run multiple times to handle nested quotes
    for (let i = 0; i < 3; i++) {
      cleanTitle = cleanTitle.replace(/^["'"'"`´]|["'"'"`´]$/g, "").trim();
    }

    // Final cleanup and length limit
    cleanTitle = cleanTitle.slice(0, 60);

    // Fallback to truncated query if generation fails or is empty
    return cleanTitle || query.slice(0, 40);
  } catch (error) {
    console.error("Failed to generate title:", error);
    // Fallback to original logic on error
    return query.slice(0, 40);
  }
}
