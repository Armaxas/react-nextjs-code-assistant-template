import { NextResponse } from 'next/server';
import { getGitHubAccessToken } from '@/actions/github-actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const pr = searchParams.get('pr');

    if (!repo || !pr) {
      return NextResponse.json(
        { error: 'Repository and PR number are required' },
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

    // Fetch PR details from GitHub API
    const prResponse = await fetch(
      `${apiBase}/repos/${org}/${repoName}/pulls/${pr}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        }
      }
    );

    if (!prResponse.ok) {
      const errorText = await prResponse.text();
      console.error('GitHub API error:', prResponse.status, errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${prResponse.status} ${prResponse.statusText}` },
        { status: prResponse.status }
      );
    }

    const prData = await prResponse.json();

    // Optionally fetch files if needed
    let files = null;
    try {
      const filesResponse = await fetch(
        `${apiBase}/repos/${org}/${repoName}/pulls/${pr}/files`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          }
        }
      );

      if (filesResponse.ok) {
        files = await filesResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch PR files:', error);
    }

    // Format the PR data for our UI
    const formattedPR = {
      number: prData.number,
      title: prData.title,
      body: prData.body,
      state: prData.state,
      merged: prData.merged,
      merged_at: prData.merged_at,
      created_at: prData.created_at,
      updated_at: prData.updated_at,
      user: {
        login: prData.user.login,
        avatar_url: prData.user.avatar_url
      },
      head: {
        ref: prData.head.ref,
        sha: prData.head.sha
      },
      base: {
        ref: prData.base.ref,
        sha: prData.base.sha
      },
      additions: prData.additions || 0,
      deletions: prData.deletions || 0,
      changed_files: prData.changed_files || 0,
      commits: prData.commits || 0,
      comments: prData.comments || 0,
      review_comments: prData.review_comments || 0,
      html_url: prData.html_url,
      mergeable: prData.mergeable,
      files: files
    };

    return NextResponse.json({ pr: formattedPR });

  } catch (error) {
    console.error('Error fetching PR details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR details' },
      { status: 500 }
    );
  }
}
