import { useState, useEffect } from "react";
import {
  getAvailableModels,
  getDefaultSelectedModel,
  type ModelOption,
  getModelOptions,
} from "@/lib/models-config";

interface ModelsConfig {
  models: string[];
  modelOptions: ModelOption[];
  defaultModel: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get available models from the API or environment
 */
export function useModels(): ModelsConfig {
  const [config, setConfig] = useState<ModelsConfig>(() => ({
    models: getAvailableModels(),
    modelOptions: getModelOptions(),
    defaultModel: getDefaultSelectedModel(),
    isLoading: true,
    error: null,
  }));

  useEffect(() => {
    let mounted = true;

    async function fetchModels() {
      try {
        const response = await fetch("/api/models");
        const result = await response.json();

        if (!mounted) return;

        if (result.success && result.data) {
          const { models, defaultModel } = result.data;
          const modelOptions = models.map((model: string) => ({
            value: model,
            label: model,
            provider: model.split("/")[0],
          }));

          setConfig({
            models,
            modelOptions,
            defaultModel,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error(result.error || "Failed to fetch models");
        }
      } catch (error) {
        console.warn("Failed to fetch models from API, using defaults:", error);

        if (!mounted) return;

        // Fallback to client-side defaults
        setConfig({
          models: getAvailableModels(),
          modelOptions: getModelOptions(),
          defaultModel: getDefaultSelectedModel(),
          isLoading: false,
          error: null, // Don't show error for fallback
        });
      }
    }

    fetchModels();

    return () => {
      mounted = false;
    };
  }, []);

  return config;
}

/**
 * Hook to get a specific model with fallback
 */
export function useModel(preferredModel?: string): string {
  const { models, defaultModel, isLoading } = useModels();

  if (isLoading) {
    return defaultModel;
  }

  if (preferredModel && models.includes(preferredModel)) {
    return preferredModel;
  }

  return defaultModel;
}
