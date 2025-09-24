// Import helper functions from the hook
import { detectSalesforceLanguage } from "@/hooks/apex-language-helper";

/**
 * Auto-detect code language from content
 * @param content - The code content to analyze
 * @returns The detected language
 */
export const detectCodeLanguage = (content: string): string => {
  // For Salesforce codes, use the specialized detection
  return detectSalesforceLanguage(content);
};
