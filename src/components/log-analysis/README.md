# Log Analysis Feature

## Overview

The Log Analysis feature provides AI-powered debugging insights for Salesforce errors. It combines error logs, code context, and GitHub integration to deliver comprehensive solutions and prevention strategies.

## Components

### 1. LogAnalysisInterface

Main interface component that orchestrates the entire log analysis workflow.

**Props:**

- `connectionData: SalesforceConnection` - Active Salesforce connection
- `onDisconnect: () => void` - Callback for disconnection

### 2. FileUploadZone

Drag-and-drop interface for uploading log files and code context.

**Features:**

- Support for multiple file types (.txt, .log, .json, .xml, .csv)
- File validation and preview
- Drag-and-drop functionality
- File size and count limits

### 3. LogAnalysisProgress

Real-time progress display during analysis streaming.

**Features:**

- Step-by-step progress tracking
- Icon-coded status indicators
- Scrollable timeline view
- Real-time updates via SSE

### 4. LogAnalysisResult

Comprehensive display of AI analysis results.

**Features:**

- Tabbed interface (Overview, Solution, Prevention, Slack Format)
- Error categorization and severity assessment
- Solution steps and prevention tips
- Copy-to-clipboard functionality
- Download report feature

### 5. GitHubConfiguration

GitHub integration setup for enhanced context retrieval.

**Features:**

- Personal Access Token management
- Repository and branch configuration
- Connection validation
- Security-focused design (local storage only)

### 6. ModelSelector

AI model configuration and parameter tuning.

**Features:**

- Multiple model options (GPT-4o, Claude 3.5, Gemini 1.5)
- Parameter adjustment (temperature, max tokens)
- Model comparison interface
- Streaming toggle

## Usage

### Basic Setup

```tsx
import { LogAnalysisInterface } from "@/components/log-analysis/LogAnalysisInterface";

function MyLogAnalysisPage() {
  const [connectionData, setConnectionData] =
    useState<SalesforceConnection | null>(null);

  return (
    <LogAnalysisInterface
      connectionData={connectionData}
      onDisconnect={() => setConnectionData(null)}
    />
  );
}
```

### Individual Components

```tsx
import { FileUploadZone } from "@/components/log-analysis/FileUploadZone";
import { GitHubConfiguration } from "@/components/log-analysis/GitHubConfiguration";
import { ModelSelector } from "@/components/log-analysis/ModelSelector";

function MyCustomInterface() {
  const [files, setFiles] = useState([]);
  const [githubSettings, setGithubSettings] = useState({
    token: "",
    repository: "",
    branch: "main",
    isConnected: false,
  });
  const [modelSettings, setModelSettings] = useState({
    selectedModel: "gpt-4o",
    temperature: 0.1,
    maxTokens: 4000,
    streaming: true,
  });

  return (
    <div>
      <FileUploadZone onFilesChange={setFiles} />
      <GitHubConfiguration
        onSettingsChange={setGithubSettings}
        initialSettings={githubSettings}
      />
      <ModelSelector
        onSettingsChange={setModelSettings}
        initialSettings={modelSettings}
      />
    </div>
  );
}
```

## API Integration

The components integrate with a streaming API endpoint for real-time analysis:

**Endpoint:** `POST /api/logs/analyze/stream`

**Request Format:**

```json
{
  "query": "User query describing the issue",
  "log_message": "Complete error log or stack trace",
  "sf_connection_id": "salesforce-connection-id",
  "attached_documents": [...],
  "github_token": "optional-github-token",
  "github_org": "optional-github-org",
  "github_repo": "optional-github-repo",
  "selected_model": "gpt-4o"
}
```

**Response Format (SSE):**

```
data: {"type": "progress", "content": "Step message", "details": {...}}
data: {"type": "result", "response": {...}}
data: {"type": "error", "content": "Error message"}
```

## Features

### AI-Powered Analysis

- Error categorization and severity assessment
- Root cause identification
- Step-by-step solution guidance
- Prevention strategy recommendations
- Confidence scoring

### GitHub Integration

- Automatic code context retrieval
- Related documentation discovery
- Similar issue pattern matching
- Commit history analysis

### Salesforce Integration

- Organization metadata access
- SOQL query context
- Apex class and trigger analysis
- Custom object relationship mapping

### Real-Time Streaming

- Live progress updates
- Cancellable operations
- Error handling and recovery
- Performance optimization

### Rich UI/UX

- Tabbed interface organization
- Copy-to-clipboard utilities
- Download report functionality
- Responsive design
- Dark mode support

## Security Considerations

- GitHub tokens stored locally only
- No sensitive data transmitted to external services
- Salesforce credentials managed through OAuth
- Client-side validation and sanitization

## Accessibility

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management

## Performance

- Lazy loading of components
- Optimized file uploads
- Streaming response handling
- Memory-efficient rendering
- Error boundary protection
