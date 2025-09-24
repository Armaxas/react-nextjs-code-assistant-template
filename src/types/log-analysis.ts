// Types for Log Analysis feature

export interface AttachedDocument {
  name: string;
  content: string;
  type: "code" | "text" | "log" | "config";
  language?: string;
}

export interface LogAnalysisRequest {
  query: string;
  log_message: string;
  sf_connection_id: string;
  attached_documents?: AttachedDocument[];
  github_token?: string;
  github_org?: string;
  github_repo?: string;
  selected_model?: string;
}

export interface LogAnalysisProgressMessage {
  step: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface LogAnalysisResponse {
  success: boolean;
  analysis_summary: {
    error_type: string;
    severity: string;
    affected_components: {
      files: string[];
      classes: string[];
      objects: string[];
    };
    root_cause: string;
    confidence_score: number;
  };
  error_details: {
    category: string;
    message: string;
    stack_trace: string[];
    line_numbers: number[];
  };
  solution: {
    immediate_fixes: string[];
    code_changes: string[];
    configuration_changes: string[];
    testing_steps: string[];
    prevention_measures: string[];
  };
  code_examples: Array<{
    source: string;
    example: string;
    metadata: {
      file_path?: string;
      description?: string;
      [key: string]: unknown;
    };
  }>;
  slack_formatted: {
    summary: string;
    immediate_fixes: string;
    code_changes: string;
    full_analysis_available: boolean;
  };
  additional_resources: string[];
  processing_metadata: {
    tools_used: string[];
    processing_time: number;
    context_sources: {
      vector_search: boolean;
      salesforce_metadata: boolean;
      attached_documents: boolean;
    };
  };
  error?: {
    message: string;
    timestamp: string;
    node?: string;
  };
}

export interface LogAnalysisStreamChunk {
  type: "progress" | "result" | "error";
  content: string;
  done: boolean;
  response?: LogAnalysisResponse;
  details?: LogAnalysisProgressMessage;
}

export interface GitHubSettings {
  token: string;
  repository: string;
  branch: string;
  isConnected: boolean;
}

export interface ModelSettings {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

export interface LogAnalysisState {
  isAnalyzing: boolean;
  progressMessages: LogAnalysisProgressMessage[];
  result: LogAnalysisResponse | null;
  error: string | null;
}
