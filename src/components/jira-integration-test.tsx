"use client";
// Test component to verify JIRA integration
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  extractJiraIssueReferences,
  type JiraIssueReference,
  type JiraIssue,
} from "@/services/jira-service";

export function JiraIntegrationTest() {
  const [testInput, setTestInput] = useState("CN-45935 Fix login issue");
  const [references, setReferences] = useState<JiraIssueReference[]>([]);
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testExtraction = () => {
    const refs = extractJiraIssueReferences(testInput);
    setReferences(refs);
    console.log("Extracted references:", refs);
  };

  const testJiraFetch = async () => {
    if (references.length === 0) {
      setError("No JIRA references found. Run extraction first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uniqueKeys = [...new Set(references.map((ref) => ref.issueKey))];
      console.log("Fetching JIRA issues for keys via API:", uniqueKeys);

      // Use API route instead of direct service call
      const response = await fetch("/api/jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueKeys: uniqueKeys,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      setJiraIssues(result.issues || []);
      console.log("Fetched JIRA issues via API:", result);
    } catch (err) {
      setError(`Error fetching JIRA issues: ${err}`);
      console.error("JIRA fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>JIRA Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            Test PR Title/Description:
          </label>
          <Input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter PR title with JIRA reference (e.g., CN-45935 Fix login issue)"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={testExtraction}>1. Extract JIRA References</Button>
          <Button
            onClick={testJiraFetch}
            disabled={loading || references.length === 0}
          >
            {loading ? "Fetching..." : "2. Fetch JIRA Issues"}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            {error}
          </div>
        )}

        {references.length > 0 && (
          <div>
            <h3 className="font-medium">Extracted References:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(references, null, 2)}
            </pre>
          </div>
        )}

        {jiraIssues.length > 0 && (
          <div>
            <h3 className="font-medium">Fetched JIRA Issues:</h3>
            <div className="space-y-2">
              {jiraIssues.map((issue) => (
                <div
                  key={issue.key}
                  className="p-3 bg-blue-50 border border-blue-200 rounded"
                >
                  <div className="font-medium">
                    {issue.key}: {issue.summary}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {issue.status.name} | Type: {issue.issuetype.name}
                  </div>
                  {issue.assignee && (
                    <div className="text-sm text-gray-600">
                      Assignee: {issue.assignee.displayName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>
            <strong>Environment Check:</strong>
          </p>
          <p>
            JIRA Base URL:{" "}
            {process.env.NEXT_PUBLIC_JIRA_BASE_URL || "Not configured"}
          </p>
          <p>Server-side config should be in .env file</p>
          <p>
            Client-side NEXT_PUBLIC_JIRA_BASE_URL:{" "}
            {process.env.NEXT_PUBLIC_JIRA_BASE_URL
              ? "✅ Configured"
              : "❌ Missing"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
