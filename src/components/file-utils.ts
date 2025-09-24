import { FileAttachment } from "@/types/types";

// Function to format file content for sending to the API
export function formatFilesForMessage(files: FileAttachment[]) {
  if (!files || files.length === 0) return null;

  return files.map((file) => ({
    name: file.name,
    content: file.content,
    type: file.type,
    language: file.language,
  }));
}

// Function to create a formatted message about attached files
export function createFileAttachmentMessage(files: FileAttachment[]) {
  if (!files || files.length === 0) return "";

  const fileList = files
    .map((file) => `${file.name} (${file.type})`)
    .join(", ");
  return `Attached ${files.length === 1 ? "file" : "files"}: ${fileList}`;
}

// Function to format file info for display in message bubbles if needed
export function formatFileInfoForDisplay(file: FileAttachment) {
  return {
    name: file.name,
    type: file.type,
    language: file.language,
    // You might want to truncate or format content for display
    contentPreview:
      file.content.length > 100
        ? `${file.content.substring(0, 100)}...`
        : file.content,
  };
}

interface FileResponse {
  files?: Array<{
    name: string;
    type?: string;
    content?: string;
    language?: string;
  }>;
}

// Parse API responses that might contain file information
export function parseFileInfoFromResponse(response: FileResponse) {
  if (!response || !response.files) return null;

  return response.files.map((file) => ({
    name: file.name,
    type: file.type || "Unknown",
    content: file.content || "",
    language: file.language || "plaintext",
  }));
}
