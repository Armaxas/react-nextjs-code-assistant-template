import { NextRequest } from "next/server";
import { getGitHubAccessToken } from "@/actions/github-actions";

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      date: string;
      name: string;
    };
    message: string;
  };
}

interface GitHubPR {
  number: number;
  title: string;
  merge_commit_sha: string;
  head: {
    sha: string;
    ref: string;
  };
}

interface TimelineItem {
  sha: string;
  date: string;
  author: string;
  message: string;
  prNumber: number | null;
  prTitle: string | null;
  branchName: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repository, filePath } = body;

    if (!repository || !filePath) {
      return Response.json(
        { error: "Repository and file path are required" },
        { status: 400 }
      );
    }

    // Get GitHub access token
    const accessToken = await getGitHubAccessToken();
    if (!accessToken) {
      return Response.json(
        { error: "GitHub authentication required" },
        { status: 401 }
      );
    }

    // Parse repository name
    const [org, repo] = repository.includes("/")
      ? repository.split("/")
      : ["IBMSC", repository];

    // Determine API base URL
    const apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch commit history for the specific file
    const commitsResponse = await fetch(
      `${apiBase}/repos/${org}/${repo}/commits?path=${encodeURIComponent(filePath)}&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!commitsResponse.ok) {
      const errorData = await commitsResponse.json();
      console.error("GitHub API error:", errorData);
      return Response.json(
        { error: "Failed to fetch commit history" },
        { status: commitsResponse.status }
      );
    }

    const commits: GitHubCommit[] = await commitsResponse.json();

    // Process commits and check for PR associations
    const timeline: TimelineItem[] = await Promise.all(
      commits.map(async (commit: GitHubCommit) => {
        let prNumber: number | null = null;
        let prTitle: string | null = null;
        let branchName: string | null = null;

        // First, try to extract PR number from commit message
        const prMatch = commit.commit.message.match(/#(\d+)/);
        if (prMatch) {
          prNumber = parseInt(prMatch[1]);
        }

        // Try to get PR information for this commit or the extracted PR number
        try {
          const prResponse = await fetch(
            `${apiBase}/repos/${org}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (prResponse.ok) {
            const prs: GitHubPR[] = await prResponse.json();
            
            // First try to find by merge/head commit
            let associatedPR = prs.find((pr: GitHubPR) => 
              pr.merge_commit_sha === commit.sha || 
              pr.head.sha === commit.sha
            );

            // If not found and we have a PR number from message, try to find that PR
            if (!associatedPR && prNumber) {
              associatedPR = prs.find((pr: GitHubPR) => 
                pr.number === prNumber
              );
            }

            if (associatedPR) {
              prNumber = associatedPR.number;
              prTitle = associatedPR.title;
              branchName = associatedPR.head.ref;
            }
          }
        } catch {
          // Ignore PR fetch errors and continue without PR information
        }

        return {
          sha: commit.sha,
          date: commit.commit.author.date,
          author: commit.commit.author.name,
          message: commit.commit.message.split('\n')[0], // First line only
          prNumber,
          prTitle,
          branchName,
        };
      })
    );

    return Response.json({
      timeline,
      totalCommits: commits.length,
    });

  } catch (error) {
    console.error("File timeline error:", error);
    return Response.json(
      { error: "Failed to fetch file timeline", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
