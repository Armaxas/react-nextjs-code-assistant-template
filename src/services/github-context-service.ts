/**
 * GitHub Context Service for RAG Assistant
 * Provides intelligent context building for GitHub repositories
 */

import { getGitHubAccessToken } from "@/actions/github-actions";

// GitHub API interfaces
interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  html_url: string;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: {
    login: string;
  };
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface GitHubContent {
  name: string;
  path: string;
  type: string;
  size?: number;
  download_url?: string;
  html_url: string;
}

interface GitHubSearchResults {
  items: Array<{
    name: string;
    path: string;
    html_url: string;
    repository: {
      full_name: string;
    };
  }>;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string | null;
  published_at: string;
  html_url: string;
}

export interface GitHubContextOptions {
  repository: string;
  query: string;
  contextTypes: ("commits" | "prs" | "issues" | "files" | "releases")[];
  maxTokens?: number;
  timeframe?: "recent" | "all";
  organization?: string;
}

export interface ContextResult {
  content: string;
  sources: string[];
  metadata: {
    repository: string;
    relevanceScore: number;
    contextType: string;
    timestamp: string;
  };
}

class GitHubContextBuilder {
  private apiBase: string;
  private token: string | null = null;

  constructor() {
    this.apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
  }

  /**
   * Detects if the query contains temporal keywords that suggest the user wants recently created items
   */
  private isTemporalQuery(query: string): boolean {
    const temporalKeywords = [
      "latest",
      "newest",
      "recent",
      "new",
      "last",
      "current",
      "today",
      "yesterday",
      "this week",
      "this month",
      "just created",
      "just added",
      "just opened",
    ];

    const lowerQuery = query.toLowerCase();
    return temporalKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  private async ensureAuthentication(): Promise<boolean> {
    if (!this.token) {
      this.token = await getGitHubAccessToken();
    }
    return !!this.token;
  }

  private async makeGitHubRequest(url: string): Promise<unknown> {
    if (!(await this.ensureAuthentication())) {
      throw new Error("GitHub authentication required");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Build context for a specific GitHub query
   */
  async buildContext(options: GitHubContextOptions): Promise<ContextResult> {
    const {
      repository,
      query,
      contextTypes,
      maxTokens = 4000,
      organization = "IBMSC",
    } = options;

    const contextSections: string[] = [];
    const sources: string[] = [];
    let currentTokens = 0;

    // Parse query intent to prioritize context types
    const intent = this.parseQueryIntent(query);
    const prioritizedTypes = this.prioritizeContextTypes(contextTypes, intent);

    for (const contextType of prioritizedTypes) {
      if (currentTokens >= maxTokens) break;

      try {
        const contextData = await this.fetchContextByType(
          contextType,
          repository,
          query,
          organization,
          maxTokens - currentTokens
        );

        if (contextData.content.trim()) {
          contextSections.push(contextData.content);
          sources.push(...contextData.sources);
          currentTokens += this.estimateTokens(contextData.content);
        }
      } catch (error) {
        console.warn(`Failed to fetch ${contextType} context:`, error);
      }
    }

    const finalContent = this.formatContext(contextSections, repository, query);

    return {
      content: finalContent,
      sources,
      metadata: {
        repository: `${organization}/${repository}`,
        relevanceScore: this.calculateRelevanceScore(query, finalContent),
        contextType: contextTypes.join(","),
        timestamp: new Date().toISOString(),
      },
    };
  }

  private parseQueryIntent(
    query: string
  ): "commit" | "pr" | "file" | "issue" | "general" {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("commit") ||
      lowerQuery.includes("change") ||
      lowerQuery.includes("diff")
    ) {
      return "commit";
    }
    if (
      lowerQuery.includes("pull request") ||
      lowerQuery.includes("pr") ||
      lowerQuery.includes("merge")
    ) {
      return "pr";
    }
    if (
      lowerQuery.includes("file") ||
      lowerQuery.includes("code") ||
      lowerQuery.includes(".js") ||
      lowerQuery.includes(".ts")
    ) {
      return "file";
    }
    if (
      lowerQuery.includes("issue") ||
      lowerQuery.includes("bug") ||
      lowerQuery.includes("feature")
    ) {
      return "issue";
    }

    return "general";
  }

  private prioritizeContextTypes(
    contextTypes: string[],
    intent: string
  ): string[] {
    const priorityMap: Record<string, string[]> = {
      commit: ["commits", "files", "prs", "issues", "releases"],
      pr: ["prs", "commits", "files", "issues", "releases"],
      file: ["files", "commits", "prs", "issues", "releases"],
      issue: ["issues", "prs", "commits", "files", "releases"],
      general: ["commits", "prs", "files", "issues", "releases"],
    };

    const priorityOrder = priorityMap[intent] || priorityMap.general;
    return priorityOrder.filter((type) => contextTypes.includes(type));
  }

  private async fetchContextByType(
    contextType: string,
    repository: string,
    query: string,
    organization: string,
    remainingTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    switch (contextType) {
      case "commits":
        return this.fetchCommitsContext(
          repository,
          query,
          organization,
          remainingTokens
        );
      case "prs":
        return this.fetchPullRequestsContext(
          repository,
          query,
          organization,
          remainingTokens
        );
      case "files":
        return this.fetchFilesContext(
          repository,
          query,
          organization,
          remainingTokens
        );
      case "issues":
        return this.fetchIssuesContext(
          repository,
          query,
          organization,
          remainingTokens
        );
      case "releases":
        return this.fetchReleasesContext(
          repository,
          query,
          organization,
          remainingTokens
        );
      default:
        return { content: "", sources: [] };
    }
  }

  private async fetchCommitsContext(
    repository: string,
    query: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    const url = `${this.apiBase}/repos/${organization}/${repository}/commits?per_page=20`;
    const commits = (await this.makeGitHubRequest(url)) as GitHubCommit[];

    const relevantCommits = commits
      .filter((commit) => this.isRelevantToQuery(commit.commit.message, query))
      .slice(0, 10);

    const contextLines: string[] = [];
    const sources: string[] = [];

    for (const commit of relevantCommits) {
      if (this.estimateTokens(contextLines.join("\n")) >= maxTokens) break;

      contextLines.push(
        `## Commit: ${commit.sha.substring(0, 8)}`,
        `**Message:** ${commit.commit.message}`,
        `**Author:** ${commit.commit.author.name}`,
        `**Date:** ${new Date(commit.commit.author.date).toLocaleDateString()}`,
        `**URL:** ${commit.html_url}`,
        ""
      );

      sources.push(commit.html_url);
    }

    return {
      content: contextLines.join("\n"),
      sources,
    };
  }

  private async fetchPullRequestsContext(
    repository: string,
    query: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    // Determine the appropriate sorting based on query intent
    const sortParam = this.isTemporalQuery(query) ? "created" : "updated";
    const url = `${this.apiBase}/repos/${organization}/${repository}/pulls?state=all&per_page=20&sort=${sortParam}`;

    console.log(
      `GitHub Context: Using sort=${sortParam} for query: "${query}"`
    );

    const pullRequests = (await this.makeGitHubRequest(
      url
    )) as GitHubPullRequest[];

    const relevantPRs = pullRequests
      .filter(
        (pr) =>
          this.isRelevantToQuery(pr.title, query) ||
          this.isRelevantToQuery(pr.body || "", query)
      )
      .slice(0, 8);

    const contextLines: string[] = [];
    const sources: string[] = [];

    for (const pr of relevantPRs) {
      if (this.estimateTokens(contextLines.join("\n")) >= maxTokens) break;

      // Build basic PR context
      const prContext = [
        `## Pull Request #${pr.number}: ${pr.title}`,
        `**State:** ${pr.state}`,
        `**Author:** ${pr.user.login}`,
        `**Created:** ${new Date(pr.created_at).toLocaleDateString()}`,
        `**Description:** ${(pr.body || "").substring(0, 200)}...`,
        `**URL:** ${pr.html_url}`,
      ];

      // Try to add JIRA context
      try {
        // Import JIRA functions dynamically to avoid circular dependencies
        const {
          extractJiraIssueReferences,
          fetchJiraIssues,
          formatJiraIssuesForAI,
        } = await import("./jira-service");

        // Extract JIRA references from PR title and description
        const jiraReferences = extractJiraIssueReferences(
          pr.title,
          pr.body || ""
        );

        if (jiraReferences.length > 0) {
          console.log(
            `Found ${jiraReferences.length} JIRA references in PR #${pr.number}`
          );

          // Fetch JIRA issue details
          const issueKeys = jiraReferences.map((ref) => ref.issueKey);
          const jiraIssues = await fetchJiraIssues(issueKeys);

          if (jiraIssues.length > 0) {
            // Add JIRA context to PR information
            const jiraContext = formatJiraIssuesForAI(jiraIssues);
            prContext.push(`**Related JIRA Issues:**\n${jiraContext}`);

            // Add JIRA URLs to sources
            jiraIssues.forEach((issue) => {
              const jiraBaseUrl =
                process.env.NEXT_PUBLIC_JIRA_BASE_URL ||
                "https://your-jira-instance.atlassian.net";
              sources.push(`${jiraBaseUrl}/browse/${issue.key}`);
            });
          }
        }
      } catch (jiraError) {
        console.warn(
          `Failed to fetch JIRA context for PR #${pr.number}:`,
          jiraError
        );
        // Continue without JIRA context
      }

      contextLines.push(...prContext, "");
      sources.push(pr.html_url);
    }

    return {
      content: contextLines.join("\n"),
      sources,
    };
  }

  private async fetchFilesContext(
    repository: string,
    query: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    // For files, we'll use GitHub Search API if available, or browse repository structure
    try {
      const searchUrl = `${this.apiBase}/search/code?q=${encodeURIComponent(query)}+repo:${organization}/${repository}`;
      const searchResults = (await this.makeGitHubRequest(
        searchUrl
      )) as GitHubSearchResults;

      const contextLines: string[] = [];
      const sources: string[] = [];

      for (const item of searchResults.items.slice(0, 5)) {
        if (this.estimateTokens(contextLines.join("\n")) >= maxTokens) break;

        contextLines.push(
          `## File: ${item.path}`,
          `**Repository:** ${item.repository.full_name}`,
          `**URL:** ${item.html_url}`,
          ""
        );

        sources.push(item.html_url);
      }

      return {
        content: contextLines.join("\n"),
        sources,
      };
    } catch {
      // Fallback to repository structure browsing
      return this.fetchRepositoryStructure(repository, organization, maxTokens);
    }
  }

  private async fetchRepositoryStructure(
    repository: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    const url = `${this.apiBase}/repos/${organization}/${repository}/contents`;
    const contents = (await this.makeGitHubRequest(url)) as GitHubContent[];

    const contextLines: string[] = ["## Repository Structure:"];
    const sources: string[] = [
      `https://github.com/${organization}/${repository}`,
    ];

    // Limit the number of items based on maxTokens (roughly 20 tokens per item)
    const itemLimit = Math.min(20, Math.floor(maxTokens / 20));

    for (const item of contents.slice(0, itemLimit)) {
      contextLines.push(`- ${item.type === "dir" ? "📁" : "📄"} ${item.name}`);
    }

    return {
      content: contextLines.join("\n"),
      sources,
    };
  }

  private async fetchIssuesContext(
    repository: string,
    query: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    const url = `${this.apiBase}/repos/${organization}/${repository}/issues?state=all&per_page=15&sort=updated`;
    const issues = (await this.makeGitHubRequest(url)) as GitHubIssue[];

    const relevantIssues = issues
      .filter(
        (issue) =>
          !("pull_request" in issue) && // Exclude PRs
          (this.isRelevantToQuery(issue.title, query) ||
            this.isRelevantToQuery(issue.body || "", query))
      )
      .slice(0, 6);

    const contextLines: string[] = [];
    const sources: string[] = [];

    for (const issue of relevantIssues) {
      if (this.estimateTokens(contextLines.join("\n")) >= maxTokens) break;

      contextLines.push(
        `## Issue #${issue.number}: ${issue.title}`,
        `**State:** ${issue.state}`,
        `**Author:** ${issue.user.login}`,
        `**Labels:** ${issue.labels.map((l) => l.name).join(", ")}`,
        `**Description:** ${(issue.body || "").substring(0, 150)}...`,
        `**URL:** ${issue.html_url}`,
        ""
      );

      sources.push(issue.html_url);
    }

    return {
      content: contextLines.join("\n"),
      sources,
    };
  }

  private async fetchReleasesContext(
    repository: string,
    query: string,
    organization: string,
    maxTokens: number
  ): Promise<{ content: string; sources: string[] }> {
    const url = `${this.apiBase}/repos/${organization}/${repository}/releases?per_page=10`;

    try {
      const releases = (await this.makeGitHubRequest(url)) as GitHubRelease[];

      const contextLines: string[] = [];
      const sources: string[] = [];

      for (const release of releases.slice(0, 5)) {
        if (this.estimateTokens(contextLines.join("\n")) >= maxTokens) break;

        contextLines.push(
          `## Release: ${release.tag_name}`,
          `**Name:** ${release.name || release.tag_name}`,
          `**Published:** ${new Date(release.published_at).toLocaleDateString()}`,
          `**Description:** ${(release.body || "").substring(0, 200)}...`,
          `**URL:** ${release.html_url}`,
          ""
        );

        sources.push(release.html_url);
      }

      return {
        content: contextLines.join("\n"),
        sources,
      };
    } catch {
      return { content: "", sources: [] };
    }
  }

  private isRelevantToQuery(text: string, query: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Simple keyword matching - can be enhanced with more sophisticated algorithms
    const queryWords = lowerQuery
      .split(/\s+/)
      .filter((word) => word.length > 2);
    return queryWords.some((word) => lowerText.includes(word));
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    let matches = 0;
    queryWords.forEach((qWord) => {
      if (contentWords.some((cWord) => cWord.includes(qWord))) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  private formatContext(
    sections: string[],
    repository: string,
    query: string
  ): string {
    const header = `# GitHub Repository Context for: ${repository}
**Query:** ${query}
**Generated:** ${new Date().toLocaleDateString()}

---

`;

    const content = sections.join("\n\n---\n\n");

    const footer = `

---

*This context was automatically generated from the GitHub repository. All information is current as of the generation timestamp.*`;

    return header + content + footer;
  }
}

// Export a singleton instance
export const githubContextBuilder = new GitHubContextBuilder();

// Export the main function for easy use
export async function buildGitHubContext(
  options: GitHubContextOptions
): Promise<ContextResult> {
  return githubContextBuilder.buildContext(options);
}
