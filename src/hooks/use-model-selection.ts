"use client";

import { useCallback } from "react";
import useLocalStorage from "@/hooks/use-local-storage";
import { useModels } from "@/hooks/use-models";

interface UseModelSelectionOptions {
  storageKey: string;
  defaultModel?: string;
}

export function useModelSelection({
  storageKey,
  defaultModel,
}: UseModelSelectionOptions) {
  const { modelOptions, isLoading } = useModels();
  const [storedModel, setStoredModel] = useLocalStorage<string>(storageKey, "");

  // Get the effective default model
  const getDefaultModel = useCallback(() => {
    if (defaultModel) return defaultModel;
    if (modelOptions.length > 0) return modelOptions[0].value;
    return "";
  }, [defaultModel, modelOptions]);

  // Get the current selected model
  const selectedModel = storedModel || getDefaultModel();

  // Update the selected model
  const setSelectedModel = useCallback(
    (model: string) => {
      setStoredModel(model);
    },
    [setStoredModel]
  );

  // Reset to default model
  const resetToDefault = useCallback(() => {
    const defaultModelValue = getDefaultModel();
    setStoredModel(defaultModelValue);
  }, [getDefaultModel, setStoredModel]);

  return {
    selectedModel,
    setSelectedModel,
    resetToDefault,
    modelOptions,
    isLoading,
    hasModels: modelOptions.length > 0,
  };
}

export default useModelSelection;
