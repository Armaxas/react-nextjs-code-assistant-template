import { NextResponse } from 'next/server';
import { getGitHubAccessToken } from '@/actions/github-actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const sha = searchParams.get('sha');

    if (!repo || !sha) {
      return NextResponse.json(
        { error: 'Repository and SHA are required' },
        { status: 400 }
      );
    }

    const accessToken = await getGitHubAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub access token not available' },
        { status: 401 }
      );
    }

    // Parse repository name
    const [org, repoName] = repo.includes("/")
      ? repo.split("/")
      : ["IBMSC", repo];

    // Determine API base URL
    const apiBase = process.env.GITHUB_URL
      ? `${process.env.GITHUB_URL}/api/v3`
      : "https://api.github.ibm.com";

    // Fetch commit details from GitHub API
    const response = await fetch(
      `${apiBase}/repos/${org}/${repoName}/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const commitData = await response.json();

    // Format the commit data for our UI
    const formattedCommit = {
      sha: commitData.sha,
      message: commitData.commit.message,
      author: {
        name: commitData.commit.author.name,
        email: commitData.commit.author.email,
        date: commitData.commit.author.date
      },
      committer: {
        name: commitData.commit.committer.name,
        email: commitData.commit.committer.email,
        date: commitData.commit.committer.date
      },
      stats: commitData.stats || { total: 0, additions: 0, deletions: 0 },
      files: commitData.files || [],
      html_url: commitData.html_url
    };

    return NextResponse.json({ commit: formattedCommit });

  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit details' },
      { status: 500 }
    );
  }
}
