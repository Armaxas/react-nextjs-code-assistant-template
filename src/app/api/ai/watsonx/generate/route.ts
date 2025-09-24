import { NextRequest } from "next/server";
import { auth } from "@/auth";

// WatsonX API URL and key
const WATSONX_API_URL =
  process.env.WATSONX_API_URL ||
  "https://us-south.ml.cloud.ibm.com/ml/v1-beta/generation/text";
const WATSONX_API_KEY = process.env.WATSONX_API_KEY;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const WATSONX_VERSION = process.env.WATSONX_VERSION || "2023-05-29";

interface WatsonxRequestBody {
  prompt: string;
  model: string;
  parameters: {
    temperature: number;
    maxNewTokens: number;
    topK?: number;
    topP?: number;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: WatsonxRequestBody = await req.json();
    const { prompt, model = "ibm/granite-13b-instruct-v2", parameters } = body;

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // If WatsonX API key is not configured, return mock response for development
    if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID) {
      console.warn(
        "WatsonX API key or Project ID not configured, returning mock response"
      );

      // Return a mock response for testing without API key
      return Response.json({
        text: "This is a mock IBM Watsonx AI-generated summary since the WatsonX API credentials are not configured. In a production environment, this would be a detailed analysis of the JIRA issues based on the provided data.",
      });
    }

    // Make the actual WatsonX API call
    const { temperature, maxNewTokens, topK, topP, ...otherParams } =
      parameters;
    const watsonxPayload = {
      model_id: model,
      input: prompt,
      parameters: {
        decoding_method: "greedy",
        max_new_tokens: maxNewTokens || 500,
        top_k: topK || 50,
        top_p: topP || 1,
        temperature: temperature || 0.7,
        ...otherParams,
      },
      project_id: WATSONX_PROJECT_ID,
    };

    console.log("Calling WatsonX API with payload:", {
      model: model,
      temperature: parameters.temperature,
      maxNewTokens: parameters.maxNewTokens,
      promptLength: prompt.length,
    });

    const response = await fetch(WATSONX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${WATSONX_API_KEY}`,
        "ML-Instance-ID": WATSONX_PROJECT_ID,
        "X-IBM-Client-Version": WATSONX_VERSION,
      },
      body: JSON.stringify(watsonxPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("WatsonX API error:", response.status, errorData);

      return Response.json(
        {
          error: "WatsonX API error",
          details: `Status: ${response.status}`,
          message: errorData,
        },
        { status: response.status }
      );
    }

    const watsonResponse = await response.json();

    // Extract generated text from WatsonX response format
    const generatedText =
      watsonResponse.results?.[0]?.generated_text ||
      "No content generated from WatsonX";

    return Response.json({ text: generatedText });
  } catch (error) {
    console.error("WatsonX AI generation error:", error);

    return Response.json(
      {
        error: "Failed to generate content with WatsonX",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
