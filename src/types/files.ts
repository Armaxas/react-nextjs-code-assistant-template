export interface FileAttachment {
  id: string;
  name: string;
  type: string; // e.g., 'file', 'image'
  content: string; // Can be file content, data URL, etc.
  language?: string; // Programming language if applicable
  path?: string; // Optional: path of the file in the repository
  repo?: string; // Optional: repository full name
  html_url?: string; // Optional: URL to the file on GitHub
  extension?: string; // Optional: file extension
}
