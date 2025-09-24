"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  AlertTriangle,
  Send,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Zap,
  StarIcon,
  Sparkles,
  CheckCircle,
  Mail,
  Globe,
  Monitor,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface FeedbackFormData {
  feedbackType:
    | "bug_report"
    | "feature_request"
    | "improvement_suggestion"
    | "general_feedback"
    | "usability_issue";
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  rating?: number;
  contactInfo?: {
    email: string;
    preferredContact: boolean;
  };
}

const feedbackTypes = [
  {
    value: "bug_report",
    label: "Bug Report",
    icon: Bug,
    description: "Report a bug or issue you've encountered",
    color: "bg-red-500",
  },
  {
    value: "feature_request",
    label: "Feature Request",
    icon: Lightbulb,
    description: "Suggest a new feature or enhancement",
    color: "bg-blue-500",
  },
  {
    value: "improvement_suggestion",
    label: "Improvement Suggestion",
    icon: Star,
    description: "Suggest improvements to existing features",
    color: "bg-green-500",
  },
  {
    value: "usability_issue",
    label: "Usability Issue",
    icon: AlertTriangle,
    description: "Report user experience or interface issues",
    color: "bg-orange-500",
  },
  {
    value: "general_feedback",
    label: "General Feedback",
    icon: MessageSquare,
    description: "Share your thoughts and general feedback",
    color: "bg-purple-500",
  },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-gray-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
];

const categories = [
  "User Interface",
  "Performance",
  "Functionality",
  "Documentation",
  "Security",
  "Integration",
  "Mobile Experience",
  "Accessibility",
  "General",
];

export function GlobalFeedbackButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState("");

  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: "general_feedback",
    title: "",
    description: "",
    category: "General",
    priority: "medium",
    tags: [],
    rating: undefined,
    contactInfo: {
      email: "",
      preferredContact: false,
    },
  });

  // Auto-populate email from session
  useEffect(() => {
    if (session?.user?.email) {
      setFormData((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo!,
          email: session.user.email!,
        },
      }));
    }
  }, [session]);

  const resetForm = () => {
    setFormData({
      feedbackType: "general_feedback",
      title: "",
      description: "",
      category: "General",
      priority: "medium",
      tags: [],
      rating: undefined,
      contactInfo: {
        email: session?.user?.email || "",
        preferredContact: false,
      },
    });
    setCurrentStep(1);
    setNewTag("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/application-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          browserInfo: getBrowserInfo(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. We'll review it soon.",
      });

      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setIsOpen(true)}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[95vh] p-0 gap-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  Share Your Feedback
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-2">
                  Help us create an amazing experience by sharing your thoughts,
                  reporting issues, or suggesting improvements.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Progress Steps */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= 1
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > 1 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Choose Type
                  </span>
                </div>

                <div
                  className={`flex-1 h-0.5 mx-4 ${currentStep >= 2 ? "bg-blue-500" : "bg-gray-300"}`}
                />

                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= 2
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > 2 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Details
                  </span>
                </div>

                <div
                  className={`flex-1 h-0.5 mx-4 ${currentStep >= 3 ? "bg-blue-500" : "bg-gray-300"}`}
                />

                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep >= 3
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > 3 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      "3"
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Review
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Step 1: Feedback Type Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        What would you like to share with us?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Select the type of feedback that best describes your
                        input
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.feedbackType === type.value;
                        return (
                          <Card
                            key={type.value}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                              isSelected
                                ? "ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950"
                                : "hover:shadow-md border-gray-200"
                            }`}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                feedbackType:
                                  type.value as FeedbackFormData["feedbackType"],
                              }))
                            }
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`p-3 rounded-xl ${type.color} text-white shadow-md`}
                                >
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    {type.label}
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm leading-relaxed">
                                    {type.description}
                                  </p>
                                  {isSelected && (
                                    <div className="mt-3">
                                      <Badge
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-700"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Selected
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!formData.feedbackType}
                        size="lg"
                        className="min-w-32"
                      >
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Details */}
                {currentStep === 2 && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Tell us more
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Provide details to help us understand and address your
                        feedback
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label
                          htmlFor="title"
                          className="text-base font-medium flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          Title *
                        </Label>
                        <Input
                          id="title"
                          placeholder="Give your feedback a clear, descriptive title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="mt-2 text-base"
                          autoFocus
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="description"
                          className="text-base font-medium flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          Description *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Share the details... What happened? What would you like to see? How can we improve?"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="mt-2 min-h-[120px] text-base resize-none"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            Be as specific as possible to help us understand
                            your feedback
                          </span>
                          <span className="text-xs text-gray-500">
                            {formData.description.length}/1000
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Category
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                category: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-500" />
                            Priority
                          </Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(
                              value: FeedbackFormData["priority"]
                            ) =>
                              setFormData((prev) => ({
                                ...prev,
                                priority: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map((priority) => (
                                <SelectItem
                                  key={priority.value}
                                  value={priority.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${priority.color}`}
                                    />
                                    {priority.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-blue-500" />
                          How satisfied are you overall? (Optional)
                        </Label>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, rating }))
                                }
                                className="group transition-transform hover:scale-110"
                                aria-label={`Rate ${rating} out of 5 stars`}
                                title={`Rate ${rating} out of 5 stars`}
                              >
                                <StarIcon
                                  className={`h-8 w-8 transition-colors ${
                                    formData.rating && rating <= formData.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 group-hover:text-yellow-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          {formData.rating && (
                            <div className="flex items-center gap-2">
                              <Separator
                                orientation="vertical"
                                className="h-6"
                              />
                              <span className="text-sm text-gray-600">
                                {formData.rating === 1 && "😟 Poor"}
                                {formData.rating === 2 && "😐 Fair"}
                                {formData.rating === 3 && "🙂 Good"}
                                {formData.rating === 4 && "😊 Very Good"}
                                {formData.rating === 5 && "🤩 Excellent"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    rating: undefined,
                                  }))
                                }
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        size="lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={
                          !formData.title.trim() || !formData.description.trim()
                        }
                        size="lg"
                        className="min-w-32"
                      >
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Details & Contact */}
                {currentStep === 3 && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Final touches
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Add tags and contact information to help us follow up
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Plus className="h-4 w-4 text-blue-500" />
                          Tags (Optional)
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Add relevant tags to help categorize your feedback
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Type a tag and press Enter"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {formData.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                              >
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                  aria-label={`Remove tag: ${tag}`}
                                  title={`Remove tag: ${tag}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          Contact Information
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Let us know how to reach you for updates or follow-up
                          questions
                        </p>
                        <div className="space-y-4 mt-3">
                          <div>
                            <Input
                              placeholder="Your email address"
                              type="email"
                              value={formData.contactInfo?.email || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  contactInfo: {
                                    ...prev.contactInfo!,
                                    email: e.target.value,
                                  },
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="contact-preference"
                              checked={
                                formData.contactInfo?.preferredContact || false
                              }
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  contactInfo: {
                                    ...prev.contactInfo!,
                                    preferredContact: !!checked,
                                  },
                                }))
                              }
                            />
                            <Label
                              htmlFor="contact-preference"
                              className="text-sm leading-relaxed"
                            >
                              I&apos;d like to receive updates about this
                              feedback and be contacted for follow-up questions
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Browser Info Notice */}
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                              Technical Information
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              We&apos;ll automatically include your browser and
                              page information to help us debug issues.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        size="lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        size="lg"
                        className="min-w-40 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
