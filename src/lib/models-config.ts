/**
 * Models Configuration
 * ====================
 * Centralized configuration for available AI models.
 * Models are read from environment variables AVAILABLE_MODELS or MODEL_LIST.
 * Falls back to defaults if not configured.
 */

export interface ModelOption {
  value: string;
  label: string;
  provider?: string;
}

/**
 * Default models if environment variable is not set
 */
const DEFAULT_MODELS = [
  "ibm/granite-3-3-8b-instruct",
  "ibm/granite-3-2-8b-instruct",
  "meta-llama/llama-3-3-70b-instruct",
  "mistralai/mistral-large",
  "openai/gpt-oss-120b",
];

/**
 * Default model for new sessions
 */
const DEFAULT_SELECTED_MODEL = "ibm/granite-3-3-8b-instruct";

/**
 * Parse models from environment variable or use defaults
 */
function parseModelsFromEnv(): string[] {
  // Check if we're in browser environment
  if (typeof window !== "undefined") {
    // In browser, we can't access process.env directly for security reasons
    // The models should be passed from server-side or API
    return DEFAULT_MODELS;
  }

  // On server-side, read from environment
  const envModels = process.env.AVAILABLE_MODELS || process.env.MODEL_LIST;

  if (envModels) {
    try {
      // Support both comma-separated and JSON array formats
      if (envModels.startsWith("[")) {
        return JSON.parse(envModels);
      } else {
        return envModels
          .split(",")
          .map((model) => model.trim())
          .filter(Boolean);
      }
    } catch (error) {
      console.warn(
        "Failed to parse AVAILABLE_MODELS/MODEL_LIST from environment, using defaults:",
        error
      );
      return DEFAULT_MODELS;
    }
  }

  return DEFAULT_MODELS;
}

/**
 * Get the default selected model
 */
function getDefaultModel(): string {
  if (typeof window !== "undefined") {
    return DEFAULT_SELECTED_MODEL;
  }

  return process.env.DEFAULT_MODEL || DEFAULT_SELECTED_MODEL;
}

/**
 * Convert model strings to model options with labels
 */
function createModelOptions(models: string[]): ModelOption[] {
  return models.map((model) => ({
    value: model,
    label: model,
    provider: model.split("/")[0], // Extract provider from model name
  }));
}

/**
 * Get available models as strings
 */
export function getAvailableModels(): string[] {
  return parseModelsFromEnv();
}

/**
 * Get available models as options for UI components
 */
export function getModelOptions(): ModelOption[] {
  const models = getAvailableModels();
  return createModelOptions(models);
}

/**
 * Get the default model for new sessions
 */
export function getDefaultSelectedModel(): string {
  return getDefaultModel();
}

/**
 * Check if a model is available
 */
export function isModelAvailable(model: string): boolean {
  const availableModels = getAvailableModels();
  return availableModels.includes(model);
}

/**
 * Get a fallback model if the provided model is not available
 */
export function getFallbackModel(preferredModel?: string): string {
  if (preferredModel && isModelAvailable(preferredModel)) {
    return preferredModel;
  }

  const defaultModel = getDefaultSelectedModel();
  if (isModelAvailable(defaultModel)) {
    return defaultModel;
  }

  // If even the default model is not available, return the first available model
  const availableModels = getAvailableModels();
  return availableModels.length > 0
    ? availableModels[0]
    : DEFAULT_SELECTED_MODEL;
}

/**
 * Get the default model for server-side usage (API routes)
 */
export function getServerDefaultModel(): string {
  return process.env.DEFAULT_MODEL || DEFAULT_SELECTED_MODEL;
}

/**
 * Get available models for server-side usage (API routes)
 */
export function getServerAvailableModels(): string[] {
  const envModels = process.env.AVAILABLE_MODELS || process.env.MODEL_LIST;

  if (envModels) {
    try {
      // Support both comma-separated and JSON array formats
      if (envModels.startsWith("[")) {
        return JSON.parse(envModels);
      } else {
        return envModels
          .split(",")
          .map((model) => model.trim())
          .filter(Boolean);
      }
    } catch (error) {
      console.warn(
        "Failed to parse AVAILABLE_MODELS/MODEL_LIST from environment, using defaults:",
        error
      );
      return DEFAULT_MODELS;
    }
  }

  return DEFAULT_MODELS;
}

/**
 * API function to get models (for use in API routes)
 */
export async function getModelsForAPI(): Promise<{
  models: string[];
  defaultModel: string;
}> {
  return {
    models: getServerAvailableModels(),
    defaultModel: getServerDefaultModel(),
  };
}
