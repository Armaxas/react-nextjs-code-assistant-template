/**
 * GitHub API service for accessing repositories and files
 */

export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  full_name: string;
  default_branch: string;
  html_url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string; // "file" or "dir"
  download_url: string | null;
  content?: string;
  encoding?: string;
  html_url: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  type: string;
  language: string;
  extension: string;
  html_url: string;
  repo: string;
}

export interface GitHubOrgMember {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
}

export const DEFAULT_REPOS = [
  "PRM",
  "global-schema",
  "Sales",
  "global-core",
  "sirion-schema",
  "FeatureFlag",
];

export const ALLOWED_PATHS = [
  "force-app/main/default/classes",
  "force-app/main/default/lwc",
  // Add other allowed paths if necessary
];
