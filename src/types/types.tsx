type JSONObject = {
  [key: string]: JSONValue;
};
type JSONArray = JSONValue[];

type JSONValue = null | string | number | boolean | JSONObject | JSONArray;

// Add the FileAttachment interface
export interface FileAttachment {
  id: string;
  name: string;
  content: string;
  type: string;
  language: string;
  extension: string;
}

export interface Message {
  /**
  A unique identifier for the message.
     */
  id?: string;
  /**
  The timestamp of the message.
     */
  createdAt?: Date;
  /**
  Text content of the message.
     */
  content: string | Array<{ type: string; text: string }>;
  /**
   * Additional attachments to be sent along with the message.
   */
  role: "system" | "user" | "assistant" | "data";
  /**
   * Message type to distinguish between progress, content, and code
   */
  type?: "progress" | "content" | "code";
  /**
   * ID of the user message that this message (usually progress) is related to
   */
  relatedToQuery?: string;
  data?: JSONValue;
  /**
   * Additional message-specific information added on the server via StreamData
   */
  annotations?: JSONValue[] | undefined;
  /* chatId for database */
  chatId?: string;
  /**
   * For progress messages: detailed information about the step
   * Contains description and response fields
   */
  details?: {
    description?: string; // Title/description for the expanded view
    response?: string; // Detailed output from the step
  };
  /**
   * For code messages: code-specific metadata
   */
  codeMetadata?: {
    language?: string; // Programming language (e.g., 'javascript', 'python')
    filename?: string; // Optional filename
    codeType?: string; // Type of code (e.g., 'snippet', 'function', 'class')
    metadata?: Record<string, string | number | boolean>; // Additional metadata
    description?: string; // Description of the code
  };
  /**
   * File attachments for the message
   */
  files?: FileAttachment[];
  /**
   * Model used to generate this message (for assistant messages)
   */
  model?: string;
  /**
   * User information for the message author
   */
  author?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  /**
   * Metadata for the message (like analysis information)
   */
  metadata?: {
    analysis?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface ChatType {
  id: string;
  chatId: string;
  createdAt: Date;
  lastModifiedAt: Date;
  title: string;
  userId: string;
  visibility: "public" | "private" | "shared";
  sharedWith?: Array<{
    userId: string;
    name: string;
    email: string;
    addedAt: Date;
  }>;
  ownerName?: string; // <- optional because only shared chats need it
}

export type NewChat = () => Promise<string>;

export type PrintChat = () => void;

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
  issueKey: string;
  issueId: string;
  issueUrl: string;
  summary: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  labels?: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
  }>;
  createdDate?: Date;
  comments?: JiraComment[];
  // New fields for subtask support
  issueType?: string;
  parentIssue?: string; // Parent issue key for subtasks
  subtasks?: string[]; // Array of subtask keys
  usabilityPercentage?: number;
}

export interface JiraSubtaskData {
  parentTaskKey: string;
  parentTaskSummary?: string;
  parentTaskDescription?: string;
  parentTaskStatus?: string;
  summary: string;
  description: string;
  priority: string;
  labels: string[];
  attachments: File[];
  usabilityPercentage: number;
  additionalDetails?: string;
}

export interface FeedbackSubtaskOption {
  action: "create_new" | "add_to_existing";
  parentTaskKey?: string;
  existingSubtaskKey?: string;
}

export interface Vote {
  chatId: string;
  messageId: string;
  comments: string;
  isUpvoted: boolean;
  hasJiraIssue?: boolean;
  jiraIssue?: JiraIssue;
  // Enhanced for subtask support
  feedbackType?: "upvote" | "downvote";
  usabilityPercentage?: number;
  // Track the creation mode for JIRA integration
  jiraCreationType?: "feedback" | "issue" | "subtask";
  // Feedback category for better classification
  category?: string;
}
