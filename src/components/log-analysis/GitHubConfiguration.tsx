"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Github,
  Key,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Folder,
  Info,
} from "lucide-react";
import type { GitHubSettings } from "@/types/log-analysis";

interface GitHubConfigurationProps {
  onSettingsChange: (settings: GitHubSettings) => void;
  initialSettings?: GitHubSettings;
  disabled?: boolean;
}

export function GitHubConfiguration({
  onSettingsChange,
  initialSettings,
  disabled = false,
}: GitHubConfigurationProps) {
  const [settings, setSettings] = useState<GitHubSettings>(
    initialSettings || {
      token: "",
      repository: "",
      branch: "main",
      isConnected: false,
    }
  );

  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const updateSettings = (updates: Partial<GitHubSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const validateGitHubConnection = async () => {
    if (!settings.token || !settings.repository) {
      setValidationError("Please provide both GitHub token and repository");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      // Validate GitHub token and repository access
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${settings.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error("Invalid GitHub token or insufficient permissions");
      }

      // Validate repository access
      const repoResponse = await fetch(
        `https://api.github.com/repos/${settings.repository}`,
        {
          headers: {
            Authorization: `token ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!repoResponse.ok) {
        throw new Error("Repository not found or no access");
      }

      updateSettings({ isConnected: true });
      setValidationSuccess(true);
      setValidationError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection validation failed";
      setValidationError(errorMessage);
      updateSettings({ isConnected: false });
    } finally {
      setIsValidating(false);
    }
  };

  const disconnectGitHub = () => {
    updateSettings({
      token: "",
      repository: "",
      branch: "main",
      isConnected: false,
    });
    setValidationSuccess(false);
    setValidationError(null);
  };

  const getTokenDisplayValue = () => {
    if (!settings.token) return "";
    if (showToken) return settings.token;
    return "•".repeat(Math.min(settings.token.length, 40));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
          {settings.isConnected && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure GitHub integration to automatically search for related code
          and documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            {/* GitHub Token */}
            <div className="space-y-2">
              <Label htmlFor="github-token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Personal Access Token
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="github-token"
                    type={showToken ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={getTokenDisplayValue()}
                    onChange={(e) =>
                      updateSettings({
                        token: e.target.value,
                        isConnected: false,
                      })
                    }
                    disabled={disabled}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowToken(!showToken)}
                    disabled={!settings.token}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Required scopes:{" "}
                <code className="bg-muted px-1 rounded">repo</code>,{" "}
                <code className="bg-muted px-1 rounded">read:user</code>
              </p>
            </div>

            {/* Repository */}
            <div className="space-y-2">
              <Label htmlFor="github-repo" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Repository
              </Label>
              <Input
                id="github-repo"
                placeholder="owner/repository-name"
                value={settings.repository}
                onChange={(e) =>
                  updateSettings({
                    repository: e.target.value,
                    isConnected: false,
                  })
                }
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Format: owner/repository (e.g., facebook/react)
              </p>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label
                htmlFor="github-branch"
                className="flex items-center gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Branch
              </Label>
              <Input
                id="github-branch"
                placeholder="main"
                value={settings.branch}
                onChange={(e) => updateSettings({ branch: e.target.value })}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Default branch to search for code and documentation
              </p>
            </div>

            {/* Validation Results */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {validationSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/50">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  GitHub connection validated successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {!settings.isConnected ? (
                <Button
                  onClick={validateGitHubConnection}
                  disabled={
                    disabled ||
                    isValidating ||
                    !settings.token ||
                    !settings.repository
                  }
                  className="flex-1"
                >
                  {isValidating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isValidating ? "Validating..." : "Connect GitHub"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={disconnectGitHub}
                  disabled={disabled}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4" />
                  Creating a Personal Access Token
                </h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>
                    Go to GitHub Settings → Developer settings → Personal access
                    tokens
                  </li>
                  <li>Click &quot;Generate new token&quot; (classic)</li>
                  <li>
                    Select required scopes:
                    <ul className="ml-4 mt-1 space-y-1 list-disc list-inside">
                      <li>
                        <code className="bg-muted px-1 rounded">repo</code> -
                        Full repository access
                      </li>
                      <li>
                        <code className="bg-muted px-1 rounded">read:user</code>{" "}
                        - Read user profile
                      </li>
                    </ul>
                  </li>
                  <li>Generate and copy the token</li>
                </ol>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open GitHub Settings
                  </a>
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  How GitHub Integration Works
                </h4>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>
                    Searches repository for related code files when analyzing
                    errors
                  </li>
                  <li>Finds documentation and README files for context</li>
                  <li>Identifies similar error patterns in commit history</li>
                  <li>Suggests fixes based on recent code changes</li>
                  <li>Links to relevant issues and pull requests</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <h4 className="font-medium flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-300">
                  <AlertCircle className="h-4 w-4" />
                  Security Note
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your GitHub token is stored locally and never sent to our
                  servers. It&apos;s only used to make direct API calls to
                  GitHub from your browser.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
