"use server";

import { auth } from "@/auth";
import { detectLanguageAndType } from "@/lib/utils/file-utils";

export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  full_name: string;
  default_branch: string;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  download_url: string | null;
  content?: string; // Base64 encoded content for files
  encoding?: string;
  html_url: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string; // Decoded content
  type: string; // e.g., "file"
  language: string;
  extension: string;
  html_url: string;
  repo: string; // full_name of the repository
}

export interface GitHubOrgMember {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  changed_files?: number;
  additions?: number;
  deletions?: number;
  commits?: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface GitHubCommitFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

/**
 * Get the GitHub access token from the session
 */
export async function getGitHubAccessToken(): Promise<string | null> {
  try {
    const session = await auth();
    // console.log("=== getGitHubAccessToken DEBUG ===");
    // console.log("Session exists:", !!session);
    // console.log("Session keys:", session ? Object.keys(session) : "none");
    // console.log("Session.user exists:", !!session?.user);
    // console.log(
    //   "Session.githubAccessToken exists:",
    //   !!session?.githubAccessToken
    // );
    // console.log(
    //   "Session.githubAccessToken type:",
    //   typeof session?.githubAccessToken
    // );
    if (session?.githubAccessToken) {
      console.log(
        "Token preview:",
        session.githubAccessToken.substring(0, 20) + "..."
      );
    }
    // console.log("===============================");
    return session?.githubAccessToken || null;
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    return null;
  }
}

/**
 * Check if the user is authenticated with GitHub
 */
export async function isGitHubAuthenticated(): Promise<boolean> {
  try {
    const session = await auth(); // Uses NextAuth server-side
    // Ensure session and session.user exist, and githubAccessToken is present
    return !!(
      session &&
      session.user &&
      typeof session.githubAccessToken === "string"
    );
  } catch (error) {
    console.error("Error checking GitHub authentication:", error);
    return false;
  }
}

/**
 * Fetch all repositories from the IBMSC GitHub organization
 */
export async function fetchUserRepositories(): Promise<GitHubRepo[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found");
      // Instead of throwing, return empty or handle as per application logic
      return [];
      // throw new Error("GitHub access token not found");
    }

    const apiUrl = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    const userReposUrl = `${apiUrl}/user/repos?per_page=100&type=all&sort=updated`;
    const userReposResponse = await fetch(userReposUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (userReposResponse.ok) {
      const userRepos = (await userReposResponse.json()) as GitHubRepo[];
      const orgRepos = userRepos.filter((repo) =>
        repo.full_name.startsWith("IBMSC/")
      );
      // Return all organization repositories without filtering
      if (orgRepos.length > 0) {
        return orgRepos;
      }
    } else {
      console.error(
        "GitHub user repos API error:",
        userReposResponse.statusText
      );
      // Fallback or error handling if user repos fetch fails
    }

    // Fallback to org repos - return all repositories without filtering
    const orgReposUrl = `${apiUrl}/orgs/IBMSC/repos?per_page=100&type=all`;
    const response = await fetch(orgReposUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("GitHub org repos API error:", response.statusText);
      // throw new Error(`GitHub API error: ${response.statusText}`);
      return []; // Return empty on error
    }

    const repos = (await response.json()) as GitHubRepo[];
    // Return all organization repositories without DEFAULT_REPOS filtering
    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}

/**
 * Fetch repository contents (files and directories) from GitHub.
 */
export async function fetchRepositoryContents(
  repoFullName: string,
  path: string = "",
  branch: string = ""
): Promise<GitHubContent[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error(
        "GitHub access token not found for fetchRepositoryContents"
      );
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
    const contentsUrl = `${apiUrlBase}/repos/${repoFullName}/contents/${path}${branch ? `?ref=${branch}` : ""}`;

    const response = await fetch(contentsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching contents for ${repoFullName}/${path}: ${response.status} ${response.statusText}`
      );
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return [];
    }

    const contents = await response.json();
    return contents as GitHubContent[];
  } catch (error) {
    console.error(
      `Error fetching repository contents for ${repoFullName}/${path}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch all branches for a repository.
 */
export async function fetchRepositoryBranches(
  repoFullName: string
): Promise<GitHubBranch[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error(
        "GitHub access token not found for fetchRepositoryBranches"
      );
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
    const branchesUrl = `${apiUrlBase}/repos/${repoFullName}/branches`;

    const response = await fetch(branchesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching branches for ${repoFullName}: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const branches = (await response.json()) as GitHubBranch[];
    return branches;
  } catch (error) {
    console.error(
      `Error fetching repository branches for ${repoFullName}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch the content of a specific file from GitHub.
 */
export async function fetchFileContent(
  repoFullName: string,
  filePath: string
): Promise<GitHubFile | null> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found for fetchFileContent");
      return null;
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
    const fileUrl = `${apiUrlBase}/repos/${repoFullName}/contents/${filePath}`;

    const response = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching file ${repoFullName}/${filePath}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const fileData = (await response.json()) as GitHubContent;

    if (fileData.type !== "file" || typeof fileData.content === "undefined") {
      console.error(
        `Path ${filePath} in ${repoFullName} is not a file or content is missing.`
      );
      return null;
    }

    const decodedContent = Buffer.from(fileData.content, "base64").toString(
      "utf-8"
    );
    const { language, type, extension } = detectLanguageAndType(fileData.name);

    return {
      name: fileData.name,
      path: fileData.path,
      content: decodedContent,
      type,
      language,
      extension,
      html_url: fileData.html_url,
      repo: repoFullName,
    };
  } catch (error) {
    console.error(
      `Error fetching file content for ${repoFullName}/${filePath}:`,
      error
    );
    return null;
  }
}

/**
 * Search for files within a specific repository.
 * Note: GitHub's search API can be complex. This is a basic implementation for searching by filename.
 * For more complex searches, you might need to adjust the query syntax.
 */
export async function searchRepositoryFiles(
  query: string,
  repoFullName: string
): Promise<GitHubFile[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found for searchRepositoryFiles");
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";
    // Example: q=filename:myFile.txt+repo:owner/repo
    // The query parameter for this function is intended to be the part after "filename:"
    const searchUrl = `${apiUrlBase}/search/code?q=${encodeURIComponent(query)}+in:path+repo:${repoFullName}`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub search API error for query "${query}" in ${repoFullName}: ${response.status} ${response.statusText}`
      );
      const errorBody = await response.text();
      console.error("Search error body:", errorBody);
      return [];
    }

    const searchResult = await response.json();

    if (!searchResult.items || searchResult.items.length === 0) {
      return [];
    }

    // Fetch content for each found file (search results don't include content directly)
    // This can be slow if many files are found. Consider pagination or selective fetching.
    const files: GitHubFile[] = [];
    for (const item of searchResult.items) {
      if (item.path) {
        // Ensure item.path exists
        const fileDetail = await fetchFileContent(repoFullName, item.path);
        if (fileDetail) {
          files.push(fileDetail);
        }
      }
    }
    return files;
  } catch (error) {
    console.error(
      `Error searching repository files in ${repoFullName} with query "${query}":`,
      error
    );
    return [];
  }
}

/**
 * Fetch organization members.
 */
export async function fetchOrganizationMembers(
  orgName: string = "IBMSC"
): Promise<GitHubOrgMember[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error(
        "GitHub access token not found for fetchOrganizationMembers"
      );
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    let allMembers: GitHubOrgMember[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const membersUrl = `${apiUrlBase}/orgs/${orgName}/members?per_page=100&page=${page}`;
      const response = await fetch(membersUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        console.error(
          `GitHub API error fetching members for org ${orgName}, page ${page}: ${response.status} ${response.statusText}`
        );
        // If one page fails, we might still want to return what we have so far, or handle error differently
        return allMembers.length > 0 ? allMembers : [];
      }

      const members: GitHubOrgMember[] = await response.json();
      allMembers = allMembers.concat(members);

      // Check for next page
      const linkHeader = response.headers.get("Link");
      if (linkHeader) {
        hasNextPage = linkHeader.includes('rel="next"');
      } else {
        hasNextPage = false;
      }

      if (members.length < 100) {
        // Optimization: if less than per_page items returned, it's the last page
        hasNextPage = false;
      }

      page++;
    }

    return allMembers;
  } catch (error) {
    console.error(`Error fetching organization members for ${orgName}:`, error);
    return [];
  }
}

/**
 * Fetch a single user's profile to get their email
 */
export async function fetchUserEmail(login: string): Promise<string | null> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found for fetchUserEmail");
      return null;
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    const userUrl = `${apiUrlBase}/users/${login}`;
    const response = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching user ${login}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const user = await response.json();
    return user.email || null;
  } catch (error) {
    console.error(`Error fetching user email for ${login}:`, error);
    return null;
  }
}

/**
 * Fetch pull requests for a repository
 */
export async function fetchRepositoryPullRequests(
  repoFullName: string,
  state: "open" | "closed" | "all" = "all",
  per_page: number = 30
): Promise<GitHubPullRequest[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error(
        "GitHub access token not found for fetchRepositoryPullRequests"
      );
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    const pullsUrl = `${apiUrlBase}/repos/${repoFullName}/pulls?state=${state}&per_page=${per_page}&sort=updated&direction=desc`;

    const response = await fetch(pullsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching pull requests for ${repoFullName}: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const pullRequests = await response.json();
    return pullRequests as GitHubPullRequest[];
  } catch (error) {
    console.error(`Error fetching pull requests for ${repoFullName}:`, error);
    return [];
  }
}

/**
 * Fetch commits for a repository
 */
export async function fetchRepositoryCommits(
  repoFullName: string,
  since?: string,
  per_page: number = 30
): Promise<GitHubCommit[]> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found for fetchRepositoryCommits");
      return [];
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    let commitsUrl = `${apiUrlBase}/repos/${repoFullName}/commits?per_page=${per_page}`;
    if (since) {
      commitsUrl += `&since=${since}`;
    }

    const response = await fetch(commitsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching commits for ${repoFullName}: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const commits = await response.json();
    return commits as GitHubCommit[];
  } catch (error) {
    console.error(`Error fetching commits for ${repoFullName}:`, error);
    return [];
  }
}

/**
 * Fetch detailed commit information including file changes
 */
export async function fetchCommitDetails(
  repoFullName: string,
  commitSha: string
): Promise<(GitHubCommit & { files: GitHubCommitFile[] }) | null> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error("GitHub access token not found for fetchCommitDetails");
      return null;
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    const commitUrl = `${apiUrlBase}/repos/${repoFullName}/commits/${commitSha}`;

    const response = await fetch(commitUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `GitHub API error fetching commit details for ${repoFullName}/${commitSha}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const commit = await response.json();
    return commit as GitHubCommit & { files: GitHubCommitFile[] };
  } catch (error) {
    console.error(
      `Error fetching commit details for ${repoFullName}/${commitSha}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch detailed pull request information including file changes
 */
export async function fetchPullRequestDetails(
  repoFullName: string,
  pullNumber: number
): Promise<(GitHubPullRequest & { files?: GitHubCommitFile[] }) | null> {
  try {
    const token = await getGitHubAccessToken();
    if (!token) {
      console.error(
        "GitHub access token not found for fetchPullRequestDetails"
      );
      return null;
    }

    const apiUrlBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch PR details
    const prUrl = `${apiUrlBase}/repos/${repoFullName}/pulls/${pullNumber}`;
    const prResponse = await fetch(prUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!prResponse.ok) {
      console.error(
        `GitHub API error fetching PR details for ${repoFullName}/${pullNumber}: ${prResponse.status} ${prResponse.statusText}`
      );
      return null;
    }

    const pullRequest = await prResponse.json();

    // Fetch PR files
    const filesUrl = `${apiUrlBase}/repos/${repoFullName}/pulls/${pullNumber}/files`;
    const filesResponse = await fetch(filesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (filesResponse.ok) {
      const files = await filesResponse.json();
      pullRequest.files = files;
    }

    return pullRequest as GitHubPullRequest & { files?: GitHubCommitFile[] };
  } catch (error) {
    console.error(
      `Error fetching PR details for ${repoFullName}/${pullNumber}:`,
      error
    );
    return null;
  }
}

/**
 * Generate AI summary for commits or pull requests
 */
export async function generateAISummary(
  type: "commit" | "pullrequest",
  data: Record<string, unknown>,
  repoName: string,
  selectedModel?: string
): Promise<string> {
  try {
    console.log(
      `Server-side: Generating AI summary for ${type} in repo ${repoName} using model ${selectedModel || "default"}`
    );

    const summary = await fetch("/api/github/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        data,
        repoName,
        selectedModel,
      }),
    });

    if (!summary.ok) {
      console.error(
        `Server-side API error: ${summary.status} ${summary.statusText}`
      );
      throw new Error(`Failed to generate AI summary: ${summary.statusText}`);
    }

    const result = await summary.json();
    console.log("Server-side API response:", result);

    if (result.status === "success" && result.summary) {
      return result.summary;
    } else {
      console.warn(
        "Server-side: API returned success but no summary was found in the response:",
        result
      );
      return "Unable to generate summary";
    }
  } catch (error) {
    console.error("Server-side: Error generating AI summary:", error);
    return "Unable to generate summary due to an error";
  }
}
