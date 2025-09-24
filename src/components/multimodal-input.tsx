"use client";

import React from "react";
import cx from "classnames";
import {
  useId, // Add useId import
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { useModels } from "@/hooks/use-models";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileAttachment, Message } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitHubBrowser } from "./GitHubBrowser";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { generateUUID } from "@/lib/utils";

import {
  Paperclip,
  StopCircle as StopCircleIcon,
  FileText,
  X,
  Code,
  Github,
  ArrowUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define ONLY Salesforce-specific file types
enum SalesforceFileType {
  APEX_CLASS = "Apex Class",
  APEX_TRIGGER = "Apex Trigger",
  APEX_TEST = "Apex Test Class",
  LWC_JS = "LWC JavaScript",
  LWC_HTML = "LWC HTML",
  LWC_XML = "LWC Configuration",
  LWC_CSS = "LWC CSS",
  LWC_TEST = "LWC Jest Test",
  SOQL = "SOQL Query",
  TEXT = "Text",
}

// File extension to language mapping for syntax highlighting
const fileExtensionMap: Record<string, { language: string; type: string }> = {
  // Apex
  cls: { language: "apex", type: "Apex Class" },
  trigger: { language: "apex", type: "Apex Trigger" },
  apex: { language: "apex", type: "Apex Code" },

  // Apex Test
  testcls: { language: "apex", type: "Apex Test Class" },
  apextest: { language: "apex", type: "Apex Test" },

  // LWC
  html: { language: "html", type: "LWC HTML" },
  js: { language: "javascript", type: "LWC JavaScript" },
  css: { language: "css", type: "LWC CSS" },
  xml: { language: "xml", type: "LWC Configuration" },

  // Other
  json: { language: "json", type: "JSON" },
  txt: { language: "plaintext", type: "Text" },
};

// Maximum number of attachments allowed
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 50 * 1024; // 50KB
const FILE_SIZE_DISPLAY = "50KB";

// Define the props type for PureMultimodalInput
interface PureMultimodalInputProps {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Message[];
  handleSubmit: (event?: {
    preventDefault: () => void;
    files: FileAttachment[];
    cleanedInput: string;
    selectedModel?: string; // Add selectedModel to handleSubmit signature
  }) => void;
  className?: string;
  selectedModel?: string; // Add selectedModel prop
  setSelectedModel?: (model: string) => void; // Add setSelectedModel prop
}

interface MultimodalInputRef {
  processDroppedFiles: (files: File[]) => Promise<void>;
  setInput: (value: string) => void;
}

const PureMultimodalInput = forwardRef<
  MultimodalInputRef,
  PureMultimodalInputProps
>(
  (
    {
      chatId,
      input,
      setInput,
      isLoading,
      stop,
      handleSubmit,
      className,
      messages,
      selectedModel: selectedModelProp,
      setSelectedModel: setSelectedModelProp,
    },
    ref
  ) => {
    const fileInputId = useId(); // Generate stable ID using useId
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { width } = useWindowSize();
    // Single source of truth for attachments
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [error, setError] = useState("");
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    // Add GitHub browser state
    const [isGitHubBrowserOpen, setIsGitHubBrowserOpen] = useState(false);
    // Add a ref for the file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get available models from configuration
    const { modelOptions, defaultModel } = useModels();

    // Use props for model selection if provided, otherwise fall back to local state
    const [localSelectedModel, setLocalSelectedModel] = useState(defaultModel);
    const selectedModel = selectedModelProp ?? localSelectedModel;
    const setSelectedModel = setSelectedModelProp ?? setLocalSelectedModel;

    // Update local model when default model changes
    useEffect(() => {
      if (
        !selectedModelProp &&
        defaultModel &&
        localSelectedModel !== defaultModel
      ) {
        setLocalSelectedModel(defaultModel);
      }
    }, [defaultModel, selectedModelProp, localSelectedModel]);

    // Set to track file names for duplicate detection (case insensitive)
    const fileNamesRef = useRef(new Set<string>());

    // Standard error message for consistency
    const getMaxAttachmentsMessage = () => {
      return `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
    };

    // Reset the file names set whenever attachments change
    useEffect(() => {
      // Update the fileNamesRef when attachments change
      fileNamesRef.current = new Set(
        attachments.map((file) => file.name.toLowerCase())
      );
    }, [attachments]);

    useEffect(() => {
      if (textareaRef.current) {
        adjustHeight();
      }
    }, []);

    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";

        // Use the same min/max constraints as handleInput
        const minHeight = 45;
        const maxHeight = 300;

        // Calculate new height based on content, constrained between min and max
        const newHeight = Math.min(
          Math.max(textareaRef.current.scrollHeight, minHeight),
          maxHeight
        );

        textareaRef.current.style.height = `${newHeight}px`;
      }
    };
    const resetHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = "60px";
      }
    };

    const [localStorageInput, setLocalStorageInput] = useLocalStorage(
      "input",
      ""
    );

    useEffect(() => {
      if (textareaRef.current) {
        const domValue = textareaRef.current.value;
        // Prefer DOM value over localStorage to handle hydration
        const finalValue = domValue ?? localStorageInput ?? "";
        setInput(finalValue);
        adjustHeight();
      }
      // Only run once after hydration
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    // Handle paste event to detect code blocks in real-time
    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Get the clipboard text
      const clipboardText = event.clipboardData.getData("text");

      // Only process if the clipboard text is substantial and looks like code
      if (clipboardText.length > 300 && isLikelySalesforceCode(clipboardText)) {
        // Check if adding another attachment would exceed the maximum limit
        if (attachments.length >= MAX_ATTACHMENTS) {
          event.preventDefault(); // Prevent default to avoid partial paste
          setError(getMaxAttachmentsMessage());
          return;
        }

        // Prevent default paste behavior
        event.preventDefault();

        // Get current input and cursor position
        const currentInput = input;
        const cursorPos = textareaRef.current?.selectionStart ?? 0;

        // Create a file attachment for the code
        const { language, fileType } = detectSalesforceLanguage(clipboardText);
        const fileAttachment = createSalesforceCodeAttachment(
          language,
          fileType,
          clipboardText
        );

        // Add the file attachment
        setAttachments((prev) => [...prev, fileAttachment]);
        setError(""); // Clear any error message

        // Insert the clipboard text at cursor position (for non-code)
        const newInput =
          currentInput.substring(0, cursorPos) +
          currentInput.substring(cursorPos);

        // Update the input
        setInput(newInput);

        // Focus and adjust height
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(cursorPos, cursorPos);
            adjustHeight();
          }
        }, 0);
      }
    };

    // Function to check if text is likely Salesforce code
    const isLikelySalesforceCode = (text: string): boolean => {
      // Count indented lines and lines with Salesforce code-like syntax
      const lines = text.split("\n");
      let codePatternCount = 0;
      let hasSalesforcePatterns = false;

      for (const line of lines) {
        // Check for Salesforce-specific patterns first to quickly validate
        if (
          /\b(Apex|Salesforce|SObject|@isTest|@AuraEnabled|@api|LightningElement|Account|Contact|Opportunity|Lead|trigger)\b/.test(
            line
          )
        ) {
          hasSalesforcePatterns = true;
        }

        if (
          /^\s{2,}/.test(line) || // Indentation
          /[{}();]/.test(line) || // Code symbols
          // Salesforce-specific patterns
          /\b(class|trigger|@isTest|@AuraEnabled|@api|@track|@wire|public|private|global|static|with sharing|without sharing)\b/.test(
            line
          ) ||
          /\bSystem\.\w+/.test(line) || // System class methods
          /\bApex[A-Z]\w+/.test(line) || // Apex classes
          /\bSObject\b/.test(line) || // SObject references
          /\b(Account|Contact|Opportunity|Case|Lead)\b/.test(line) || // Standard objects
          /\bLightningElement\b/.test(line) || // LWC base class
          /\bimport\s+{[^}]+}\s+from\s+['"]lightning\/\w+['"]/.test(line) || // LWC imports
          /=/.test(line) || // Assignments
          /\/\/|\/\*|\*\/|\*/.test(line) // Comments
        ) {
          codePatternCount++;
        }
      }

      // If more than 30% of non-empty lines look like code, consider it code
      const nonEmptyLines = lines.filter((l) => l.trim().length > 0).length;
      const ratio = nonEmptyLines > 0 ? codePatternCount / nonEmptyLines : 0;

      // Must have at least some Salesforce-specific patterns to be considered Salesforce code
      return hasSalesforcePatterns && ratio > 0.3 && nonEmptyLines > 5;
    };

    // Helper function to detect Salesforce-specific language and file type
    const detectSalesforceLanguage = (
      code: string
    ): { language: string; fileType: SalesforceFileType } => {
      // Check for Apex Test Class
      if (
        /@isTest|@testSetup|@testVisible|Test\.startTest\(|Test\.stopTest\(/.test(
          code
        )
      ) {
        return {
          language: "apex",
          fileType: SalesforceFileType.APEX_TEST,
        };
      }

      // Check for Apex Trigger
      if (/trigger\s+\w+\s+on\s+\w+/.test(code)) {
        return {
          language: "apex",
          fileType: SalesforceFileType.APEX_TRIGGER,
        };
      }

      // Check for Apex Class
      if (
        /(@AuraEnabled|System\.|Database\.|public\s+class|private\s+class|global\s+class|with\s+sharing|without\s+sharing)/.test(
          code
        )
      ) {
        return {
          language: "apex",
          fileType: SalesforceFileType.APEX_CLASS,
        };
      }

      // Check for LWC JavaScript
      if (
        /(import\s+{[^}]+}\s+from\s+|@api\s+|@track\s+|@wire\s+|connectedCallback\(\)|disconnectedCallback\(\)|extends\s+LightningElement)/.test(
          code
        )
      ) {
        return {
          language: "javascript",
          fileType: SalesforceFileType.LWC_JS,
        };
      }

      // Check for LWC HTML
      if (/<template>|<lightning-|<c-/.test(code)) {
        return {
          language: "html",
          fileType: SalesforceFileType.LWC_HTML,
        };
      }

      // Check for LWC XML
      if (
        /<\?xml|<LightningComponentBundle|<targetConfigs|<targets>/.test(code)
      ) {
        return {
          language: "xml",
          fileType: SalesforceFileType.LWC_XML,
        };
      }

      // Check for LWC CSS
      if (/(:host|\.slds-|\.THIS)/.test(code)) {
        return {
          language: "css",
          fileType: SalesforceFileType.LWC_CSS,
        };
      }

      // Check for LWC Tests
      if (
        /(describe\(|it\(|beforeEach\(|afterEach\(|jest\.fn\(\)|createElement\(|expect\()/.test(
          code
        )
      ) {
        return {
          language: "javascript",
          fileType: SalesforceFileType.LWC_TEST,
        };
      }

      // Check for SOQL
      if (/SELECT\s+.+\s+FROM\s+\w+/.test(code)) {
        return {
          language: "soql",
          fileType: SalesforceFileType.SOQL,
        };
      }

      // Default to Apex Class if we detect any Salesforce patterns but can't determine the specific type
      if (
        /\b(Apex|Salesforce|SObject|Account|Contact|Opportunity|Lead)\b/.test(
          code
        )
      ) {
        return {
          language: "apex",
          fileType: SalesforceFileType.APEX_CLASS,
        };
      }

      // If nothing else matches, categorize as Text
      return {
        language: "plaintext",
        fileType: SalesforceFileType.TEXT,
      };
    };

    // Helper function to create a Salesforce code attachment
    const createSalesforceCodeAttachment = (
      language: string,
      fileType: SalesforceFileType,
      content: string
    ): FileAttachment => {
      const fileExtension = getSalesforceFileExtension(language, fileType);
      const timestamp = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return {
        id: `code_${Math.random().toString(36).substring(2, 9)}`,
        name: `code_${timestamp}${fileExtension}`,
        content,
        type: fileType,
        language,
        extension: fileExtension.substring(1), // Remove the leading dot
      };
    };

    // Helper function to get file extension based on Salesforce file type
    const getSalesforceFileExtension = (
      language: string,
      fileType: SalesforceFileType
    ): string => {
      switch (fileType) {
        case SalesforceFileType.APEX_CLASS:
        case SalesforceFileType.APEX_TEST:
          return ".cls";
        case SalesforceFileType.APEX_TRIGGER:
          return ".trigger";
        case SalesforceFileType.LWC_JS:
          return ".js";
        case SalesforceFileType.LWC_HTML:
          return ".html";
        case SalesforceFileType.LWC_XML:
          return ".xml";
        case SalesforceFileType.LWC_CSS:
          return ".css";
        case SalesforceFileType.LWC_TEST:
          return ".test.js";
        case SalesforceFileType.SOQL:
          return ".soql";
        default:
          return ".txt";
      }
    };

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);

      // Enhanced height adjustment with min/max constraints
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // Reset height to auto for proper calculation

        // Set a minimum height to prevent jumping when text is deleted
        const minHeight = 45;
        // Set a maximum height to prevent excessive growth
        const maxHeight = 300;

        // Calculate new height based on content, constrained between min and max
        const newHeight = Math.min(
          Math.max(textareaRef.current.scrollHeight, minHeight),
          maxHeight
        );

        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    // Handle files read from the FileAttachmentComponent
    const onFileContentRead = (files: FileAttachment[]) => {
      if (!files || files.length === 0) return;

      // Important: We need to completely replace attachments here, not add to them
      // This prevents the duplication issue with the FileAttachmentComponent
      setAttachments(files);

      // Check if we are over the limit
      if (files.length > MAX_ATTACHMENTS) {
        setError(getMaxAttachmentsMessage());
      } else {
        setError("");
      }
    };

    // Process dropped files
    const processDroppedFiles = async (files: File[]) => {
      if (!files || files.length === 0) return;

      // Check if adding new files would exceed the limit
      if (attachments.length + files.length > MAX_ATTACHMENTS) {
        setError(
          `You can only attach up to ${MAX_ATTACHMENTS} files at a time.`
        );
        return;
      }

      // Process each file
      const newFiles: FileAttachment[] = [];
      let hasErrors = false;

      for (const file of files) {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          setError(
            `File "${file.name}" exceeds the ${FILE_SIZE_DISPLAY} size limit.`
          );
          hasErrors = true;
          continue; // Skip to the next file without processing this one
        }

        // Check for duplicate file names
        if (fileNamesRef.current.has(file.name.toLowerCase())) {
          setError(`File "${file.name}" is already attached.`);
          hasErrors = true;
          continue;
        }

        try {
          const content = await readFileContent(file);
          const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
          const fileType = detectFileType(file.name, content, extension);

          newFiles.push({
            id: generateUUID(),
            name: file.name,
            content,
            type: fileType.type,
            language: fileType.language,
            extension,
          });
        } catch (err) {
          console.error("Error reading file:", err);
          setError(`Failed to read ${file.name}. Please try again.`);
          hasErrors = true;
        }
      }

      // Only add new files if there are any valid ones
      if (newFiles.length > 0) {
        const updatedFiles = [...attachments, ...newFiles];
        setAttachments(updatedFiles);
        // Pass content to parent component
        onFileContentRead(updatedFiles);
      }

      // Auto-clear error after 5 seconds if there were no errors
      if (!hasErrors) {
        setTimeout(() => {
          setError(""); // Clear error after 5 seconds if no new errors occurred
        }, 5000);
      }
    };

    // Handle GitHub file selection
    const handleGitHubFileSelect = (
      files: import("@/types/files").FileAttachment[]
    ) => {
      // Convert files from GitHubBrowser format to multimodal-input format
      const convertedFiles: FileAttachment[] = files.map((file) => ({
        id: file.id,
        name: file.name,
        content: file.content,
        type: file.type,
        language: file.language || "text", // Provide default language
        extension: file.extension || "",
      }));

      // Check if adding new files would exceed the limit
      if (attachments.length + convertedFiles.length > MAX_ATTACHMENTS) {
        setError(
          `You can only attach up to ${MAX_ATTACHMENTS} files at a time.`
        );
        return;
      }

      // Check for duplicate file names
      const newFiles = convertedFiles.filter((file) => {
        if (fileNamesRef.current.has(file.name.toLowerCase())) {
          return false;
        }
        return true;
      });

      if (newFiles.length !== convertedFiles.length) {
        setError("Some files were skipped because they were already attached.");
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...attachments, ...newFiles];
        setAttachments(updatedFiles);
        // Update the fileNamesRef
        fileNamesRef.current = new Set(
          updatedFiles.map((file) => file.name.toLowerCase())
        );
        // Pass content to parent component
        onFileContentRead(updatedFiles);
      }

      setError("");
    };

    // Read file content as text
    const readFileContent = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error(`Error reading file: ${file.name}`));
          }
        };
        reader.onerror = () =>
          reject(new Error(`Error reading file: ${file.name}`));
        reader.readAsText(file);
      });
    };

    // Detect file type based on extension and content
    const detectFileType = (
      fileName: string,
      content: string,
      extension: string
    ) => {
      // First check by extension
      if (fileExtensionMap[extension]) {
        return fileExtensionMap[extension];
      }

      // If extension isn't recognized, try to detect by content
      if (
        content.includes("@isTest") ||
        content.includes("testMethod") ||
        fileName.includes("Test")
      ) {
        return { language: "apex", type: "Apex Test" };
      } else if (content.includes("trigger") && content.includes("on")) {
        return { language: "apex", type: "Apex Trigger" };
      } else if (content.includes("class") && content.includes("extends")) {
        return { language: "apex", type: "Apex Class" };
      } else if (content.includes("<template>") || content.includes("lwc")) {
        return { language: "html", type: "LWC HTML" };
      } else if (
        content.includes("import") &&
        content.includes("LightningElement")
      ) {
        return { language: "javascript", type: "LWC JavaScript" };
      }

      // Default to plaintext if no detection worked
      return { language: "plaintext", type: "Unknown" };
    };

    const submitForm = useCallback(
      (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        // Don't submit if there's nothing to submit (no text and no files)
        if (!input.trim() && attachments.length === 0) {
          return;
        }

        window.history.replaceState({ id: chatId }, "", `/chat/${chatId}`);

        // Clear error message on submission
        setError("");

        // Call handleSubmit with all files
        const submitEvent = {
          preventDefault: () => {},
          files: attachments,
          cleanedInput: input, // Use the current input
          selectedModel: selectedModel, // Pass the selected model
        };

        handleSubmit(submitEvent);

        // Clear files after submission
        setAttachments([]);
        setLocalStorageInput("");
        resetHeight();

        if (width && width > 768) {
          textareaRef.current?.focus();
        }
      },
      [
        attachments,
        handleSubmit,
        setLocalStorageInput,
        width,
        chatId,
        input,
        selectedModel,
      ]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (isLoading) {
          setError("Please wait for the model to finish its response!");
        } else {
          submitForm();
        }
      }
    };

    useImperativeHandle(ref, () => ({
      processDroppedFiles: async (files: File[]) => {
        return await processDroppedFiles(files);
      },
      setInput: (value: string) => {
        setInput(value);
        textareaRef.current?.focus();
      },
    }));

    const isSubmitDisabled =
      (input.trim() === "" && attachments.length === 0) || isLoading;

    return (
      <>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitForm();
          }}
          className={cx("space-y-2 w-full", className, {
            "bg-card backdrop-blur-sm rounded-xl shadow-lg p-4 opacity-100 visible":
              messages.length === 0,
          })}
        >
          <div
            className={cx(
              "relative flex flex-col w-full overflow-hidden grow bg-card border rounded-xl",
              error
                ? "border-destructive"
                : messages.length === 0
                  ? "border-primary"
                  : "border-border/50",
              `max-h-[300px] min-h-[60px] mb-2`
            )}
          >
            {/* Attachments display */}
            {attachments.length > 0 && (
              <div className="p-3 border-b border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  Attached files ({attachments.length}/{MAX_ATTACHMENTS}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <div
                      key={`file-${file.id}`}
                      className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-background/50 border border-border text-sm shadow-sm"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {file.name}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {file.type}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-1 ml-1 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewFile(file);
                          setPreviewOpen(true);
                        }}
                        type="button"
                        aria-label={`View ${file.name}`}
                      >
                        <Code className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const updatedAttachments = attachments.filter(
                            (att) => att.id !== file.id
                          );
                          setAttachments(updatedAttachments);
                          fileNamesRef.current = new Set(
                            updatedAttachments.map((f) => f.name.toLowerCase())
                          );
                          if (
                            updatedAttachments.length === 0 &&
                            fileInputRef.current
                          ) {
                            fileInputRef.current.value = "";
                          }
                          setError("");
                        }}
                        type="button"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              tabIndex={0}
              rows={1}
              value={input}
              onInput={handleInput}
              placeholder="How can I help you today?"
              spellCheck={false}
              className="flex-1 w-full px-5 py-4 resize-none bg-transparent focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-none placeholder-gray-400 text-foreground min-h-[60px] max-h-[300px] custom-scrollbar text-[16px] border-none !border-none !ring-0 !outline-none"
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label
                        htmlFor={fileInputId} // Use the new stable ID
                        className={cx(
                          "cursor-pointer p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                          attachments.length >= MAX_ATTACHMENTS || isLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        )}
                        onClick={(e) => {
                          // Prevent default label action as we're manually triggering the click
                          e.preventDefault();
                          if (
                            attachments.length >= MAX_ATTACHMENTS ||
                            isLoading
                          ) {
                            setError(getMaxAttachmentsMessage());
                          } else {
                            setError(""); // Clear any previous error
                            fileInputRef.current?.click(); // Programmatically click the hidden file input
                          }
                        }}
                      >
                        <Paperclip className="w-5 h-5" />
                        <span className="sr-only">Attach files</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Attach files (max {MAX_ATTACHMENTS}, {FILE_SIZE_DISPLAY}{" "}
                        each)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cx(
                          "p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                          attachments.length >= MAX_ATTACHMENTS || isLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            attachments.length >= MAX_ATTACHMENTS ||
                            isLoading
                          ) {
                            setError(getMaxAttachmentsMessage());
                          } else {
                            setError(""); // Clear any previous error
                            setIsGitHubBrowserOpen(true);
                          }
                        }}
                      >
                        <Github className="w-5 h-5" />
                        <span className="sr-only">GitHub files</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach GitHub files (max {MAX_ATTACHMENTS})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Select
                  value={selectedModel}
                  onValueChange={(value) => setSelectedModel(value)}
                >
                  <SelectTrigger className="w-[160px] h-9 text-sm border-0 focus:ring-0 focus:ring-offset-0 text-muted-foreground hover:text-foreground transition-colors">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modelOptions.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {isLoading ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={stop}
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                          aria-label="Stop generation"
                        >
                          <StopCircleIcon className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Stop generation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          disabled={isSubmitDisabled}
                          size="icon"
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 w-10 h-10 shadow-md transition-transform duration-200 hover:scale-105"
                          aria-label="Send message"
                        >
                          <ArrowUp className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send message</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            id={fileInputId} // Use the new stable ID
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processDroppedFiles(Array.from(e.target.files));
              }
            }}
            multiple
            accept=".cls,.trigger,.apex,.js,.html,.css,.xml,.json,.txt"
          />
          {error && <p className="text-xs text-destructive px-1">{error}</p>}
        </form>
        {previewOpen && previewFile && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-hidden flex flex-col border-0">
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold">{previewFile?.name}</span>
                    {previewFile?.type && (
                      <span className="text-xs text-muted-foreground">
                        {previewFile.type} -{" "}
                        {previewFile?.language || "plaintext"}
                      </span>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-auto flex-grow bg-background">
                <SyntaxHighlighter
                  language={previewFile?.language || "plaintext"}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0",
                    padding: "1rem",
                    backgroundColor: "transparent",
                    fontSize: "0.9rem",
                  }}
                >
                  {previewFile?.content || ""}
                </SyntaxHighlighter>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* GitHub Repository Browser */}
        <GitHubBrowser
          isOpen={isGitHubBrowserOpen}
          onClose={() => setIsGitHubBrowserOpen(false)}
          onFileSelect={handleGitHubFileSelect}
          selectedFiles={attachments}
          maxFiles={MAX_ATTACHMENTS}
        />
      </>
    );
  }
);

PureMultimodalInput.displayName = "PureMultimodalInput";

// Define the props type for MultimodalInput
interface MultimodalInputProps {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Message[];
  handleSubmit: (event?: {
    preventDefault: () => void;
    files: FileAttachment[];
    cleanedInput: string;
  }) => void;
  className?: string;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

// Export the forwardRef component correctly with proper types
export const MultimodalInput = forwardRef<
  MultimodalInputRef,
  MultimodalInputProps
>(function MultimodalInput(props, ref) {
  return <PureMultimodalInput {...props} ref={ref} />;
});
MultimodalInput.displayName = "MultimodalInput";
