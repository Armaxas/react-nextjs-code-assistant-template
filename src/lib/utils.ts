import { Message, FileAttachment } from "@/types/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data."
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatUserName(str: string): string {
  return str.replace(/ /g, "_").toLowerCase();
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === "user");
  return userMessages.at(-1);
}

export function convertToUIMessages(messages: Array<Message>): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    let textContent = "";
    const extractedFiles: FileAttachment[] = [];

    if (typeof message.content === "string") {
      textContent = message.content;

      // Extract files for user messages
      if (message.role === "user" && !message.files) {
        // Check for code block attachments first (new format)
        const codeAttachmentRegex = /\[Attached Code: ([^\]]+)\]/g;
        let codeMatch;
        const codeRefs: { ref: string; fileName: string }[] = [];

        // Find all code attachment references
        while ((codeMatch = codeAttachmentRegex.exec(textContent)) !== null) {
          codeRefs.push({
            ref: codeMatch[0],
            fileName: codeMatch[1],
          });
        }

        // Process traditional file references
        // Look for all instances of "Attached [FileType] ([FileName]):"
        const fileHeaderRegex = /Attached ([^(]+) \(([^)]+)\):/g;
        let headerMatch;
        const startIndices: number[] = [];

        // Find all file headers and their positions
        while ((headerMatch = fileHeaderRegex.exec(textContent)) !== null) {
          startIndices.push(headerMatch.index);
        }

        // If we found file headers
        if (startIndices.length > 0) {
          // Reset the regex to start from the beginning again
          fileHeaderRegex.lastIndex = 0;

          // Add the end of the string as a boundary for the last file
          startIndices.push(textContent.length);

          // Process each file section
          for (let i = 0; i < startIndices.length - 1; i++) {
            const currentStart = startIndices[i];
            const nextStart = startIndices[i + 1];

            // Extract the section for this file
            const fileSection = textContent.substring(currentStart, nextStart);

            // Extract file type and name
            const fileMatch = fileSection.match(
              /Attached ([^(]+) \(([^)]+)\):/
            );
            if (fileMatch) {
              const fileType = fileMatch[1]; // e.g., "Apex Class"
              const fileName = fileMatch[2]; // e.g., "IncentiveDefinitionUtil.cls"
              const extension = fileName.split(".").pop() || "";

              // Find the code block within this file section
              const codeBlockRegex = /```(\w+)?\n([\s\S]+?)\n```/;
              const codeMatch = fileSection.match(codeBlockRegex);

              if (codeMatch) {
                const language =
                  codeMatch[1] || getLanguageFromExtension(extension);
                const content = codeMatch[2];

                // Create a file attachment
                extractedFiles.push({
                  id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 11)}`,
                  name: fileName,
                  type: fileType,
                  language,
                  extension,
                  content,
                });
              }
            }
          }

          // Clean up the text content by removing all file references and code blocks
          // Remove file headers
          textContent = textContent.replace(/Attached [^(]+ \([^)]+\):/g, "");

          // Remove code blocks
          textContent = textContent.replace(/```\w*\n[\s\S]+?\n```/g, "");

          // Clean up any extra newlines and whitespace
          textContent = textContent.replace(/\n{3,}/g, "\n\n").trim();
        }

        // If we have code attachment references (new format), create file objects for them
        if (codeRefs.length > 0) {
          codeRefs.forEach((ref) => {
            const extension = ref.fileName.split(".").pop() || "txt";
            const language = getLanguageFromExtension(extension);

            // Since we don't have the actual code content here (it was part of the input),
            // we'll create a placeholder indicating this was an extracted code block
            extractedFiles.push({
              id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              name: ref.fileName,
              type: getFileTypeFromExtension(extension),
              language,
              extension,
              content:
                "[This content was originally a large code block in the message]",
            });

            // Remove the reference from the text content
            textContent = textContent.replace(ref.ref, "");
          });

          // Clean up any extra newlines and whitespace
          textContent = textContent.replace(/\n{3,}/g, "\n\n").trim();
        }
      }
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text;
        }
      }
    }

    // Use existing files if available, otherwise use extracted files
    const messageFiles =
      message.files || (extractedFiles.length > 0 ? extractedFiles : undefined);

    // Create UI message with files
    chatMessages.push({
      id: message.id,
      role: message.role,
      content: textContent,
      files: messageFiles,
      createdAt: message.createdAt,
      model: message.model, // Preserve model field for assistant messages
    });

    return chatMessages;
  }, []);
}

// Helper function for determining language from extension
function getLanguageFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    cls: "apex",
    trigger: "apex",
    apex: "apex",
    js: "javascript",
    ts: "typescript",
    html: "html",
    css: "css",
    json: "json",
    xml: "xml",
    py: "python",
    java: "java",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    go: "go",
    rs: "rust",
    kt: "kotlin",
    swift: "swift",
    sql: "sql",
    sh: "bash",
    txt: "plaintext",
  };

  return extensionMap[extension.toLowerCase()] || "plaintext";
}

// Helper function for determining file type from extension
function getFileTypeFromExtension(extension: string): string {
  const typeMap: Record<string, string> = {
    cls: "Apex Class",
    trigger: "Apex Trigger",
    apex: "Apex Code",
    js: "JavaScript",
    ts: "TypeScript",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    xml: "XML",
    py: "Python",
    java: "Java",
    cs: "C#",
    rb: "Ruby",
    php: "PHP",
    go: "Go",
    rs: "Rust",
    kt: "Kotlin",
    swift: "Swift",
    sql: "SQL",
    sh: "Shell Script",
    txt: "Text File",
  };

  return typeMap[extension.toLowerCase()] || "Code File";
}
