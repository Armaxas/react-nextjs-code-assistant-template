// JIRA Service for integrating JIRA data with GitHub Assistant
export const dynamic = "force-dynamic";

// JIRA Issue interfaces
export interface JiraComment {
  id: string;
  author: {
    displayName: string;
    emailAddress?: string;
  };
  body: string;
  created: string;
  updated: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: {
    name: string;
    statusCategory: {
      key: string;
      name: string;
    };
  };
  priority?: {
    name: string;
    iconUrl?: string;
  };
  assignee?: {
    displayName: string;
    emailAddress?: string;
  };
  reporter?: {
    displayName: string;
    emailAddress?: string;
  };
  created: string;
  updated: string;
  resolutiondate?: string;
  issuetype: {
    name: string;
    iconUrl?: string;
  };
  project: {
    key: string;
    name: string;
  };
  labels: string[];
  components: Array<{
    name: string;
  }>;
  fixVersions: Array<{
    name: string;
  }>;
  comments?: JiraComment[];
}

export interface JiraIssueReference {
  issueKey: string;
  context: "title" | "description" | "branch";
  source: string; // The text where the reference was found
}

// JIRA API Configuration
interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

// Get JIRA configuration from environment variables (server-side only)
function getJiraConfig(): JiraConfig | null {
  // Check if we're running on the server side
  if (typeof window !== "undefined") {
    console.warn(
      "JIRA config cannot be accessed from client-side. Use API routes instead."
    );
    return null;
  }

  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  console.log("[JIRA] Checking environment variables:", {
    baseUrl: !!baseUrl,
    email: !!email,
    apiToken: !!apiToken,
    baseUrlValue: baseUrl ? `${baseUrl.substring(0, 20)}...` : "undefined",
    emailValue: email
      ? `${email.split("@")[0]}@... (length: ${email?.length})`
      : "undefined",
    apiTokenValue: apiToken
      ? `Token loaded (length: ${apiToken?.length})`
      : "undefined", // Emphasize length
  });

  // Also log all environment variables that start with JIRA
  console.log(
    "[JIRA] All JIRA env vars:",
    Object.keys(process.env)
      .filter((key) => key.startsWith("JIRA"))
      .map((key) => {
        const value = process.env[key];
        return {
          key,
          hasValue: !!value,
          length: value?.length, // Explicitly log length
          valuePreview: value ? `${value.substring(0, 10)}...` : "undefined",
        };
      })
  );

  if (!baseUrl || !email || !apiToken) {
    console.warn(
      "JIRA configuration is incomplete. Missing environment variables:",
      {
        baseUrl: !!baseUrl,
        email: !!email,
        apiToken: !!apiToken,
      }
    );
    return null;
  }

  return { baseUrl, email, apiToken };
}

// Extract JIRA issue references from text
export function extractJiraIssueReferences(
  title: string,
  description?: string,
  branchName?: string
): JiraIssueReference[] {
  console.log(`[JIRA] Extracting references from:`, {
    title,
    description: description?.substring(0, 100),
    branchName,
  });

  const references: JiraIssueReference[] = [];

  // Common JIRA issue key patterns: PROJECT-123, ABC-456, etc.
  // Matches 2-10 uppercase letters followed by dash and 1-6 digits
  const jiraKeyRegex = /\b([A-Z]{2,10}-\d{1,6})\b/g;

  // Extract from title
  if (title) {
    let match;
    while ((match = jiraKeyRegex.exec(title)) !== null) {
      console.log(`[JIRA] Found reference in title: ${match[1]}`);
      references.push({
        issueKey: match[1],
        context: "title",
        source: title,
      });
    }
  }

  // Extract from description
  if (description) {
    jiraKeyRegex.lastIndex = 0; // Reset regex
    let match;
    while ((match = jiraKeyRegex.exec(description)) !== null) {
      console.log(`[JIRA] Found reference in description: ${match[1]}`);
      references.push({
        issueKey: match[1],
        context: "description",
        source: description,
      });
    }
  }

  // Extract from branch name
  if (branchName) {
    jiraKeyRegex.lastIndex = 0; // Reset regex
    let match;
    while ((match = jiraKeyRegex.exec(branchName)) !== null) {
      console.log(`[JIRA] Found reference in branch: ${match[1]}`);
      references.push({
        issueKey: match[1],
        context: "branch",
        source: branchName,
      });
    }
  }

  // Remove duplicates
  const uniqueReferences = references.filter(
    (ref, index, self) =>
      index === self.findIndex((r) => r.issueKey === ref.issueKey)
  );

  console.log(
    `[JIRA] Total unique references found: ${uniqueReferences.length}`,
    uniqueReferences
  );
  return uniqueReferences;
}

// Fetch JIRA issue data
export async function fetchJiraIssue(
  issueKey: string
): Promise<JiraIssue | null> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping issue fetch for:", issueKey);
    return null;
  }

  try {
    const url = `${config.baseUrl}/rest/api/2/issue/${issueKey}`;

    // Log lengths of credentials being used
    console.log(
      `[JIRA fetchJiraIssue] Using Email length: ${config.email.length}, Token length: ${config.apiToken.length}`
    );

    // Format credentials according to JIRA API requirements
    // JIRA requires Basic Auth with email:apiToken
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    console.log(`Fetching JIRA issue: ${issueKey} from ${url}`);
    console.log(`JIRA Config - Email: ${config.email}`);
    console.log(
      `JIRA Config - Token preview: ${config.apiToken.substring(0, 10)}...`
    );
    console.log(`JIRA Auth header preview: Basic ${auth.substring(0, 20)}...`);

    // Use fetch with explicit headers and cache control
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check", // Add this header to help with CSRF protection
        "User-Agent": "ISC-Code-Connect-UI/1.0", // Added User-Agent
      },
      cache: "no-store", // Disable caching to ensure fresh data
    });

    if (!response.ok) {
      console.log(
        `[JIRA] API Response status: ${response.status} for issue ${issueKey}`
      );
      console.log(
        `[JIRA] Response headers:`,
        Object.fromEntries(response.headers.entries())
      );

      if (response.status === 404) {
        console.warn(
          `JIRA issue not found: ${issueKey} - This issue may not exist or may have been deleted`
        );
        return null;
      }
      if (response.status === 401) {
        console.error(
          `JIRA authentication failed for issue ${issueKey}. Check your credentials.`
        );
        return null;
      }
      if (response.status === 403) {
        console.warn(
          `Access forbidden for JIRA issue ${issueKey}. You may not have permission to view this issue.`
        );
        return null;
      }

      // Try to get more details about the error
      let errorDetails = "";
      try {
        const errorText = await response.text();
        errorDetails = errorText;
      } catch {
        errorDetails = "Could not read error response";
      }

      throw new Error(
        `JIRA API error for ${issueKey}: ${response.status} ${response.statusText}. Details: ${errorDetails}`
      );
    }

    const data = await response.json();

    // Map JIRA API response to our interface
    const issue: JiraIssue = {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description,
      status: {
        name: data.fields.status.name,
        statusCategory: {
          key: data.fields.status.statusCategory.key,
          name: data.fields.status.statusCategory.name,
        },
      },
      priority: data.fields.priority
        ? {
            name: data.fields.priority.name,
            iconUrl: data.fields.priority.iconUrl,
          }
        : undefined,
      assignee: data.fields.assignee
        ? {
            displayName: data.fields.assignee.displayName,
            emailAddress: data.fields.assignee.emailAddress,
          }
        : undefined,
      reporter: data.fields.reporter
        ? {
            displayName: data.fields.reporter.displayName,
            emailAddress: data.fields.reporter.emailAddress,
          }
        : undefined,
      created: data.fields.created,
      updated: data.fields.updated,
      resolutiondate: data.fields.resolutiondate,
      issuetype: {
        name: data.fields.issuetype.name,
        iconUrl: data.fields.issuetype.iconUrl,
      },
      project: {
        key: data.fields.project.key,
        name: data.fields.project.name,
      },
      labels: data.fields.labels || [],
      components: data.fields.components || [],
      fixVersions: data.fields.fixVersions || [],
    };

    console.log(`Successfully fetched JIRA issue: ${issueKey}`);
    return issue;
  } catch (error) {
    console.error(`Error fetching JIRA issue ${issueKey}:`, error);
    return null;
  }
}

// Fetch JIRA issue comments
export async function fetchJiraIssueComments(
  issueKey: string
): Promise<JiraComment[]> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping comments fetch for:", issueKey);
    return [];
  }

  try {
    const url = `${config.baseUrl}/rest/api/2/issue/${issueKey}/comment`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    console.log(`Fetching JIRA comments for issue: ${issueKey} from ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(
        `[JIRA] Comments API Response status: ${response.status} for issue ${issueKey}`
      );

      if (response.status === 404) {
        console.warn(
          `JIRA issue comments not found: ${issueKey} - This issue may not exist or may have been deleted`
        );
        return [];
      }
      if (response.status === 401) {
        console.error(
          `JIRA authentication failed for comments ${issueKey}. Check your credentials.`
        );
        return [];
      }
      if (response.status === 403) {
        console.warn(
          `Access forbidden for JIRA issue comments ${issueKey}. You may not have permission to view this issue.`
        );
        return [];
      }

      throw new Error(
        `JIRA Comments API error for ${issueKey}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Map JIRA API response to our interface
    const comments: JiraComment[] =
      data.comments?.map(
        (comment: {
          id: string;
          author: {
            displayName: string;
            emailAddress?: string;
          };
          body: string;
          created: string;
          updated: string;
        }) => ({
          id: comment.id,
          author: {
            displayName: comment.author.displayName,
            emailAddress: comment.author.emailAddress,
          },
          body: comment.body,
          created: comment.created,
          updated: comment.updated,
        })
      ) || [];

    console.log(
      `Successfully fetched ${comments.length} comments for JIRA issue: ${issueKey}`
    );
    return comments;
  } catch (error) {
    console.error(`Error fetching JIRA comments for ${issueKey}:`, error);
    return [];
  }
}

// Fetch JIRA issue with comments
export async function fetchJiraIssueWithComments(
  issueKey: string
): Promise<JiraIssue | null> {
  try {
    // Fetch issue and comments in parallel
    const [issue, comments] = await Promise.all([
      fetchJiraIssue(issueKey),
      fetchJiraIssueComments(issueKey),
    ]);

    if (!issue) {
      return null;
    }

    // Add comments to the issue
    issue.comments = comments;

    console.log(
      `Successfully fetched JIRA issue with ${comments.length} comments: ${issueKey}`
    );
    return issue;
  } catch (error) {
    console.error(
      `Error fetching JIRA issue with comments ${issueKey}:`,
      error
    );
    return null;
  }
}

// Add comment to JIRA issue
export async function addJiraIssueComment(
  issueKey: string,
  commentBody: string
): Promise<JiraComment | null> {
  const config = getJiraConfig();
  if (!config) {
    console.warn(
      "JIRA not configured, skipping comment addition for:",
      issueKey
    );
    return null;
  }

  try {
    const url = `${config.baseUrl}/rest/api/2/issue/${issueKey}/comment`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    console.log(`Adding comment to JIRA issue: ${issueKey}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      body: JSON.stringify({
        body: commentBody,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(
        `[JIRA] Add Comment API Response status: ${response.status} for issue ${issueKey}`
      );

      if (response.status === 404) {
        console.warn(
          `JIRA issue not found for comment: ${issueKey} - This issue may not exist or may have been deleted`
        );
        return null;
      }
      if (response.status === 401) {
        console.error(
          `JIRA authentication failed for adding comment to ${issueKey}. Check your credentials.`
        );
        return null;
      }
      if (response.status === 403) {
        console.warn(
          `Access forbidden for adding comment to JIRA issue ${issueKey}. You may not have permission to comment on this issue.`
        );
        return null;
      }

      throw new Error(
        `JIRA Add Comment API error for ${issueKey}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Map JIRA API response to our interface
    const comment: JiraComment = {
      id: data.id,
      author: {
        displayName: data.author.displayName,
        emailAddress: data.author.emailAddress,
      },
      body: data.body,
      created: data.created,
      updated: data.updated,
    };

    console.log(`Successfully added comment to JIRA issue: ${issueKey}`);
    return comment;
  } catch (error) {
    console.error(`Error adding comment to JIRA issue ${issueKey}:`, error);
    return null;
  }
}

// Fetch multiple JIRA issues
export async function fetchJiraIssues(
  issueKeys: string[]
): Promise<JiraIssue[]> {
  const config = getJiraConfig();
  if (!config || issueKeys.length === 0) {
    return [];
  }

  try {
    // Fetch issues in parallel with a reasonable limit
    const maxConcurrent = 5;
    const issues: JiraIssue[] = [];

    for (let i = 0; i < issueKeys.length; i += maxConcurrent) {
      const batch = issueKeys.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((key) => fetchJiraIssue(key));
      const batchResults = await Promise.all(batchPromises);

      // Filter out null results
      const validIssues = batchResults.filter(
        (issue): issue is JiraIssue => issue !== null
      );
      issues.push(...validIssues);
    }

    return issues;
  } catch (error) {
    console.error("Error fetching multiple JIRA issues:", error);
    return [];
  }
}

// Fetch JIRA issue by key to validate parent task
export async function fetchJiraIssueByKey(
  issueKey: string
): Promise<JiraIssue | null> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping issue fetch for:", issueKey);
    return null;
  }

  try {
    const url = `${config.baseUrl}/rest/api/2/issue/${issueKey}`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    console.log(`Fetching JIRA issue by key: ${issueKey} from ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(
        `[JIRA] Issue API Response status: ${response.status} for issue ${issueKey}`
      );

      if (response.status === 404) {
        console.warn(
          `JIRA issue not found: ${issueKey} - This issue may not exist or may have been deleted`
        );
        return null;
      }
      if (response.status === 401) {
        console.error(
          `JIRA authentication failed for ${issueKey}. Check your credentials.`
        );
        return null;
      }
      if (response.status === 403) {
        console.warn(
          `Access forbidden for JIRA issue ${issueKey}. You may not have permission to view this issue.`
        );
        return null;
      }

      throw new Error(
        `JIRA Issue API error for ${issueKey}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Map JIRA API response to our interface
    const issue: JiraIssue = {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description,
      status: {
        name: data.fields.status?.name || "Unknown",
        statusCategory: {
          key: data.fields.status?.statusCategory?.key || "unknown",
          name: data.fields.status?.statusCategory?.name || "Unknown",
        },
      },
      priority: data.fields.priority
        ? {
            name: data.fields.priority.name,
            iconUrl: data.fields.priority.iconUrl,
          }
        : undefined,
      assignee: data.fields.assignee
        ? {
            displayName: data.fields.assignee.displayName,
            emailAddress: data.fields.assignee.emailAddress,
          }
        : undefined,
      reporter: data.fields.reporter
        ? {
            displayName: data.fields.reporter.displayName,
            emailAddress: data.fields.reporter.emailAddress,
          }
        : undefined,
      created: data.fields.created,
      updated: data.fields.updated,
      resolutiondate: data.fields.resolutiondate,
      issuetype: {
        name: data.fields.issuetype?.name || "Task",
        iconUrl: data.fields.issuetype?.iconUrl,
      },
      project: {
        key: data.fields.project?.key || "ISCCC",
        name: data.fields.project?.name || "ISC Code Connect",
      },
      labels: data.fields.labels || [],
      components: data.fields.components || [],
      fixVersions: data.fields.fixVersions || [],
    };

    console.log(`Successfully fetched JIRA issue: ${issueKey}`);
    return issue;
  } catch (error) {
    console.error(`Error fetching JIRA issue ${issueKey}:`, error);
    return null;
  }
}

// Interface for JIRA issue type
interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
  description?: string;
}

// Get available issue types for a project to discover correct subtask type
export async function getJiraProjectIssueTypes(
  projectKey: string
): Promise<JiraIssueType[] | null> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping issue types query");
    return null;
  }

  try {
    // Use the correct API endpoint from JIRA Cloud documentation
    const url = `${config.baseUrl}/rest/api/2/issue/createmeta/${projectKey}/issuetypes`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    console.log(
      `[JIRA] Fetching issue types for project: ${projectKey} from ${url}`
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[JIRA] Failed to fetch issue types. Status: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error(`[JIRA] Error details:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[JIRA] Issue types response:`, JSON.stringify(data, null, 2));

    // The new endpoint returns issue types directly in the response
    if (data.values && Array.isArray(data.values)) {
      console.log(
        `[JIRA] Available issue types for ${projectKey}:`,
        data.values.map((t: JiraIssueType) => ({
          name: t.name,
          subtask: t.subtask,
        }))
      );
      return data.values;
    } else if (Array.isArray(data)) {
      // Fallback if data is directly an array
      console.log(
        `[JIRA] Available issue types for ${projectKey}:`,
        data.map((t: JiraIssueType) => ({ name: t.name, subtask: t.subtask }))
      );
      return data;
    }

    console.warn(`[JIRA] Unexpected response format for issue types:`, data);
    return [];
  } catch (error) {
    console.error(`Error fetching JIRA issue types for ${projectKey}:`, error);
    return null;
  }
}

// Create JIRA subtask
export async function createJiraSubtask(
  parentIssueKey: string,
  subtaskData: {
    summary: string;
    description: string;
    priority: string;
    labels: string[];
    usabilityPercentage: number;
    reporterEmail?: string;
    reporterName?: string;
    attachments?: string[]; // Base64 encoded files with metadata
  }
): Promise<{
  issueKey: string;
  issueUrl: string;
  attachments?: string[];
} | null> {
  const config = getJiraConfig();
  if (!config) {
    console.error(
      "JIRA not configured - environment variables missing or invalid:"
    );
    console.error("Required: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN");
    console.error("Current status:", {
      JIRA_BASE_URL: !!process.env.JIRA_BASE_URL,
      JIRA_EMAIL: !!process.env.JIRA_EMAIL,
      JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
    });
    return null;
  }

  try {
    // First, get available issue types to find the correct subtask type
    console.log(`[JIRA] Discovering issue types for project ISCCC...`);
    const issueTypes = await getJiraProjectIssueTypes("ISCCC");

    let subtaskIssueType = null;
    if (issueTypes) {
      // Find the subtask issue type
      subtaskIssueType = issueTypes.find((type) => type.subtask === true);
      console.log(
        `[JIRA] Found subtask issue types:`,
        issueTypes.filter((type) => type.subtask)
      );

      if (subtaskIssueType) {
        console.log(
          `[JIRA] Using subtask issue type: ${subtaskIssueType.name} (id: ${subtaskIssueType.id})`
        );
      } else {
        console.error(`[JIRA] No subtask issue types found in project ISCCC`);
        console.log(
          `[JIRA] Available issue types:`,
          issueTypes.map((t) => ({ name: t.name, subtask: t.subtask }))
        );
      }
    }

    // If we couldn't find a subtask type, try common names as fallback
    if (!subtaskIssueType) {
      console.warn(
        `[JIRA] Could not discover subtask type, trying fallback names...`
      );
      const fallbackNames = ["Sub-task", "Subtask", "SubTask", "sub-task"];

      // Try to use the first common name
      subtaskIssueType = {
        name: fallbackNames[0],
        id: "",
        subtask: true,
      };
      console.log(
        `[JIRA] Using fallback subtask issue type: ${subtaskIssueType.name}`
      );
    }

    const url = `${config.baseUrl}/rest/api/2/issue`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    // Enhanced description with usability percentage
    const enhancedDescription = `${subtaskData.description}

--- Usability Metrics ---
Usability Percentage: ${subtaskData.usabilityPercentage}%

--- Reported by ---
User: ${subtaskData.reporterName || "Unknown"}
Email: ${subtaskData.reporterEmail || "Unknown"}`;

    const issuePayload = {
      fields: {
        project: {
          key: "ISCCC", // Your project key
        },
        parent: {
          key: parentIssueKey,
        },
        summary: subtaskData.summary,
        description: enhancedDescription,
        issuetype: {
          name: subtaskIssueType.name,
        },
        priority: {
          name: subtaskData.priority,
        },
        labels: [...subtaskData.labels, "feedback", "usability-feedback"],
        // Note: Custom fields removed as they are not available on subtask create screen
        // Usability percentage is tracked in the description instead
      },
    };

    console.log(`[JIRA] Creating subtask for parent: ${parentIssueKey}`);
    console.log(`[JIRA] Request URL: ${url}`);
    console.log(`[JIRA] Payload:`, JSON.stringify(issuePayload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      body: JSON.stringify(issuePayload),
      cache: "no-store",
    });

    console.log(
      `[JIRA] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[JIRA] Failed to create subtask. Status: ${response.status}`
      );
      console.error(`[JIRA] Error response:`, errorText);

      // Try to parse error response for more details
      try {
        const errorData = JSON.parse(errorText);
        console.error(`[JIRA] Parsed error:`, errorData);

        // If issue type error, suggest using project discovery
        if (errorData.errors && errorData.errors.issuetype) {
          console.error(
            `[JIRA] Issue type error detected. Used type: "${subtaskIssueType.name}"`
          );
          console.error(
            `[JIRA] Consider checking available issue types via JIRA admin or project settings.`
          );
        }
      } catch {
        console.error(`[JIRA] Could not parse error response as JSON`);
      }

      return null;
    }

    const data = await response.json();
    console.log(`Successfully created JIRA subtask: ${data.key}`);

    // Handle attachments if provided
    const attachmentResults: string[] = [];
    if (subtaskData.attachments && subtaskData.attachments.length > 0) {
      console.log(
        `[JIRA Subtask] Processing ${subtaskData.attachments.length} attachment(s)...`
      );

      for (const attachmentStr of subtaskData.attachments) {
        try {
          const attachment = JSON.parse(attachmentStr);
          const { fileName, mimeType, content } = attachment;

          // Convert base64 to binary data
          const binaryData = Buffer.from(content, "base64");

          // Create form data for attachment
          const formData = new FormData();
          const blob = new Blob([binaryData], { type: mimeType });
          formData.append("file", blob, fileName);

          const attachUrl = `${config.baseUrl}/rest/api/2/issue/${data.key}/attachments`;

          const attachResponse = await fetch(attachUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "X-Atlassian-Token": "no-check",
              "User-Agent": "ISC-Code-Connect-UI/1.0",
            },
            body: formData,
          });

          if (attachResponse.ok) {
            const attachResult = await attachResponse.json();
            attachmentResults.push(attachResult[0]?.filename || fileName);
            console.log(
              `[JIRA Subtask] Successfully uploaded attachment: ${fileName}`
            );
          } else {
            console.error(
              `[JIRA Subtask] Failed to upload attachment ${fileName}: ${attachResponse.status} ${attachResponse.statusText}`
            );
          }
        } catch (attachError) {
          console.error(
            `[JIRA Subtask] Error processing attachment:`,
            attachError
          );
        }
      }
    }

    return {
      issueKey: data.key,
      issueUrl: `${config.baseUrl}/browse/${data.key}`,
      attachments: attachmentResults.length > 0 ? attachmentResults : undefined,
    };
  } catch (error) {
    console.error(`Error creating JIRA subtask:`, error);
    return null;
  }
}

// Update existing subtask with additional feedback
export async function updateJiraSubtask(
  subtaskKey: string,
  additionalFeedback: string,
  usabilityPercentage?: number
): Promise<boolean> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping subtask update");
    return false;
  }

  try {
    // First add comment with additional feedback
    const commentResult = await addJiraIssueComment(
      subtaskKey,
      `Additional Feedback:\n${additionalFeedback}${usabilityPercentage ? `\n\nUpdated Usability Percentage: ${usabilityPercentage}%` : ""}`
    );

    if (!commentResult) {
      console.error("Failed to add comment to subtask");
      return false;
    }

    console.log(`Successfully updated JIRA subtask: ${subtaskKey}`);
    return true;
  } catch (error) {
    console.error(`Error updating JIRA subtask ${subtaskKey}:`, error);
    return false;
  }
}

// Search for existing subtasks related to a message/chat
export async function findExistingSubtasks(
  chatId: string,
  messageId: string
): Promise<JiraIssue[]> {
  const config = getJiraConfig();
  if (!config) {
    console.warn("JIRA not configured, skipping subtask search");
    return [];
  }

  try {
    const jql = `project = ISCCC AND issuetype = "Sub-task" AND description ~ "${chatId}" OR description ~ "${messageId}"`;
    const url = `${config.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}`;

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      "base64"
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check",
        "User-Agent": "ISC-Code-Connect-UI/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Failed to search JIRA subtasks: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (
      data.issues?.map(
        (issue: {
          key: string;
          id: string;
          fields: {
            summary: string;
            description: string;
            status: {
              name: string;
              statusCategory: { key: string; name: string };
            };
            parent?: { key: string };
            created: string;
            updated: string;
            project: { key: string; name: string };
            issuetype: { name: string; iconUrl?: string };
            labels: string[];
            components: Array<{ name: string }>;
            fixVersions: Array<{ name: string }>;
          };
        }) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: {
            name: issue.fields.status?.name || "Unknown",
            statusCategory: {
              key: issue.fields.status?.statusCategory?.key || "unknown",
              name: issue.fields.status?.statusCategory?.name || "Unknown",
            },
          },
          created: issue.fields.created,
          updated: issue.fields.updated,
          project: issue.fields.project,
          issuetype: issue.fields.issuetype,
          labels: issue.fields.labels || [],
          components: issue.fields.components || [],
          fixVersions: issue.fields.fixVersions || [],
        })
      ) || []
    );
  } catch (error) {
    console.error("Error searching for existing subtasks:", error);
    return [];
  }
}

// Format JIRA issue for AI context
export function formatJiraIssueForAI(issue: JiraIssue): string {
  const sections = [
    `${issue.key}: ${issue.summary}`,
    `Status: ${issue.status.name} | Type: ${issue.issuetype.name}`,
  ];

  if (issue.priority) {
    sections.push(`Priority: ${issue.priority.name}`);
  }

  if (issue.description) {
    // More aggressive truncation for context efficiency
    const maxDescLength = 200;
    const truncatedDesc =
      issue.description.length > maxDescLength
        ? issue.description.substring(0, maxDescLength) + "..."
        : issue.description;
    sections.push(`Description: ${truncatedDesc}`);
  }

  return sections.join(" | ");
}

// Format multiple JIRA issues for AI context
export function formatJiraIssuesForAI(issues: JiraIssue[]): string {
  if (issues.length === 0) {
    return "";
  }

  const issueTexts = issues.map((issue) => formatJiraIssueForAI(issue));
  return issueTexts.join("\n");
}

// Enhanced PR interface with JIRA data
export interface EnhancedPRWithJira {
  // ... existing PR properties
  jiraIssues?: JiraIssue[];
  jiraReferences?: JiraIssueReference[];
}
