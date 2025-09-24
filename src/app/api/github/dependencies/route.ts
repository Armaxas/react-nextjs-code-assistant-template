import { NextRequest, NextResponse } from "next/server";
import { getGitHubAccessToken } from "@/actions/github-actions";
import {
  githubDependencyAnalyzer,
  listRepositoryFiles,
  DependencyOptions,
} from "@/services/github-dependency-service";

/**
 * API route for listing files in a repository
 * GET /api/github/dependencies?repo=<repository>&org=<organization>
 */
export async function GET(req: NextRequest) {
  try {
    // Verify GitHub authentication
    const token = await getGitHubAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: "GitHub authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const repository = searchParams.get("repo");
    const organization = searchParams.get("org") || "IBMSC";

    if (!repository) {
      return NextResponse.json(
        { error: "Repository parameter is required" },
        { status: 400 }
      );
    }

    console.log(`Listing files for repository: ${repository}`);

    // List files in the repository
    const fileList = await listRepositoryFiles(repository, organization);

    console.log(`Found ${fileList.totalCount} files in ${repository}`);

    return NextResponse.json(fileList);
  } catch (error) {
    console.error("Error listing repository files:", error);

    const errorMessage =
      process.env.NODE_ENV === "development"
        ? `Failed to list repository files: ${error instanceof Error ? error.message : "Unknown error"}`
        : "Failed to list repository files";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * API route for analyzing dependencies for a specific file
 * POST /api/github/dependencies
 */
export async function POST(req: NextRequest) {
  try {
    // Verify GitHub authentication
    const token = await getGitHubAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: "GitHub authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      repositories,
      targetFile,
      targetRepo,
      // fileTypes, // TODO: Implement fileTypes filtering in analyzeDependenciesWithInsights
      maxDepth,
      includeMethodLevel,
      includeContent,
      selectedModel,
    } = body as DependencyOptions;

    // Validate required parameters
    if (!targetFile || !targetRepo) {
      return NextResponse.json(
        { error: "targetFile and targetRepo are required parameters" },
        { status: 400 }
      );
    }

    if (
      !repositories ||
      !Array.isArray(repositories) ||
      repositories.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one repository must be specified for dependency search",
        },
        { status: 400 }
      );
    }

    // Log the analysis request
    console.log(
      `Analyzing dependencies for file: ${targetFile} in repo: ${targetRepo}`
    );
    console.log(`Search repositories: ${repositories.join(", ")}`);
    console.log(
      `Options: maxDepth=${maxDepth || 2}, includeMethodLevel=${includeMethodLevel !== false}, includeContent=${includeContent || false}`
    );

    // Analyze dependencies with enhanced insights
    const dependencyGraph =
      await githubDependencyAnalyzer.analyzeDependenciesWithInsights(
        targetFile,
        targetRepo,
        repositories,
        maxDepth || 2,
        includeMethodLevel !== false,
        includeContent || false,
        selectedModel
      );

    // Log summary statistics
    console.log(
      `Analysis complete: ${dependencyGraph.metadata.nodeCount} nodes, ${dependencyGraph.metadata.linkCount} links`
    );
    if (dependencyGraph.metadata.crossRepoLinkCount !== undefined) {
      console.log(
        `Cross-repository links: ${dependencyGraph.metadata.crossRepoLinkCount}`
      );
    }

    return NextResponse.json(dependencyGraph);
  } catch (error) {
    console.error("Error analyzing dependencies:", error);

    const errorMessage =
      process.env.NODE_ENV === "development"
        ? `Failed to analyze dependencies: ${error instanceof Error ? error.message : "Unknown error"}`
        : "Failed to analyze dependencies";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * API route for getting dependency analysis options/capabilities
 * OPTIONS /api/github/dependencies
 */
export async function OPTIONS() {
  return NextResponse.json({
    endpoints: {
      "GET /api/github/dependencies": {
        description: "List all Salesforce files in a repository",
        parameters: {
          repo: {
            required: true,
            type: "string",
            description: "Repository name in format 'repo' or 'org/repo'",
          },
          org: {
            required: false,
            type: "string",
            default: "IBMSC",
            description: "Default organization if not specified in repo",
          },
        },
        returns: "FileListResponse with categorized files",
      },
      "POST /api/github/dependencies": {
        description: "Analyze dependencies for a specific file",
        body: {
          repositories: {
            required: true,
            type: "array",
            description: "Array of repository names to search for dependencies",
          },
          targetFile: {
            required: true,
            type: "string",
            description: "Path to the file to analyze",
          },
          targetRepo: {
            required: true,
            type: "string",
            description: "Repository containing the target file",
          },
          fileTypes: {
            required: false,
            type: "array",
            default: ["apex", "lwc", "test", "other"],
            description: "Types of files to include in analysis",
          },
          maxDepth: {
            required: false,
            type: "number",
            default: 2,
            description: "Maximum depth of dependency analysis",
          },
          includeMethodLevel: {
            required: false,
            type: "boolean",
            default: true,
            description: "Include method-level dependency analysis",
          },
          includeContent: {
            required: false,
            type: "boolean",
            default: false,
            description: "Include file content for AI analysis",
          },
        },
        returns: "DependencyGraph with nodes and links",
      },
    },
    capabilities: {
      fileTypes: ["apex", "lwc", "test", "other"],
      features: {
        singleFileAnalysis: true,
        methodLevelAnalysis: true,
        crossRepositoryAnalysis: true,
        incrementalAnalysis: true,
        contentInclusion: true,
        lineNumberTracking: true,
      },
    },
  });
}
