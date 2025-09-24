// codeBlockHandler.ts
import { FileAttachment } from "@/types/types";
import { generateUUID } from "@/lib/utils";

// Define the minimum size threshold for converting code blocks to attachments
const CODE_BLOCK_SIZE_THRESHOLD = 300; // characters

/**
 * Extracts code blocks from the input text and converts large ones to file attachments
 * This version treats each paste operation as a single unit to avoid fragmenting code
 * @param input User input text
 * @returns Object containing cleaned input and extracted file attachments
 */
export function extractCodeBlocksAsAttachments(input: string): {
  cleanedInput: string;
  extractedAttachments: FileAttachment[];
} {
  // If the input is very short, no need to process
  if (input.length < CODE_BLOCK_SIZE_THRESHOLD) {
    return { cleanedInput: input, extractedAttachments: [] };
  }

  const extractedAttachments: FileAttachment[] = [];

  // First, try to extract markdown code blocks
  const markdownCodeExtracted = extractMarkdownCodeBlocks(input);
  if (markdownCodeExtracted.extractedAttachments.length > 0) {
    return markdownCodeExtracted;
  }

  // If not a markdown code block, check if the entire input might be code
  // Only do this for substantial content that looks like code
  if (input.length > CODE_BLOCK_SIZE_THRESHOLD && looksLikeCode(input)) {
    const language = detectLanguage(input);
    const attachment = createCodeAttachment(language, input);
    extractedAttachments.push(attachment);
    return {
      cleanedInput: "", // Remove the entire content since it's all code
      extractedAttachments,
    };
  }

  // Otherwise, return the original input
  return {
    cleanedInput: input,
    extractedAttachments: [],
  };
}

/**
 * Extracts markdown-style code blocks (```language...```)
 */
function extractMarkdownCodeBlocks(input: string): {
  cleanedInput: string;
  extractedAttachments: FileAttachment[];
} {
  // Regular expression to find markdown code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)\n```/g;

  const extractedAttachments: FileAttachment[] = [];
  let cleanedInput = input;
  let matches: RegExpExecArray | null;
  const replacements: { original: string; replacement: string }[] = [];

  // Find all code blocks in the input
  while ((matches = codeBlockRegex.exec(input)) !== null) {
    const fullMatch = matches[0];
    const language = matches[1] || detectLanguage(matches[2]);
    const codeContent = matches[2];

    // Check if code block exceeds the threshold
    if (codeContent.length > CODE_BLOCK_SIZE_THRESHOLD) {
      const attachment = createCodeAttachment(language, codeContent);
      extractedAttachments.push(attachment);

      // Just remove the code block without adding a placeholder
      replacements.push({
        original: fullMatch,
        replacement: "",
      });
    }
  }

  // Apply all replacements to the input text
  replacements.forEach(({ original, replacement }) => {
    cleanedInput = cleanedInput.replace(original, replacement);
  });

  // Clean up extra newlines
  cleanedInput = cleanedInput.replace(/\n{3,}/g, "\n\n").trim();

  return {
    cleanedInput,
    extractedAttachments,
  };
}

/**
 * Heuristic function to determine if text is likely code
 */
function looksLikeCode(text: string): boolean {
  // Count lines with code-like patterns
  const lines = text.split("\n");
  let codeLineCount = 0;

  lines.forEach((line) => {
    if (looksLikeCodeLine(line)) {
      codeLineCount++;
    }
  });

  // If more than 50% of non-empty lines look like code, consider it code
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const codeRatio = nonEmptyLines > 0 ? codeLineCount / nonEmptyLines : 0;

  // Check for common code patterns
  const codePatterns = [
    // Class definitions
    /\b(class|interface|enum)\s+\w+/,
    // Method declarations
    /\b(public|private|protected|static)\s+\w+(\s+\w+)?\s*\(/,
    // Java/C#/Apex imports or packages
    /\bimport\s+[\w.]+;/,
    /\bpackage\s+[\w.]+;/,
    // JavaScript function definitions
    /\bfunction\s+\w+\s*\(/,
    // JavaScript const/let/var declarations
    /\b(const|let|var)\s+\w+\s*=/,
    // Python def or import
    /\bdef\s+\w+\s*\(/,
    /\bimport\s+\w+/,
    // SQL
    /\bSELECT\s+.+\s+FROM\s+/i,
    // HTML tags
    /<\w+(\s+\w+="[^"]*")*\s*>/,
    // Apex class declarations
    /@isTest/,
    /\b(public|private|global)\s+(with sharing|without sharing)?\s*class\s+\w+/,
    // C/C++ includes
    /#include\s+[<"][^>"]+[>"]/,
  ];

  // Count how many code patterns match
  const matchCount = codePatterns.reduce((count, pattern) => {
    return count + (pattern.test(text) ? 1 : 0);
  }, 0);

  // Heuristic: If significant code patterns or high ratio of code-like lines
  return (matchCount >= 2 || codeRatio > 0.5) && codeLineCount >= 5;
}

/**
 * Check if a single line looks like code
 */
function looksLikeCodeLine(line: string): boolean {
  // Skip empty lines
  if (line.trim().length === 0) {
    return false;
  }

  // Patterns that suggest code
  const codePatterns = [
    /^\s*[{}][\s;]*$/, // Lone braces: { or }
    /^\s*(\w+\s*\([^)]*\)[\s;{]*$)/, // Function calls/definitions
    /^\s*(public|private|protected|static|final|class|interface|enum|import|package|void|return)\s/, // Keywords
    /^\s*(\w+\s+\w+\s*=)/, // Variable assignments
    /^\s*(if|for|while|switch|catch)\s*\(/, // Control structures
    /^\s*([a-zA-Z0-9_$]+\s*\([^)]*\))/, // Method calls
    /^\s*@\w+/, // Annotations
    /^\s*\/\/.*$/, // Single-line comments
    /^\s*\/\*.*\*\/\s*$/, // Single-line block comments
    /^\s*\*.*$/, // JavaDoc comment lines
    /^\s*[a-zA-Z0-9_$]+:.*$/, // Labels
    /^\s*case\s+.*:$/, // Case statements
    /^\s*#\w+/, // Preprocessor directives
    /^\s*\w+\s*:\s*\w+/, // JSON-like key-value pairs
    /^\s*[a-zA-Z0-9_$]+\s*\.\s*[a-zA-Z0-9_$]+/, // Object property access
    /^\s*<[a-zA-Z0-9_$]+/, // HTML/XML tags
    /^\s*[a-zA-Z0-9_$]+\s*=\s*["']/, // Attributes
    /^\s*;$/, // Lone semicolons
    /^\s*[a-zA-Z0-9_$]+\s+[a-zA-Z0-9_$]+\s*;$/, // Simple statements
  ];

  // Check against patterns
  return codePatterns.some((pattern) => pattern.test(line));
}

/**
 * Creates a file attachment object from code content
 */
function createCodeAttachment(
  language: string,
  codeContent: string
): FileAttachment {
  // Generate a filename based on the language
  const fileExtension = getFileExtensionFromLanguage(language);
  const fileName = `code_${generateUUID().substring(0, 8)}${fileExtension}`;

  // Determine the file type/category
  const fileType = getFileTypeFromLanguage(language);

  // Create a file attachment object
  return {
    id: generateUUID(),
    name: fileName,
    content: codeContent,
    type: fileType,
    language: language,
    extension: fileExtension.substring(1), // Remove the leading dot
  };
}

/**
 * Attempt to detect the programming language from code content
 */
function detectLanguage(code: string): string {
  // Simple heuristic-based language detection
  if (
    /@isTest|@AuraEnabled|Trigger\s+\w+\s+on\s+|System\.debug|Account\s+acc\s*=/.test(
      code
    )
  ) {
    return "apex";
  }
  if (
    /import\s+React|<(div|span|p)\s+className=|React\.Component|useState\(|export\s+default\s+function/.test(
      code
    )
  ) {
    return "javascript";
  }
  if (/\bfunc\s+\w+\(|package\s+main/.test(code)) {
    return "go";
  }
  if (
    /def\s+\w+\(|import\s+\w+\s+as\s+\w+|if\s+__name__\s*==\s*('|")__main__('|")/.test(
      code
    )
  ) {
    return "python";
  }
  if (
    /public\s+class\s+\w+|private\s+void\s+\w+\(|System\.out\.println/.test(
      code
    )
  ) {
    return "java";
  }
  if (
    /public\s+static\s+void\s+Main\(|namespace\s+\w+|using\s+System;/.test(code)
  ) {
    return "csharp";
  }
  if (/<html|<div|<head|<body|<script/.test(code)) {
    return "html";
  }
  if (
    /SELECT\s+.*\s+FROM\s+|INSERT\s+INTO\s+|UPDATE\s+|DELETE\s+FROM/.test(code)
  ) {
    return "sql";
  }
  if (
    /\$\(document\)|function\s+\w+\s*\(|var\s+\w+\s*=|const\s+\w+\s*=|let\s+\w+\s*=/.test(
      code
    )
  ) {
    return "javascript";
  }

  // Default
  return "plaintext";
}

/**
 * Maps programming language to appropriate file extension
 */
function getFileExtensionFromLanguage(language: string): string {
  const extensionMap: Record<string, string> = {
    javascript: ".js",
    typescript: ".ts",
    python: ".py",
    java: ".java",
    csharp: ".cs",
    apex: ".cls",
    html: ".html",
    css: ".css",
    xml: ".xml",
    json: ".json",
    php: ".php",
    ruby: ".rb",
    go: ".go",
    rust: ".rs",
    kotlin: ".kt",
    swift: ".swift",
    sql: ".sql",
    bash: ".sh",
    plaintext: ".txt",
  };

  return extensionMap[language.toLowerCase()] || ".txt";
}

/**
 * Maps programming language to a descriptive file type
 */
function getFileTypeFromLanguage(language: string): string {
  const typeMap: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    csharp: "C#",
    apex: "Apex Class",
    html: "HTML",
    css: "CSS",
    xml: "XML",
    json: "JSON",
    php: "PHP",
    ruby: "Ruby",
    go: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
    sql: "SQL",
    bash: "Shell Script",
    plaintext: "Text",
  };

  return typeMap[language.toLowerCase()] || "Code File";
}
