import { auth } from "@/auth";
import { WatsonxLLM } from "@langchain/community/llms/ibm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return Response.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Initialize WatsonX LLM
    const watsonxLLM = new WatsonxLLM({
      model: "ibm/granite-3-2-8b-instruct",
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
    const titlePrompt = `Generate a concise, descriptive title (maximum 6 words) for the following user query. The title should capture the main intent or topic. Only return the title, nothing else.

User query: "${query}"

Title:`;

    // Generate title using WatsonX
    const generatedTitle = await watsonxLLM.invoke(titlePrompt);

    // Clean up the response - remove quotes, extra whitespace, and limit length
    const cleanTitle = generatedTitle
      .trim()
      .replace(/^["']|["']$/g, "") // Remove leading/trailing quotes
      .replace(/\n[\s\S]*$/, "") // Remove anything after first line
      .slice(0, 60); // Ensure max 60 characters

    // Fallback to truncated query if generation fails or is empty
    const finalTitle = cleanTitle || query.slice(0, 40);

    return Response.json({ title: finalTitle });
  } catch (error) {
    console.error("Failed to generate title:", error);

    // Fallback to original logic on error
    const body = await req.json();
    const fallbackTitle = body.query?.slice(0, 40) || "New Chat";

    return Response.json({ title: fallbackTitle });
  }
}
