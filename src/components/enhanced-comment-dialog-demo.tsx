"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useEnhancedDialog } from "@/hooks/use-comment-dialog-enhanced";
import { toast } from "sonner";

export default function EnhancedCommentDialogDemo() {
  const { openDialog } = useEnhancedDialog();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string[]>([]);

  const handleFeedback = (type: "upvote" | "downvote") => {
    const title = type === "upvote" ? "Upvote Response" : "Downvote Response";
    const description =
      type === "upvote"
        ? "We're glad this response was helpful! Please let us know what worked well."
        : "We're sorry this response wasn't helpful. Please help us improve by providing details about the issues.";

    openDialog({
      title,
      description,
      chatId: "demo-chat-id",
      messageId: `demo-message-${type}-${Date.now()}`,
      onSubmit: (
        comments: string,
        rating: number,
        jiraIssue?: {
          key: string;
          url: string;
          type: "issue" | "subtask";
          parentKey?: string;
        }
      ) => {
        console.log("Feedback submitted:", { comments, rating, jiraIssue });

        // Add to submitted feedback list
        const feedbackId = `${type}-${Date.now()}`;
        setFeedbackSubmitted((prev) => [...prev, feedbackId]);

        // Show success message
        let message = `Thank you for your ${type} feedback! (Rating: ${rating}%)`;
        if (jiraIssue) {
          message += ` A Jira issue (${jiraIssue.key}) has been created to track this problem.`;
        }

        toast.success(message);
      },
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Enhanced Comment Dialog Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This demo showcases the enhanced comment dialog with improved UI/UX
          and Jira integration for downvotes. Try both upvote and downvote
          actions to see the different features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upvote Demo */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <ThumbsUp className="h-5 w-5" />
              Positive Feedback
            </CardTitle>
            <CardDescription>
              Test the upvote dialog with improved rating system and better UI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The upvote dialog includes:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                <li>Clean, modern UI with visual feedback indicators</li>
                <li>Enhanced rating slider with color-coded badges</li>
                <li>Better layout and spacing</li>
                <li>Improved keyboard navigation</li>
              </ul>
              <Button
                onClick={() => handleFeedback("upvote")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Test Upvote Dialog
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Downvote Demo */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ThumbsDown className="h-5 w-5" />
              Negative Feedback with Jira
            </CardTitle>
            <CardDescription>
              Test the downvote dialog with integrated Jira issue creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The downvote dialog includes all upvote features plus:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                <li>Optional Jira issue creation checkbox</li>
                <li>
                  Comprehensive issue form (summary, description, priority)
                </li>
                <li>Label management system</li>
                <li>File attachment support</li>
                <li>Automatic user context integration</li>
                <li>Real-time issue creation with success feedback</li>
              </ul>
              <Button
                onClick={() => handleFeedback("downvote")}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Test Downvote Dialog with Jira
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Enhancements</CardTitle>
          <CardDescription>
            Summary of improvements made to the comment dialog system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">UI/UX Improvements</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Responsive design with proper spacing</li>
                <li>• Visual feedback with icons and color coding</li>
                <li>• Better form layout and organization</li>
                <li>• Enhanced accessibility and keyboard navigation</li>
                <li>• Professional card-based layout</li>
                <li>• Clear visual hierarchy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Jira Integration Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Conditional Jira option for downvotes only</li>
                <li>• Comprehensive issue creation form</li>
                <li>• Automatic user context (email/name)</li>
                <li>• Priority and label management</li>
                <li>• File attachment support</li>
                <li>• Real-time creation with success feedback</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback History */}
      {feedbackSubmitted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback Submissions</CardTitle>
            <CardDescription>
              Feedback submitted during this demo session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>
                {feedbackSubmitted.length} feedback item(s) submitted this
                session.
              </p>
              <p className="mt-2">
                Check the browser console for detailed submission data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
