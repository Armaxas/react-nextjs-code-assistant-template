/**
 * Enhan  sources?: string[];
}

export class EnhancedGitHubChat {Chat Service
 * Combines existing context service with new semantic search capabilities
 */

import { enhancedGitHubContext } from "./enhanced-github-context";
import { buildGitHubContext } from "./github-context-service";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  sources?: string[];
}

interface SearchableCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  files?: string[];
  additions?: number;
  deletions?: number;
  searchableText: string;
}

interface SearchablePullRequest {
  number: number;
  title: string;
  description: string;
  author: string;
  state: string;
  created: string;
  updated: string;
  url: string;
  labels?: string[];
  files?: string[];
  searchableText: string;
}

interface SearchResults {
  commits: SearchableCommit[];
  pullRequests: SearchablePullRequest[];
  relevanceScores: Map<string, number>;
  sources: string[];
}

export class EnhancedGitHubChatService {
  /**
   * Process a chat query with enhanced GitHub context
   */
  async processQuery(options: {
    query: string;
    repository?: string;
    organization?: string;
    conversationHistory?: ChatMessage[];
    includeCodeContext?: boolean;
    maxResults?: number;
  }): Promise<{
    enhancedContext: string;
    sources: string[];
    searchResults: {
      commits: SearchableCommit[];
      pullRequests: SearchablePullRequest[];
      relevanceScores: Map<string, number>;
    };
    contextMetadata: {
      searchType: "enhanced" | "standard" | "hybrid";
      resultsCount: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const {
      query,
      repository,
      organization = "IBMSC",
      includeCodeContext = false,
      maxResults = 15,
    } = options;

    let searchResults: SearchResults = {
      commits: [],
      pullRequests: [],
      relevanceScores: new Map(),
      sources: [],
    };
    let enhancedContext = "";
    let searchType: "enhanced" | "standard" | "hybrid" = "standard";

    try {
      if (repository) {
        // Determine if this is a search-heavy query that would benefit from enhanced search
        const isSearchQuery = this.isSearchIntensiveQuery(query);

        if (isSearchQuery) {
          searchType = "enhanced";

          // Use enhanced search for specific commit/PR queries
          searchResults = await enhancedGitHubContext.searchGitHubContent({
            repository,
            query,
            organization,
            maxResults,
            includeCode: includeCodeContext,
          });

          enhancedContext = this.formatEnhancedResults(searchResults, query);
        } else {
          searchType = "standard";

          // Use existing context service for general queries
          const contextResult = await buildGitHubContext({
            repository,
            query,
            contextTypes: ["commits", "prs", "files"],
            maxTokens: 3000,
            organization,
          });

          enhancedContext = contextResult.content;
          searchResults.sources = contextResult.sources;
        }

        // For complex queries, try hybrid approach
        if (this.isComplexQuery(query) && searchType === "standard") {
          searchType = "hybrid";

          try {
            const additionalResults =
              await enhancedGitHubContext.searchGitHubContent({
                repository,
                query,
                organization,
                maxResults: 5,
                includeCode: false,
              });

            // Merge results
            const hybridContext = this.mergeContexts(
              enhancedContext,
              this.formatEnhancedResults(additionalResults, query)
            );

            enhancedContext = hybridContext;
            searchResults.sources.push(...additionalResults.sources);
          } catch (error) {
            console.warn(
              "Hybrid search failed, using standard results:",
              error
            );
          }
        }
      } else {
        // No repository specified, provide general GitHub guidance
        enhancedContext = this.getGeneralGitHubGuidance(query);
      }

      const processingTime = Date.now() - startTime;

      return {
        enhancedContext,
        sources: [...new Set(searchResults.sources)].filter(
          (source): source is string => typeof source === "string"
        ), // Remove duplicates and filter to strings
        searchResults: {
          commits: searchResults.commits || [],
          pullRequests: searchResults.pullRequests || [],
          relevanceScores: searchResults.relevanceScores || new Map(),
        },
        contextMetadata: {
          searchType,
          resultsCount:
            (searchResults.commits?.length || 0) +
            (searchResults.pullRequests?.length || 0),
          processingTime,
        },
      };
    } catch (error) {
      console.error("Enhanced chat processing failed:", error);

      // Fallback to basic response
      return {
        enhancedContext: `I encountered an issue searching the repository. Please try rephrasing your question or check if the repository "${repository}" is accessible.`,
        sources: [],
        searchResults: {
          commits: [],
          pullRequests: [],
          relevanceScores: new Map(),
        },
        contextMetadata: {
          searchType: "standard",
          resultsCount: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Determine if query would benefit from enhanced search
   */
  private isSearchIntensiveQuery(query: string): boolean {
    const searchIndicators = [
      "find commits",
      "search for",
      "show me commits",
      "pull requests about",
      "changes related to",
      "commits containing",
      "PRs with",
      "recent changes",
      "latest commits",
      "show commits by",
      "find PRs",
      "search PRs",
      "commits that",
      "changes made",
      "who changed",
      "when was",
      "history of",
    ];

    const queryLower = query.toLowerCase();
    return searchIndicators.some((indicator) => queryLower.includes(indicator));
  }

  /**
   * Determine if query is complex and would benefit from hybrid approach
   */
  private isComplexQuery(query: string): boolean {
    const complexIndicators = [
      "analyze",
      "compare",
      "relationship between",
      "impact of",
      "architecture",
      "dependencies",
      "patterns in",
      "trends",
      "overview of",
      "summary of",
      "explain how",
      "what's the difference",
      "how does",
    ];

    const queryLower = query.toLowerCase();
    return (
      complexIndicators.some((indicator) => queryLower.includes(indicator)) ||
      query.split(/\s+/).length > 10
    ); // Long queries are typically complex
  }

  /**
   * Format enhanced search results into readable context
   */
  private formatEnhancedResults(results: SearchResults, query: string): string {
    let context = `## Enhanced Search Results for: "${query}"\n\n`;

    if (results.commits.length > 0) {
      context += `### Recent Relevant Commits (${results.commits.length} found)\n\n`;

      results.commits.forEach((commit, index) => {
        const relevance =
          results.relevanceScores.get(`commit-${commit.sha}`) || 0;
        context += `**${index + 1}. ${commit.message.split("\n")[0]}**\n`;
        context += `- **SHA:** ${commit.sha.substring(0, 8)}\n`;
        context += `- **Author:** ${commit.author}\n`;
        context += `- **Date:** ${new Date(commit.date).toLocaleDateString()}\n`;
        context += `- **Relevance Score:** ${relevance.toFixed(1)}\n`;

        if (commit.files && commit.files.length > 0) {
          context += `- **Files Changed:** ${commit.files.slice(0, 3).join(", ")}${commit.files.length > 3 ? "..." : ""}\n`;
        }

        if (commit.additions !== undefined && commit.deletions !== undefined) {
          context += `- **Changes:** +${commit.additions} -${commit.deletions}\n`;
        }

        context += `- **URL:** ${commit.url}\n\n`;
      });
    }

    if (results.pullRequests.length > 0) {
      context += `### Relevant Pull Requests (${results.pullRequests.length} found)\n\n`;

      results.pullRequests.forEach((pr, index) => {
        const relevance = results.relevanceScores.get(`pr-${pr.number}`) || 0;
        context += `**${index + 1}. #${pr.number}: ${pr.title}**\n`;
        context += `- **Author:** ${pr.author}\n`;
        context += `- **State:** ${pr.state}\n`;
        context += `- **Created:** ${new Date(pr.created).toLocaleDateString()}\n`;
        context += `- **Updated:** ${new Date(pr.updated).toLocaleDateString()}\n`;
        context += `- **Relevance Score:** ${relevance.toFixed(1)}\n`;

        if (pr.labels && pr.labels.length > 0) {
          context += `- **Labels:** ${pr.labels.join(", ")}\n`;
        }

        if (pr.files && pr.files.length > 0) {
          context += `- **Files:** ${pr.files.slice(0, 3).join(", ")}${pr.files.length > 3 ? "..." : ""}\n`;
        }

        if (pr.description && pr.description.trim()) {
          const shortDesc = pr.description.substring(0, 150);
          context += `- **Description:** ${shortDesc}${pr.description.length > 150 ? "..." : ""}\n`;
        }

        context += `- **URL:** ${pr.url}\n\n`;
      });
    }

    if (results.commits.length === 0 && results.pullRequests.length === 0) {
      context +=
        "No specific commits or pull requests found matching your query. You might want to try:\n";
      context += "- Using different keywords\n";
      context += "- Checking the repository name\n";
      context += "- Asking a more general question about the repository\n\n";
    }

    return context;
  }

  /**
   * Merge multiple context sources intelligently
   */
  private mergeContexts(primary: string, secondary: string): string {
    if (!secondary.trim()) return primary;
    if (!primary.trim()) return secondary;

    return `${primary}\n\n---\n\n## Additional Search Results\n\n${secondary}`;
  }

  /**
   * Provide general GitHub guidance when no repository is specified
   */
  private getGeneralGitHubGuidance(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes("commit")) {
      return `## Git Commits Guidance

Commits are snapshots of your repository at specific points in time. Here's what I can help you with:

### Common Commit Operations:
- **View commit history:** \`git log\` or check the repository's commits tab
- **See specific commit:** \`git show <commit-sha>\`
- **Search commits:** Use GitHub's commit search or \`git log --grep="search term"\`

### Commit Best Practices:
- Write clear, descriptive commit messages
- Make atomic commits (one logical change per commit)
- Use conventional commit format: \`type(scope): description\`

To search for specific commits in a repository, please specify which repository you'd like me to search.`;
    }

    if (queryLower.includes("pull request") || queryLower.includes("pr")) {
      return `## Pull Requests Guidance

Pull Requests (PRs) are proposals to merge code changes. Here's how I can assist:

### PR Information I Can Provide:
- Recent PRs in a repository
- PR details including changes, reviews, and status
- Search PRs by title, author, or labels
- Compare different PRs

### PR Best Practices:
- Write descriptive titles and descriptions
- Keep PRs focused and reasonably sized
- Include relevant reviewers
- Link to issues when applicable

To search for specific pull requests, please specify which repository you'd like me to examine.`;
    }

    return `## GitHub Repository Assistant

I can help you explore and understand GitHub repositories! Here's what I can do:

### Repository Analysis:
- Search commits by message, author, or date
- Find pull requests by title, state, or labels
- Analyze code changes and file modifications
- Provide repository overviews and statistics

### How to Get Started:
1. **Specify a repository** - Tell me which repo you want to explore
2. **Ask specific questions** - Like "show me recent commits" or "find PRs about authentication"
3. **Request analysis** - Ask for code reviews, change summaries, or architectural insights

### Example Queries:
- "Show me recent commits in the PRM repository"
- "Find pull requests about authentication in global-core"
- "What changes were made to the API last month?"
- "Analyze the commit history for performance improvements"

Please specify a repository to get started with your analysis!`;
  }

  /**
   * Generate smart follow-up questions based on the query and results
   */
  generateFollowUpQuestions(query: string, results: SearchResults): string[] {
    const questions: string[] = [];
    const queryLower = query.toLowerCase();

    if (results.commits?.length > 0) {
      questions.push(
        "Would you like me to analyze the code changes in any of these commits?"
      );
      questions.push(
        "Do you want to see the full diff for any specific commit?"
      );
    }

    if (results.pullRequests?.length > 0) {
      questions.push(
        "Would you like me to review any of these pull requests in detail?"
      );
      questions.push("Do you want to see the review comments for any PR?");
    }

    if (queryLower.includes("recent") || queryLower.includes("latest")) {
      questions.push("Would you like me to search for older changes as well?");
    }

    if (queryLower.includes("author") || queryLower.includes("who")) {
      questions.push("Would you like to see more commits from this author?");
    }

    return questions.slice(0, 3); // Limit to 3 questions
  }
}

// Export singleton instance
export const enhancedGitHubChatService = new EnhancedGitHubChatService();
