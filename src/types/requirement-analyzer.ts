import { ProcessingMetrics } from "@/types/metrics";

/**
 * Model for supporting document
 */
export interface SupportingDocument {
  /** Content of the supporting document */
  content: string;
  /** Name of the supporting document (optional) */
  name?: string;
}

/**
 * Model for requirement analysis requests
 */
export interface RequirementAnalysisRequest {
  /** The requirement text to analyze */
  requirement: string;
  /** List of supporting documents */
  supporting_docs: SupportingDocument[];
  /** User information including name and session_id */
  user_info?: {
    name?: string;
    session_id?: string;
  };
  /** Selected model for analysis */
  selected_model?: string;
}

/**
 * Model for analysis tasks
 */
export interface AnalysisTask {
  /** Unique identifier for this task */
  task_id: number;
  /** Short descriptive title for the task */
  title: string;
  /** Description of what needs to be done */
  description: string;
  /** List of files that need to be modified */
  affected_files: string[];
  /** Implementation details including RAG-optimized prompt */
  implementation_details: string;
  /** References to related documentation or code */
  references: string[];
  /** Estimated complexity level (Low, Medium, High) */
  estimated_complexity: string;
}

/**
 * Model for analysis results
 */
export interface AnalysisResult {
  /** A concise summary of the requirement */
  requirement_summary: string;
  /** List of key features or components */
  key_components: string[];
  /** List of developer tasks */
  tasks: AnalysisTask[];
  /** Information we still don't have */
  missing_information: string[];
  /** Assumptions made in the analysis */
  assumptions: string[];
}

/**
 * Model for requirement analysis responses
 */
export interface RequirementAnalysisResponse {
  /** The comprehensive analysis result */
  analysis: AnalysisResult;
  /** Processing metrics */
  metrics?: ProcessingMetrics;
}

/**
 * Model for progress updates during streaming
 */
export interface ProgressUpdate {
  /** The current step identifier */
  step: string;
  /** Human-readable description of the step */
  description: string;
  /** Number from 0-100 indicating completion percentage */
  progress_percentage: number;
  /** Optional object with step-specific details */
  details?: Record<string, unknown>;
}

/**
 * Progress details for initial analysis completion
 */
export interface InitialAnalysisDetails {
  requirement_summary: string;
  key_components: string[];
  potential_code_areas?: string[];
  initial_queries?: Array<{
    collection: string;
    query: string;
  }>;
}

/**
 * Progress details for context evaluation
 */
export interface ContextEvaluationDetails {
  is_sufficient: boolean;
  reasoning: string;
  missing_information: string[];
  next_retrievals?: Array<{
    collection: string;
    query: string;
  }>;
  context_size?: number;
  iteration?: number;
  max_iterations?: number;
}

/**
 * Progress details for task generation
 */
export interface TaskGenerationDetails {
  task_count: number;
  task_preview: Array<{
    task_id: number;
    title: string;
  }>;
}
