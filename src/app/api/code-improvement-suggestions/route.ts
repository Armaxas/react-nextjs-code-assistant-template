import { ChatWatsonx } from '@langchain/community/chat_models/ibm';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { auth } from "@/auth";

// Enhanced schema for comprehensive code improvement suggestions
const ImprovementSuggestionsSchema = z.object({
  improvementSuggestions: z.array(z.object({
    title: z.string().describe("Clear, specific title of the improvement"),
    category: z.enum(['Performance', 'Security', 'Maintainability', 'Best Practices', 'Code Quality', 'Error Handling', 'Governor Limits']),
    priority: z.enum(['High', 'Medium', 'Low']),
    description: z.string().describe("Detailed explanation of the issue and why it needs improvement"),
    currentCode: z.string().describe("Exact problematic code snippet from the analyzed code"),
    suggestedCode: z.string().describe("Improved version of the code with proper formatting"),
    explanation: z.string().describe("Technical explanation of how the improvement works"),
    impact: z.string().describe("Expected benefits and performance/security improvements"),
    estimatedEffort: z.enum(['Low', 'Medium', 'High']),
    codeLocation: z.string().describe("Method name or class where this code is found"),
    tags: z.array(z.string()).describe("Relevant tags like 'SOQL', 'Apex', 'Governor Limits', etc.")
  })),
  aiInsights: z.object({
    codeSmells: z.array(z.object({
      type: z.string().describe("Type of code smell detected"),
      description: z.string().describe("What makes this a code smell"),
      location: z.string().describe("Where in the code this occurs"),
      suggestion: z.string().describe("How to fix this code smell"),
      severity: z.enum(['Low', 'Medium', 'High']),
      currentCode: z.string().optional().describe("Current problematic code snippet"),
      suggestedCode: z.string().optional().describe("Fixed code snippet")
    })),
    performanceOptimizations: z.array(z.object({
      issue: z.string().describe("Specific performance issue identified"),
      solution: z.string().describe("Concrete solution to improve performance"),
      impact: z.string().describe("Expected performance improvement"),
      difficulty: z.enum(['Easy', 'Moderate', 'Complex']),
      currentCode: z.string().optional().describe("Current inefficient code snippet"),
      optimizedCode: z.string().optional().describe("Optimized code snippet")
    })),
    securityConcerns: z.array(z.object({
      vulnerability: z.string().describe("Specific security vulnerability or concern"),
      risk: z.enum(['Low', 'Medium', 'High']),
      mitigation: z.string().describe("Specific steps to mitigate this security risk"),
      cweId: z.string().optional().describe("CWE ID if applicable")
    })),
    testingRecommendations: z.array(z.object({
      area: z.string().describe("What part of the code needs testing"),
      testType: z.string().describe("Type of test recommended (Unit, Integration, etc.)"),
      reasoning: z.string().describe("Why this testing is important"),
      priority: z.enum(['High', 'Medium', 'Low'])
    })),
    governorLimitConcerns: z.array(z.object({
      limitType: z.string().describe("Type of Salesforce governor limit"),
      concern: z.string().describe("How the code might violate this limit"),
      suggestion: z.string().describe("How to avoid hitting this limit"),
      riskLevel: z.enum(['Low', 'Medium', 'High'])
    }))
  })
});

function buildCodeTypeSpecificPrompt(codeType: string, code: string, analysis: unknown): string {
  const baseContext = `
You are an expert code reviewer with deep knowledge of ${codeType} development best practices, performance optimization, and security concerns.

IMPORTANT INSTRUCTIONS:
1. Analyze ONLY the provided code - do not make generic suggestions
2. Provide SPECIFIC code improvements with exact before/after examples
3. Focus on issues that actually exist in the code
4. Prioritize suggestions that have real impact
5. Include exact line references and method names
6. Make suggestions relevant to ${codeType} ecosystem
7. For code smells and performance optimizations, ALWAYS provide currentCode and suggestedCode/optimizedCode examples
8. Extract actual code snippets from the provided code for currentCode fields
9. Show concrete improvements in the suggestedCode/optimizedCode fields

Code to analyze:
\`\`\`${codeType.toLowerCase()}
${code}
\`\`\`

Existing analysis context:
${JSON.stringify(analysis, null, 2)}
`;

  switch (codeType.toLowerCase()) {
    case 'apex':
    case 'apex class':
    case 'apex-class':
      return baseContext + `

APEX CLASS SPECIFIC FOCUS AREAS:
1. SOQL/DML Governor Limits: Look for queries in loops, bulk operations, efficiency
2. Security: CRUD/FLS enforcement, WITH SECURITY_ENFORCED usage
3. Performance: Bulkification, efficient SOQL queries, avoiding DML in loops
4. Best Practices: Exception handling, proper design patterns, testability
5. Salesforce Limits: CPU time, heap size, query limits, DML statement limits

CRITICAL APEX CLASS PATTERNS TO IDENTIFY:
- SOQL/DML inside loops (major performance issue)
- Missing WITH SECURITY_ENFORCED or equivalent CRUD/FLS checks
- Hardcoded IDs or values
- Inefficient query patterns (missing selective filters, too many fields)
- Missing null checks for SObject fields
- Poor exception handling (catching generic Exception)
- Non-bulkified code patterns
- Static variables misuse
- Collections vs single record processing inefficiencies

Provide specific, actionable improvements with real code examples from the analyzed code.`;

    case 'apex trigger':
    case 'apex-trigger':
      return baseContext + `

APEX TRIGGER SPECIFIC FOCUS AREAS:
1. Bulkification: Ensure trigger handles 200+ records efficiently
2. Recursion Prevention: Proper static variable usage and context checking
3. Context Handling: Proper use of Trigger.isInsert, isUpdate, etc.
4. Performance: No SOQL/DML in loops, efficient bulk processing
5. Exception Handling: Proper error handling in bulk context

CRITICAL APEX TRIGGER PATTERNS TO IDENTIFY:
- SOQL/DML operations inside loops
- Missing bulkification patterns
- No recursion prevention mechanisms
- Improper trigger context handling
- Missing error handling for bulk operations
- Inefficient collection processing
- Missing null checks for trigger context

Provide trigger-specific improvements focused on bulk processing and governor limits.`;

    case 'apex test':
    case 'apex test class':
    case 'apex-test':
      return baseContext + `

APEX TEST CLASS SPECIFIC FOCUS AREAS:
1. Test Data Setup: Proper SObject creation and field population
2. Assertions: Meaningful assertions covering all code paths
3. Coverage: Testing bulk scenarios (200+ records)
4. Edge Cases: Testing error conditions and boundary cases
5. Test Isolation: Proper use of @TestSetup vs inline setup

CRITICAL APEX TEST PATTERNS TO IDENTIFY:
- Missing bulk testing scenarios
- Weak or missing assertions
- Poor test data setup
- Missing negative test cases
- Improper use of Test.startTest()/stopTest()
- Missing @TestSetup for data reuse
- Hardcoded test data values

Provide test-specific improvements for better coverage and reliability.`;

    case 'lwc javascript':
    case 'lwc-javascript':
    case 'lwc js':
      return baseContext + `

LWC JAVASCRIPT SPECIFIC FOCUS AREAS:
1. Lifecycle Hooks: Proper usage of connectedCallback, renderedCallback
2. Decorators: Correct @api, @track, @wire usage patterns
3. Event Handling: Efficient event delegation and custom events
4. Apex Integration: Optimal @wire vs imperative Apex calls
5. Performance: DOM manipulation efficiency and memory management

CRITICAL LWC JAVASCRIPT PATTERNS TO IDENTIFY:
- Improper lifecycle hook usage
- Memory leaks from event listeners
- Inefficient DOM manipulation
- Poor error handling in async operations
- Incorrect decorator usage (@track vs @api)
- Unhandled promise rejections in Apex calls
- Missing null checks for wire service responses

Provide LWC-specific improvements for performance and best practices.`;

    case 'lwc html':
    case 'lwc-html':
    case 'lwc template':
      return baseContext + `

LWC HTML TEMPLATE SPECIFIC FOCUS AREAS:
1. Conditional Rendering: Efficient if:true/false usage
2. Loops: Optimal for:each performance with proper key usage
3. Event Handling: Proper event binding and delegation
4. Accessibility: ARIA labels, roles, and keyboard navigation
5. SLDS Compliance: Proper design system usage

CRITICAL LWC HTML PATTERNS TO IDENTIFY:
- Missing keys in for:each loops
- Inefficient conditional rendering
- Poor accessibility practices
- Non-SLDS compliant markup
- Missing error handling in templates
- Improper event binding

Provide template-specific improvements for accessibility and performance.`;

    case 'lwc css':
    case 'lwc-css':
      return baseContext + `

LWC CSS SPECIFIC FOCUS AREAS:
1. SLDS Usage: Prefer utility classes over custom CSS
2. Performance: Efficient CSS selectors and minimal custom styles
3. Responsive Design: Mobile-first approach with proper breakpoints
4. Shadow DOM: Proper CSS scoping and inheritance
5. Accessibility: Color contrast and focus indicators

CRITICAL LWC CSS PATTERNS TO IDENTIFY:
- Overriding SLDS when utilities would work
- Inefficient CSS selectors
- Missing responsive design patterns
- Poor accessibility in styling
- Unnecessary custom CSS properties

Provide CSS-specific improvements for SLDS compliance and performance.`;

    case 'visualforce':
    case 'visualforce page':
    case 'visualforce-page':
      return baseContext + `

VISUALFORCE PAGE SPECIFIC FOCUS AREAS:
1. ViewState: Minimize component state and data storage
2. Performance: Efficient action methods and partial refreshes
3. Security: Proper output escaping and CSRF protection
4. Governor Limits: Manage page load times and data volumes
5. Mobile Compatibility: Responsive design considerations

CRITICAL VISUALFORCE PATTERNS TO IDENTIFY:
- Large ViewState issues
- Inefficient action methods
- Missing output escaping
- Poor mobile experience
- Governor limit violations in page load

Provide Visualforce-specific improvements for performance and security.`;

    case 'javascript':
    case 'typescript':
      return baseContext + `

JAVASCRIPT/TYPESCRIPT SPECIFIC FOCUS AREAS:
1. Performance: Async/await patterns, memory leaks, inefficient loops
2. Security: XSS vulnerabilities, input validation, secure API calls
3. Modern Patterns: ES6+ features, proper error handling, type safety
4. Best Practices: Code organization, proper imports, consistent patterns

CRITICAL JS/TS PATTERNS TO IDENTIFY:
- Callback hell or promise anti-patterns
- Memory leaks from event listeners or timers
- Unhandled promise rejections
- Type safety issues (for TypeScript)
- Inefficient DOM manipulation
- Security vulnerabilities in user input handling

Provide specific improvements with modern JavaScript/TypeScript best practices.`;

    case 'python':
      return baseContext + `

PYTHON SPECIFIC FOCUS AREAS:
1. Performance: List comprehensions, generator expressions, efficient algorithms
2. Security: Input validation, SQL injection, secure file handling
3. Pythonic Code: PEP 8 compliance, proper use of built-ins, idiomatic patterns
4. Best Practices: Exception handling, context managers, proper imports

CRITICAL PYTHON PATTERNS TO IDENTIFY:
- Inefficient loops that could be comprehensions
- Mutable default arguments
- Improper exception handling
- Memory inefficient operations
- Security vulnerabilities
- Non-Pythonic code patterns

Provide specific, Pythonic improvements with performance and security focus.`;

    case 'java':
      return baseContext + `

JAVA SPECIFIC FOCUS AREAS:
1. Performance: Stream API usage, memory management, efficient collections
2. Security: Input validation, secure coding practices, injection prevention
3. Modern Java: Latest language features, proper exception handling
4. Best Practices: Design patterns, SOLID principles, clean code

CRITICAL JAVA PATTERNS TO IDENTIFY:
- Inefficient collection operations
- Resource leaks (streams, connections)
- Poor exception handling
- Thread safety issues
- Memory inefficient operations
- Security vulnerabilities

Provide specific improvements using modern Java best practices.`;

    default:
      return baseContext + `

GENERAL CODE ANALYSIS FOCUS:
1. Performance: Identify bottlenecks and inefficient operations
2. Security: Common vulnerabilities and security best practices
3. Maintainability: Code organization, readability, documentation
4. Best Practices: Language-specific patterns and conventions

Analyze the code for language-specific improvements and best practices.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (matching code-analysis route pattern)
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { fileContent, fileName, fileType, existingAnalysis, selectedModel } = await request.json();

    if (!fileContent || !fileName || !fileType) {
      return Response.json(
        { error: "File content, name, and type are required" },
        { status: 400 }
      );
    }

    // Use the selected model or fall back to default (matching code-analysis route)
    const modelToUse = selectedModel || "ibm/granite-3-8b-instruct";

    // Initialize ChatWatsonx with configuration matching code-analysis route
    const chat = new ChatWatsonx({
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

    // Build Salesforce-specific prompt
    const prompt = buildCodeTypeSpecificPrompt(fileType, fileContent, existingAnalysis);

    console.log(`Analyzing ${fileType} code for improvement suggestions...`);

    // Get structured response from AI
    const aiResponse = await chat.withStructuredOutput(ImprovementSuggestionsSchema).invoke([
      {
        role: 'system',
        content: 'You are a Salesforce development expert and code reviewer. Provide specific, actionable code improvement suggestions based on the exact code provided. Focus on real issues you can see in the code, not generic advice. Every suggestion must include actual code snippets from the analyzed code and specific improvements.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    console.log('Generated improvement suggestions successfully');

    return Response.json(aiResponse);

  } catch (error) {
    console.error('Code improvement suggestions error:', error);
    
    return Response.json({
      error: 'Failed to generate improvement suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
