export function detectLanguageAndType(fileName: string): {
  language: string;
  type: string;
  extension: string;
} {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  let language = "plaintext";
  const type = "file"; // Assuming all are files for now, adjust if needed

  switch (extension) {
    case "js":
      language = "javascript";
      break;
    case "ts":
      language = "typescript";
      break;
    case "py":
      language = "python";
      break;
    case "java":
      language = "java";
      break;
    case "html":
      language = "html";
      break;
    case "css":
      language = "css";
      break;
    case "json":
      language = "json";
      break;
    case "md":
      language = "markdown";
      break;
    case "cls":
      language = "apex";
      break; // Example for Salesforce Apex
    case "trigger":
      language = "apex";
      break; // Example for Salesforce Apex Triggers
    // Add more cases as needed
  }
  return { language, type, extension };
}
