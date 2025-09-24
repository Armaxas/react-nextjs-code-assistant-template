"use client";

import React, { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  File,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  FileCode,
  Database,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileInfo {
  file: File;
  id: string;
  preview?: string;
}

interface FileUploadZoneProps {
  onFilesChange: (files: FileInfo[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

export function FileUploadZone({
  onFilesChange,
  acceptedTypes = [".txt", ".log", ".json", ".xml", ".csv"],
  maxFiles = 10,
  maxFileSize = 10,
  disabled = false,
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "log":
        return <Bug className="h-5 w-5 text-red-500" />;
      case "json":
        return <Database className="h-5 w-5 text-blue-500" />;
      case "xml":
        return <FileCode className="h-5 w-5 text-green-500" />;
      case "csv":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "txt":
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = useCallback(
    (file: File): string[] => {
      const errors: string[] = [];

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`File "${file.name}" exceeds ${maxFileSize}MB limit`);
      }

      // Check file type
      const extension = "." + file.name.toLowerCase().split(".").pop();
      if (!acceptedTypes.includes(extension)) {
        errors.push(`File type "${extension}" is not supported`);
      }

      return errors;
    },
    [acceptedTypes, maxFileSize]
  );

  const readFilePreview = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        // Show first 200 characters as preview
        resolve(text.substring(0, 200) + (text.length > 200 ? "..." : ""));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFiles = useCallback(
    async (fileList: File[]) => {
      const newErrors: string[] = [];
      const validFiles: FileInfo[] = [];

      // Check total file count
      if (files.length + fileList.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        setErrors(newErrors);
        return;
      }

      for (const file of fileList) {
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
          newErrors.push(...fileErrors);
          continue;
        }

        // Check for duplicates
        if (
          files.some(
            (f) => f.file.name === file.name && f.file.size === file.size
          )
        ) {
          newErrors.push(`File "${file.name}" is already uploaded`);
          continue;
        }

        try {
          const preview = await readFilePreview(file);
          validFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview,
          });
        } catch {
          newErrors.push(`Failed to read file "${file.name}"`);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        if (validFiles.length === 0) return;
      } else {
        setErrors([]);
      }

      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} file(s) uploaded successfully`);
      }
    },
    [files, maxFiles, validateFile, onFilesChange]
  );

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    toast.success("File removed");
  };

  const clearAllFiles = () => {
    setFiles([]);
    onFilesChange([]);
    setErrors([]);
    toast.success("All files cleared");
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    },
    [disabled, processFiles]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200",
          isDragOver && !disabled && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-primary/50 cursor-pointer"
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragOver && !disabled
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <Upload className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold mb-2">
            {isDragOver && !disabled ? "Drop files here" : "Upload Log Files"}
          </h3>

          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Drag and drop your log files here, or click to browse. Supported
            formats: {acceptedTypes.join(", ")}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <File className="h-4 w-4 mr-2" />
              Browse Files
            </Button>

            {files.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFiles}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Maximum {maxFiles} files, {maxFileSize}MB each
            </p>
            <p>
              {files.length} of {maxFiles} files uploaded
            </p>
          </div>

          <input
            id="file-input"
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={onFileInputChange}
            className="hidden"
            disabled={disabled}
            aria-label="Upload log files"
          />
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Uploaded Files ({files.length})
            </h4>
            <Badge variant="outline">
              {formatFileSize(
                files.reduce((total, f) => total + f.file.size, 0)
              )}{" "}
              total
            </Badge>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileInfo) => (
              <Card key={fileInfo.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getFileIcon(fileInfo.file.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {fileInfo.file.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(fileInfo.file.size)}
                        </Badge>
                      </div>
                      {fileInfo.preview && (
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed bg-muted p-2 rounded mt-2">
                          {fileInfo.preview}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileInfo.id)}
                    disabled={disabled}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
