/**
 * Helper functions for improving Apex and Salesforce code detection and formatting
 */

/**
 * Detect Salesforce code language based on code content
 * @param content - The code content to analyze
 * @returns The detected language (apex, html, javascript, or text)
 */
export const detectSalesforceLanguage = (content: string): string => {
  // Check for Apex code patterns
  if (
    content.includes("public class") ||
    content.includes("private class") ||
    content.includes("@IsTest") ||
    content.includes("System.assert") ||
    content.includes("trigger ") ||
    content.includes("Apex")
  ) {
    return "apex";
  }
  // Check for Lightning Web Components or Aura
  else if (
    (content.includes("<template") || content.includes("<aura:")) &&
    content.includes("</")
  ) {
    return "html";
  }
  // Check for JavaScript
  else if (
    content.includes("function") ||
    content.includes("const ") ||
    content.includes("let ") ||
    content.includes("import ")
  ) {
    return "javascript";
  }

  // Default to apex for Salesforce contexts
  return "apex";
};

/**
 * Format code as a markdown code block with appropriate language
 * @param content - The code content
 * @param language - The language for syntax highlighting
 * @param filename - Optional filename to display (not used anymore)
 * @param codeType - Optional code type (not used anymore)
 * @returns Formatted markdown string with code block
 */
export const formatCodeAsMarkdown = (
  content: string,
  language: string = "apex",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filename?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  codeType?: string
): string => {
  // Don't add header comments anymore - they were showing up as unwanted text
  // Just format as markdown code block
  return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
};
