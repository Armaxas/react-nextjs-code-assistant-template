"use client";

import React, { useState, useRef } from "react";
import { Paperclip, X, Code, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileAttachment } from "@/types/types";
import { generateUUID } from "@/lib/utils";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import useColorScheme from "@/hooks/use-color-scheme";
import { useTheme } from "next-themes";

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

// Constants for file limitations
const MAX_FILES = 3;
const MAX_FILE_SIZE = 50 * 1024; // 30KB per file - reasonable for code files
const FILE_SIZE_DISPLAY = "50KB";

export const FileAttachmentComponent = ({
  attachedFiles,
  setAttachedFiles,
  onFileContentRead,
  setError,
  instanceId = "default", // Added instanceId prop with default value
}: {
  attachedFiles: FileAttachment[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  onFileContentRead: (files: FileAttachment[]) => void;
  setError: React.Dispatch<React.SetStateAction<string>>;
  instanceId?: string; // Optional prop to ensure unique keys
}) => {
  const systemColorScheme = useColorScheme();
  const { theme } = useTheme();
  let colorScheme = theme;
  if (theme === "system") {
    colorScheme = systemColorScheme;
  }
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile] = useState<FileAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Generate a stable ID for this component instance
  const componentId = useRef(`attach-${generateUUID()}`).current;
  // Create a predictable dialog ID
  const dialogId = `file-preview-dialog-${instanceId}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check if adding new files would exceed the limit
    if (attachedFiles.length + selectedFiles.length > MAX_FILES) {
      setError(`You can only attach up to ${MAX_FILES} files at a time.`);
      return;
    }

    // Process each file
    const newFiles: FileAttachment[] = [];
    let hasErrors = false;

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `File "${file.name}" exceeds the ${FILE_SIZE_DISPLAY} size limit.`
        );
        hasErrors = true;
        continue; // Skip to the next file without processing this one
      }

      try {
        const content = await readFileContent(file);
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
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
      const updatedFiles = [...attachedFiles, ...newFiles];
      setAttachedFiles(updatedFiles);
      // Pass content to parent component
      onFileContentRead(updatedFiles);
    }

    // Clear the file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Auto-clear error after 5 seconds if there were no errors
    if (!hasErrors) {
      setTimeout(() => {
        setError(""); // Clear error after 5 seconds if no new errors occurred
      }, 5000);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

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

  const handleAttachClick = (e: React.MouseEvent) => {
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();

    // Check if we've reached the file limit
    if (attachedFiles.length >= MAX_FILES) {
      setError(`You can only attach up to ${MAX_FILES} files at a time.`);
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <React.Fragment key={componentId}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
        accept=".cls,.trigger,.apex,.js,.html,.css,.xml,.json,.txt"
      />

      {/* Attachment button with counter when files are attached */}
      <div className="relative">
        <Button
          type="button" // Explicitly set button type to prevent form submission
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full relative"
          onClick={handleAttachClick}
          title={`Attach code file (${attachedFiles.length}/${MAX_FILES})`}
        >
          <Paperclip className="h-5 w-5 text-gray-400 hover:text-gray-300" />

          {/* File counter badge */}
          {attachedFiles.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {attachedFiles.length}
            </span>
          )}
        </Button>
      </div>

      {/* File preview dialog - IMPORTANT: key update to use unique IDs */}
      {previewOpen && previewFile && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen} key={dialogId}>
          <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {previewFile.name} - {previewFile.type}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-grow">
              <SyntaxHighlighter
                language={previewFile.language || "plaintext"}
                style={colorScheme === "dark" ? vscDarkPlus : oneLight}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  padding: "1rem",
                }}
              >
                {previewFile.content || ""}
              </SyntaxHighlighter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </React.Fragment>
  );
};

// This component displays attached files above the input and error messages
export const AttachedFilesDisplay = ({
  attachedFiles,
  setAttachedFiles,
  onFileContentRead,
  error,
  setError,
  instanceId = "default", // Added instanceId prop with default value
}: {
  attachedFiles: FileAttachment[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  onFileContentRead: (files: FileAttachment[]) => void;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  instanceId?: string; // Optional prop to ensure unique keys
}) => {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Generate a stable ID for this component instance
  const componentId = useRef(`display-${generateUUID()}`).current;
  // Create a predictable dialog ID
  const dialogId = `file-display-dialog-${instanceId}`;

  const removeFile = (fileId: string, e: React.MouseEvent) => {
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();

    const updatedFiles = attachedFiles.filter((file) => file.id !== fileId);
    setAttachedFiles(updatedFiles);
    onFileContentRead(updatedFiles);
  };

  const openPreview = (file: FileAttachment, e: React.MouseEvent) => {
    // Prevent form submission
    e.preventDefault();
    e.stopPropagation();

    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // If no files and no error, don't render anything
  if (attachedFiles.length === 0 && !error) return null;

  return (
    <div className="px-4 py-3 bg-[#141414] rounded-lg" key={componentId}>
      {/* Error message if present */}
      {error && (
        <Alert
          variant="destructive"
          className="mb-3 bg-red-950/30 border-red-800 text-red-300 relative"
        >
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 absolute top-2 right-2 text-red-400 hover:text-red-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setError("");
            }}
            type="button"
            aria-label="Close error message"
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      )}

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <React.Fragment>
          <div className="text-xs text-gray-400 mb-2">
            Attached files ({attachedFiles.length}/{MAX_FILES}):
          </div>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div
                key={`file-${file.id}`}
                className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A1A2E] border border-gray-800/50 text-sm"
              >
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-gray-300 hover:text-white"
                  onClick={(e) => openPreview(file, e)}
                  type="button"
                >
                  {file.name}
                  <span className="ml-1.5 text-xs text-gray-500">
                    {file.type}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => removeFile(file.id, e)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}

      {/* File preview dialog - IMPORTANT: key update to use unique IDs */}
      {previewOpen && previewFile && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen} key={dialogId}>
          <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {previewFile.name} - {previewFile.type}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-grow">
              <SyntaxHighlighter
                language={previewFile.language || "plaintext"}
                style={vscDarkPlus}
                showLineNumbers={true}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  padding: "1rem",
                }}
              >
                {previewFile.content || ""}
              </SyntaxHighlighter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
