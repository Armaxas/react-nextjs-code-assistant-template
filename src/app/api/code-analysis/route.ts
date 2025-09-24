import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ChatWatsonx } from "@langchain/community/chat_models/ibm";
import { z } from "zod";

// Define Zod schema for structured output
const CodeAnalysisSchema = z.object({
  summary: z.string().describe("Comprehensive 3-4 sentence overview explaining what this code does, its main functionality, key business logic, and how it fits into the larger system"),
  codeBreakdown: z.object({
    type: z.string().describe("File type"),
    complexity: z.enum(["Low", "Medium", "High"]).describe("Overall code complexity"),
    linesOfCode: z.number().describe("Number of lines of code"),
    methods: z.number().optional().describe("Number of methods/functions"),
    classes: z.number().optional().describe("Number of classes"),
    queries: z.array(z.object({
      query: z.string().describe("The actual SOQL/SQL query"),
      explanation: z.string().describe("Detailed explanation of what this query does, what data it retrieves, and its business purpose"),
      type: z.string().describe("Type of query (SELECT, INSERT, UPDATE, etc.)")
    })).optional().describe("SOQL/SQL queries found with detailed explanations"),
    dmlOperations: z.array(z.object({
      operation: z.string().describe("The DML operation (insert, update, delete, upsert)"),
      explanation: z.string().describe("What this operation does and its impact"),
      objectType: z.string().optional().describe("The Salesforce object being operated on")
    })).optional().describe("DML operations found with detailed explanations"),
  }),
  keyFindings: z.array(z.string()).describe("Key findings about the code"),
  suggestions: z.array(z.string()).describe("Improvement suggestions"),
  cognitiveComplexity: z.object({
    score: z.number().describe("Cognitive complexity score following SonarLint methodology (1-30+)"),
    risk: z.enum(["Low", "Medium", "High"]).describe("Risk level based on SonarLint thresholds"),
    details: z.string().describe("Detailed breakdown of complexity calculation including specific constructs counted"),
    breakdown: z.object({
      conditionals: z.number().describe("Number of if/else/switch statements"),
      loops: z.number().describe("Number of for/while/foreach loops"),
      nestedBlocks: z.number().describe("Additional points for nesting depth"),
      booleanOperators: z.number().describe("Boolean operators in conditions"),
      exceptionHandling: z.number().describe("Try/catch blocks"),
      recursion: z.number().describe("Recursive method calls"),
    }).describe("Detailed breakdown of complexity contributors")
  }).optional(),
  methodAnalysis: z.array(z.object({
    name: z.string().describe("Method name"),
    parameters: z.array(z.string()).describe("Method parameters"),
    returnType: z.string().describe("Return type"),
    purpose: z.string().describe("What this method does"),
    complexity: z.enum(["Low", "Medium", "High"]).describe("Method complexity"),
  })).optional().describe("Analysis of individual methods"),
  qualityMetrics: z.object({
    maintainability: z.number().min(0).max(100).describe("Maintainability score based on code organization, naming, structure, and design patterns"),
    testability: z.number().min(0).max(100).describe("Testability score based on dependencies, coupling, method size, and testable design"),
    readability: z.number().min(0).max(100).describe("Readability score based on variable/method naming, code clarity, comments, and structure"),
    overallQuality: z.number().min(0).max(100).describe("Overall code quality composite score"),
    metricsExplanation: z.string().describe("Detailed explanation of how each metric was calculated and what factors influenced the scores")
  }).optional(),
  specificAnalysis: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).describe("File-type specific analysis"),
});

interface CodeAnalysisRequest {
  fileContent: string;
  fileName: string;
  filePath: string;
  fileType: string;
  repository: string;
  selectedModel?: string;
}

// Get file-type specific analysis prompts
function getStructuredAnalysisPrompt(fileContent: string, fileName: string, fileType: string): string {
  return `You are an expert code analyst. Analyze the following ${fileType} file and provide a comprehensive, detailed analysis.

File: ${fileName}
Type: ${fileType}

Code:
\`\`\`
${fileContent}
\`\`\`

CRITICAL INSTRUCTIONS:
1. **Method Analysis**: Analyze ALL methods/functions in the file. Do not limit to just a few. Include every single method you can identify.
2. **SOQL Query Analysis**: For each SOQL query found, explain what it does, what data it retrieves, and its business purpose.
3. **DML Operations**: Identify and explain all DML operations (insert, update, delete, upsert).

Provide detailed analysis covering:

1. **Summary**: Comprehensive 3-4 sentence overview that explains:
   - What this code does and its main functionality
   - Key business logic and algorithms implemented
   - How it fits into the larger system/application
   - Main responsibilities and purpose of this component

2. **Code Breakdown**: 
   - File type classification
   - Overall complexity assessment (Low/Medium/High)
   - Line count analysis
   - Total count of ALL methods/functions and classes
   - List ALL SOQL queries found with explanations
   - List ALL DML operations found

3. **Key Findings**: Important insights about code quality, patterns, security issues

4. **Improvement Suggestions**: Specific, actionable recommendations for this code

5. **Cognitive Complexity**: Calculate complexity score using SonarLint methodology:
   - Control flow statements (if, else, switch, case): +1 each
   - Loops (for, while, foreach, do-while): +1 each  
   - Nested conditions: +1 for each level of nesting beyond the first
   - Boolean operators in conditions (&&, ||): +1 each
   - Exception handling blocks (try, catch, finally): +1 each
   - Recursion: +1 per recursive call
   - Lambda expressions: +1 each
   - Jump statements (break, continue): +1 each
   - Provide detailed breakdown of each complexity contributor
   - Risk levels: Low (1-5), Medium (6-10), High (11-15), Very High (16+)

6. **Method Analysis**: ANALYZE ALL METHODS/FUNCTIONS - For each and every method found:
   - Method name (exact name from code)
   - All parameters with their types
   - Return type
   - Detailed purpose/what it does
   - Individual complexity rating (Low/Medium/High)
   - Key functionality description

7. **Quality Metrics**: Calculate scores (0-100) based on actual code analysis:
   
   **Maintainability (0-100):**
   - Code organization and structure (20 points)
   - Method size and single responsibility (20 points)
   - Naming conventions and clarity (15 points)
   - Code duplication absence (15 points)
   - Design patterns and architecture (15 points)
   - Documentation and comments (15 points)
   
   **Testability (0-100):**
   - Method complexity and size (25 points)
   - Dependencies and coupling (25 points)
   - Static methods and global state usage (20 points)
   - Constructor complexity (15 points)
   - Input validation and error handling (15 points)
   
   **Readability (0-100):**
   - Variable and method naming (30 points)
   - Code structure and formatting (25 points)
   - Comment quality and documentation (20 points)
   - Code flow and logic clarity (25 points)
   
   **Overall Quality:** Weighted average of above metrics
   
   **Provide detailed explanation** of how each score was calculated and what specific factors influenced the ratings.

8. **Technology-Specific Analysis**: 

${getFileTypeSpecificGuidance(fileType)}

IMPORTANT: 
- Do NOT limit method analysis to just 3-5 methods. Analyze ALL methods in the file.
- For SOQL queries, explain what each query does and what data it retrieves.
- Be thorough and comprehensive in your analysis.

Focus on what you can actually observe in this specific code. Avoid generic advice. Be precise and actionable.`;
}

function getFileTypeSpecificGuidance(fileType: string): string {
  switch (fileType) {
    case 'apex-class':
      return `APEX SPECIFIC ANALYSIS:
- SOQL Queries: [list any SOQL queries found]
- DML Operations: [list DML operations]
- Governor Limits: [potential issues]
- Security: [CRUD/FLS considerations]
- Design Patterns: [patterns identified]`;

    case 'apex-test':
      return `APEX TEST ANALYSIS:
- Test Methods: [list test methods]
- Assertions: [count and quality]
- Test Data: [quality of test setup]
- Coverage: [estimated coverage areas]
- Edge Cases: [edge cases covered]`;

    case 'apex-trigger':
      return `APEX TRIGGER ANALYSIS:
- Trigger Events: [events handled]
- Bulk Processing: [bulk handling quality]
- Recursion Prevention: [mechanisms used]
- Context Handling: [context usage quality]`;

    case 'lwc-javascript':
      return `LWC JAVASCRIPT ANALYSIS:
- Lifecycle Methods: [methods used]
- Decorators: [@api, @track, @wire usage]
- Event Handling: [event patterns]
- Performance: [performance considerations]`;

    case 'lwc-html':
      return `LWC HTML ANALYSIS:
- Template Syntax: [template patterns]
- Conditional Rendering: [if:true/false usage]
- Loops: [for:each patterns]
- Accessibility: [accessibility features]`;

    case 'lwc-css':
      return `LWC CSS ANALYSIS:
- SLDS Usage: [SLDS patterns used]
- Custom Styling: [custom styles]
- Responsive Design: [responsive patterns]
- Performance: [CSS performance]`;

    default:
      return `GENERAL ANALYSIS:
- File Type: ${fileType}
- Code Patterns: [patterns identified]
- Best Practices: [adherence to standards]`;
  }
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
    const body: CodeAnalysisRequest = await req.json();
    const { fileContent, fileName, fileType, selectedModel } = body;

    if (!fileContent || !fileName || !fileType) {
      return Response.json(
        { error: "File content, name, and type are required" },
        { status: 400 }
      );
    }

    // Use the selected model or fall back to default
    const modelToUse = selectedModel || "ibm/granite-3-3-8b-instruct";

    // Initialize ChatWatsonx model
    const watsonxModel = new ChatWatsonx({
      model: modelToUse,
      watsonxAIAuthType: "iam",
      watsonxAIApikey: process.env.WATSONX_API_KEY || "",
      serviceUrl: "https://us-south.ml.cloud.ibm.com",
      projectId: process.env.WATSONX_PROJECT_ID || "",
      version: "2023-05-29",
      maxTokens: 8000,
      temperature: 0.1,
      topP: 0.9,
    });

    // Create structured output model
    const structuredModel = watsonxModel.withStructuredOutput(CodeAnalysisSchema);

    // Prepare the analysis prompt
    const prompt = getStructuredAnalysisPrompt(fileContent, fileName, fileType);

    // Generate structured analysis using WatsonX
    const analysisResult = await structuredModel.invoke(prompt);
    
    return Response.json(analysisResult);

  } catch (error) {
    console.error("Code analysis error:", error);
    return Response.json(
      { error: "Failed to analyze code", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
