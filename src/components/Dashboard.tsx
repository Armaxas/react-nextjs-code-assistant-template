"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import UserMonitoring from "@/components/UserMonitoring";
import ApplicationFeedbackMonitoring from "@/components/ApplicationFeedbackMonitoring";
import {
  MessageSquare,
  ThumbsUp,
  Search,
  Download,
  Share2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  BarChart2,
  Users,
  Settings,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cachedFetch } from "@/lib/cached-fetch";

// Define types for chart data
interface RatingDistributionData {
  rating: string;
  count: number;
  color?: string;
}

interface RatingTrendsData {
  date: string;
  avgRating: number;
}

interface PieChartLabelProps {
  rating: string;
  count: number;
  percent: number;
}

// Define types for chat and feedback data
interface MessageFeedback {
  rating: number;
  category: string;
  isUpvoted: boolean;
  comments: string;
  hasJiraIssue: boolean;
}

interface Message {
  id: string;
  type: string;
  role?: "user" | "assistant" | "system" | "data";
  content: string;
  timestamp: string;
  feedback?: MessageFeedback | null;
  model?: string | null;
}

interface Chat {
  id: string;
  userId: string;
  threadId: string;
  lastMessage: string;
  messagesCount: number;
  rating: number;
  feedbackCount: number;
  feedback: string;
  timestamp: string;
  messages: Message[];
}

interface Feedback {
  id: string;
  userId: string;
  threadId: string;
  rating: number;
  feedback: string;
  timestamp: string;
  query: string;
  response: string;
  model: string;
  category: string;
  resolved: boolean;
}

interface FeedbackMetrics {
  ratingDistribution: Array<{
    rating: string | number;
    count: number;
    color: string;
  }>;
  ratingTrends: Array<{
    date: string;
    rating: string | number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    avgRating: string | number;
  }>;
  timeBasedMetrics: {
    lastHour: { count: number; avgRating: string | number };
    last24Hours: { count: number; avgRating: string | number };
    lastWeek: { count: number; avgRating: string | number };
    lastMonth: { count: number; avgRating: string | number };
  };
}

// Unused function - commenting out to avoid lint errors
/*
const getRatingColor = (rating: number): string => {
  // Convert any rating to a CSS class based on percentage
  if (rating >= 90) return "bg-green-500";
  if (rating >= 80) return "bg-lime-500";
  if (rating >= 70) return "bg-green-400";
  if (rating >= 60) return "bg-yellow-500";
  if (rating >= 50) return "bg-yellow-400";
  if (rating >= 40) return "bg-orange-500";
  if (rating >= 30) return "bg-orange-400";
  if (rating >= 20) return "bg-red-500";
  return "bg-red-400";
};
*/

// Unused interface - commenting out to avoid lint errors
/*
interface ChatDetailsModalProps {
  chat: Chat;
  onClose: () => void;
}
*/

const ChatMonitoring = () => {
  const [chatData, setChatData] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // Add flag to prevent duplicate calls
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState("all");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");

  // Toggle chat expansion
  const toggleChatExpansion = (chatId: string) => {
    setExpandedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  // Fetch chat data
  useEffect(() => {
    // Prevent duplicate calls
    if (hasFetched) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasFetched(true); // Mark as fetched to prevent duplicates
        const response = await cachedFetch("/api/dashboard/chats");
        if (!response.ok) {
          throw new Error("Failed to fetch chat data");
        }
        const result = await response.json();

        // Ensure we have a valid array
        const chats = Array.isArray(result.data) ? result.data : [];
        setChatData(chats);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        // Initialize with empty array to prevent null reference errors
        setChatData([]);

        toast({
          title: "Error",
          description: "Failed to load chat data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasFetched]);

  const filteredData = useMemo(() => {
    // Safety check for null or undefined chatData
    if (!chatData || !Array.isArray(chatData)) {
      return [];
    }

    let filtered = [...chatData];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((chat) => {
        try {
          return (
            (chat.userId && chat.userId.toLowerCase().includes(searchLower)) ||
            (chat.lastMessage &&
              chat.lastMessage.toLowerCase().includes(searchLower)) ||
            (chat.threadId && chat.threadId.toLowerCase().includes(searchLower))
          );
        } catch {
          // Skip items that cause errors
          return false;
        }
      });
    }

    // Apply time filter
    const now = new Date();
    filtered = filtered.filter((chat) => {
      try {
        if (!chat || !chat.timestamp) return false;

        const chatDate = new Date(chat.timestamp);
        // Skip invalid dates
        if (isNaN(chatDate.getTime())) return false;

        const daysDiff = Math.floor(
          (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (timeFilter) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "all":
          default:
            return true;
        }
      } catch {
        // Skip items that cause errors
        return false;
      }
    });

    // Apply feedback filter
    if (feedbackFilter !== "all") {
      filtered = filtered.filter((chat) => {
        try {
          const hasFeedback = (chat.feedbackCount || 0) > 0;
          return feedbackFilter === "with-feedback"
            ? hasFeedback
            : !hasFeedback;
        } catch {
          return false;
        }
      });
    }

    // Apply model filter
    if (modelFilter !== "all") {
      filtered = filtered.filter((chat) => {
        try {
          // Check if any message in the chat uses the selected model
          return chat.messages.some((message) => 
            message.role === "assistant" && message.model === modelFilter
          );
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [searchTerm, timeFilter, feedbackFilter, modelFilter, chatData]);

  // Get all unique models from chat data
  const availableModels = useMemo(() => {
    if (!chatData || !Array.isArray(chatData)) {
      return [];
    }

    const models = new Set<string>();
    chatData.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.role === "assistant" && message.model) {
          models.add(message.model);
        }
      });
    });

    return Array.from(models).sort();
  }, [chatData]);

  // Calculate chat analytics
  const chatAnalytics = useMemo(() => {
    if (!chatData || !Array.isArray(chatData)) {
      return {
        totalChats: 0,
        averageMessages: 0,
        feedbackRate: 0,
        activeUsers: 0,
        volumeData: [],
        messageDistribution: [],
        userBreakdown: { new: 0, returning: 0 },
        dailyVolume: 0,
        modelUsage: [],
      };
    }

    const totalChats = filteredData.length;
    const totalMessages = filteredData.reduce(
      (sum, chat) => sum + (chat.messagesCount || 0),
      0
    );
    const chatsWithFeedback = filteredData.filter(
      (chat) => (chat.feedbackCount || 0) > 0
    ).length;

    // Calculate unique users
    const uniqueUsers = new Set(filteredData.map((chat) => chat.userId)).size;

    // Calculate model usage statistics
    const modelUsageMap = new Map<string, number>();
    let totalAssistantMessages = 0;
    
    filteredData.forEach((chat) => {
      chat.messages.forEach((message) => {
        if (message.role === "assistant") {
          totalAssistantMessages++;
          const model = message.model || "Unknown";
          modelUsageMap.set(model, (modelUsageMap.get(model) || 0) + 1);
        }
      });
    });

    const modelUsage = Array.from(modelUsageMap.entries()).map(([model, count]) => ({
      model,
      count,
      percentage: totalAssistantMessages > 0 ? ((count / totalAssistantMessages) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.count - a.count);

    // Calculate chat volume over time (last 7 days)
    const volumeData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayChats = filteredData.filter((chat) => {
        if (!chat.timestamp) return false;
        const chatDate = new Date(chat.timestamp);
        return chatDate.toISOString().split("T")[0] === dateStr;
      }).length;

      volumeData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        chats: dayChats,
      });
    }

    // Calculate message distribution (conversation length buckets)
    const messageDistribution = [
      { range: "1-2", count: 0 },
      { range: "3-5", count: 0 },
      { range: "6-10", count: 0 },
      { range: "11-20", count: 0 },
      { range: "20+", count: 0 },
    ];

    filteredData.forEach((chat) => {
      const msgCount = chat.messagesCount || 0;
      if (msgCount <= 2) messageDistribution[0].count++;
      else if (msgCount <= 5) messageDistribution[1].count++;
      else if (msgCount <= 10) messageDistribution[2].count++;
      else if (msgCount <= 20) messageDistribution[3].count++;
      else messageDistribution[4].count++;
    });

    // Simple user breakdown (could be enhanced with actual user tracking)
    const userCounts: Record<string, number> = {};
    filteredData.forEach((chat) => {
      userCounts[chat.userId] = (userCounts[chat.userId] || 0) + 1;
    });

    const returningUsers = Object.values(userCounts).filter(
      (count: number) => count > 1
    ).length;
    const newUsers = uniqueUsers - returningUsers;

    return {
      totalChats,
      averageMessages:
        totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : 0,
      feedbackRate:
        totalChats > 0 ? Math.round((chatsWithFeedback / totalChats) * 100) : 0,
      activeUsers: uniqueUsers,
      volumeData,
      messageDistribution,
      userBreakdown: { new: newUsers, returning: returningUsers },
      dailyVolume: volumeData.reduce((sum, day) => sum + day.chats, 0),
      modelUsage,
    };
  }, [filteredData, chatData]);

  // Unused function - commenting out to avoid lint errors
  /*
  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  interface SortIconProps {
    column: string;
  }

  const SortIcon = ({ column }: SortIconProps) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };
  */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-900/50 p-4 rounded-lg border border-gray-700"
            >
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-700 rounded-lg w-10 h-10"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Feedback" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Feedback</SelectItem>
            <SelectItem value="with-feedback">With Feedback</SelectItem>
            <SelectItem value="no-feedback">No Feedback</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Chat Analytics Overview
        </h3>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Chats</p>
                <p className="text-2xl font-bold text-white">
                  {chatAnalytics.totalChats}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Avg Messages/Chat
                </p>
                <p className="text-2xl font-bold text-white">
                  {chatAnalytics.averageMessages}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Feedback Rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {chatAnalytics.feedbackRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-white">
                  {chatAnalytics.activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  Most Popular Model
                </p>
                <p className="text-2xl font-bold text-white">
                  {chatAnalytics.modelUsage && chatAnalytics.modelUsage.length > 0 
                    ? chatAnalytics.modelUsage[0].model.split('-')[0] || 'N/A'
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chat Volume Trend */}
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Chat Volume (Last 7 Days)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chatAnalytics.volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={{ fill: "#60A5FA", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Message Distribution */}
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Conversation Length Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chatAnalytics.messageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar dataKey="count" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              User Type Breakdown
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "New Users",
                        value: chatAnalytics.userBreakdown.new,
                        fill: "#60A5FA",
                      },
                      {
                        name: "Returning Users",
                        value: chatAnalytics.userBreakdown.returning,
                        fill: "#34D399",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Weekly Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Volume:</span>
                <span className="font-semibold text-white">
                  {chatAnalytics.dailyVolume} chats
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Average:</span>
                <span className="font-semibold text-white">
                  {(chatAnalytics.dailyVolume / 7).toFixed(1)} chats
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Peak Day:</span>
                <span className="font-semibold text-white">
                  {
                    chatAnalytics.volumeData.reduce(
                      (max, day) => (day.chats > max.chats ? day : max),
                      { date: "N/A", chats: 0 }
                    ).date
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Messages:</span>
                <span className="font-semibold text-white">
                  {filteredData.reduce(
                    (sum, chat) => sum + (chat.messagesCount || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Engagement Insights
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Feedback Response:</span>
                <span className="font-semibold text-green-400">
                  {chatAnalytics.feedbackRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Retention:</span>
                <span className="font-semibold text-blue-400">
                  {chatAnalytics.activeUsers > 0
                    ? Math.round(
                        (chatAnalytics.userBreakdown.returning /
                          chatAnalytics.activeUsers) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Session Length:</span>
                <span className="font-semibold text-white">
                  {chatAnalytics.averageMessages} messages
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Conversations:</span>
                <span className="font-semibold text-purple-400">
                  {chatAnalytics.totalChats}
                </span>
              </div>
            </div>
          </div>

          {/* Model Usage Distribution */}
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-white">
              Model Usage Distribution
            </h4>
            {chatAnalytics.modelUsage && chatAnalytics.modelUsage.length > 0 ? (
              <div className="space-y-3">
                {chatAnalytics.modelUsage.slice(0, 5).map((modelStat: {model: string, count: number, percentage: string}, index: number) => (
                  <div key={modelStat.model} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-red-500' : 'bg-purple-500'
                        }`}
                      ></div>
                      <span className="text-gray-300 text-sm font-medium">
                        {modelStat.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {modelStat.count}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({modelStat.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
                {chatAnalytics.modelUsage.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{chatAnalytics.modelUsage.length - 5} more models
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No model usage data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredData.length} results
        {isLoading && " (Loading...)"}
      </div>

      {/* Chat List - Collapsible Cards */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-10">No chats found</div>
        ) : (
          filteredData.map((chat, chatIndex) => {
            const isExpanded = expandedChats.has(chat.id);
            return (
              <Card
                key={`chat-${chat.id}-${chatIndex}`}
                className="bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 overflow-hidden"
              >
                {/* Chat Header - Always Visible */}
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-6 cursor-pointer"
                    onClick={() => toggleChatExpansion(chat.id)}
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-3">
                          <span className="text-white">{chat.userId}</span>
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {chat.messagesCount} messages
                          </span>
                          {chat.feedbackCount > 0 && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {chat.feedbackCount} feedback
                              {chat.feedbackCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-1 line-clamp-1">
                          {chat.lastMessage}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-400">
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 space-y-4 border-t border-gray-700/50">
                          {/* Quick Info Bar */}
                          <div className="bg-gray-800/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider">
                                User ID
                              </div>
                              <div className="text-white font-medium truncate">
                                {chat.userId}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider">
                                Messages
                              </div>
                              <div className="text-white font-bold text-lg">
                                {chat.messagesCount}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider">
                                Feedback Count
                              </div>
                              <div className="text-white font-bold text-lg">
                                {chat.feedbackCount || 0}
                              </div>
                            </div>
                          </div>

                          {/* Last Message Preview */}
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.405L3 21l1.405-5.094A8.959 8.959 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z"
                                />
                              </svg>
                              Last Message
                            </h4>
                            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600">
                              <p className="text-gray-200 leading-relaxed text-sm">
                                {chat.lastMessage}
                              </p>
                            </div>
                          </div>

                          {/* Conversation Messages */}
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12H9m6-4H9m6 8H9"
                                />
                              </svg>
                              Conversation History ({chat.messagesCount}{" "}
                              messages)
                            </h4>
                            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-lg border border-gray-600 max-h-64 overflow-y-auto">
                              {chat.messages && chat.messages.length > 0 ? (
                                <div className="p-3 space-y-3">
                                  {chat.messages.map(
                                    (message: Message, index: number) => {
                                      // Create a truly unique key by combining chat ID, message ID, and index
                                      // This ensures uniqueness even if message IDs are duplicated across chats
                                      const uniqueKey = `chat-${chat.id}-message-${message.id || index}-idx-${index}`;

                                      return (
                                        <div
                                          key={uniqueKey}
                                          className={`p-3 rounded-lg ${
                                            message.role === "user"
                                              ? "bg-blue-500/10 border-l-2 border-blue-500/50 ml-2"
                                              : "bg-purple-500/10 border-l-2 border-purple-500/50 mr-2"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`text-xs font-medium ${
                                                  message.role === "user"
                                                    ? "text-blue-400"
                                                    : "text-purple-400"
                                                }`}
                                              >
                                                {message.role === "user"
                                                  ? "👤 User"
                                                  : "🤖 Assistant"}
                                              </span>
                                              {message.role === "assistant" && message.model && (
                                                <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                                                  {message.model}
                                                </span>
                                              )}
                                              <span className="text-xs text-gray-500">
                                                {new Date(
                                                  message.timestamp
                                                ).toLocaleTimeString()}
                                              </span>
                                            </div>
                                            {message.role === "assistant" &&
                                              message.feedback && (
                                                <div className="flex items-center gap-2">
                                                  <div className="text-xs bg-gray-700/50 px-2 py-1 rounded flex items-center gap-1">
                                                    {message.feedback.isUpvoted
                                                      ? "👍"
                                                      : "👎"}
                                                    <span
                                                      className={`font-medium ${
                                                        (message.feedback
                                                          .rating || 0) === 0
                                                          ? "text-gray-400"
                                                          : (message.feedback
                                                                .rating || 0) >=
                                                              70
                                                            ? "text-green-400"
                                                            : (message.feedback
                                                                  .rating ||
                                                                  0) >= 40
                                                              ? "text-yellow-400"
                                                              : "text-red-400"
                                                      }`}
                                                    >
                                                      {(message.feedback
                                                        .rating || 0) === 0
                                                        ? "Not Rated"
                                                        : `${message.feedback.rating}%`}
                                                    </span>
                                                  </div>
                                                  {message.feedback
                                                    .category && (
                                                    <div className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                                      {message.feedback.category
                                                        .replace("-", " ")
                                                        .replace(/\b\w/g, (l) =>
                                                          l.toUpperCase()
                                                        )}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                          <p className="text-gray-200 text-sm leading-relaxed">
                                            {message.content}
                                          </p>
                                          {message.role === "assistant" &&
                                            message.feedback &&
                                            message.feedback.comments && (
                                              <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                                                <span className="text-gray-400">
                                                  Feedback:{" "}
                                                </span>
                                                {message.feedback.comments}
                                              </div>
                                            )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <div className="p-4 text-center text-gray-400">
                                  No messages available
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Technical Details */}
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Technical Details
                            </h4>
                            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600 space-y-2 text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <span className="text-gray-400">
                                    Chat ID:
                                  </span>
                                  <div className="text-white font-mono text-xs break-all">
                                    {chat.id}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Started:
                                  </span>
                                  <div className="text-white text-xs">
                                    {new Date(chat.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Thread ID:
                                  </span>
                                  <div className="text-white font-mono text-xs break-all">
                                    {chat.threadId}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Status:</span>
                                  <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                    Active
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const FeedbackMonitoring = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackMetrics, setFeedbackMetrics] =
    useState<FeedbackMetrics | null>(null);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(
    new Set()
  );
  const [timeRange, setTimeRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedbackHasFetched, setFeedbackHasFetched] = useState(false);

  // Recent Feedback search, sort, and filter states
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState("");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("all");
  const [feedbackSortBy, setFeedbackSortBy] = useState("timestamp");
  const [feedbackSortOrder, setFeedbackSortOrder] = useState<"asc" | "desc">(
    "desc"
  );
  const [feedbackModelFilter, setFeedbackModelFilter] = useState("all");

  // Chart type selection states
  const [ratingDistributionChartType, setRatingDistributionChartType] =
    useState("bar");
  const [ratingTrendsChartType, setRatingTrendsChartType] = useState("line");

  // Toggle feedback expansion
  const toggleFeedbackExpansion = (feedbackId: string) => {
    setExpandedFeedback((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  // Fetch feedback data and metrics
  useEffect(() => {
    const fetchData = async () => {
      if (feedbackHasFetched) return;

      try {
        setIsLoading(true);

        // Fetch feedback data
        const feedbackResponse = await cachedFetch("/api/dashboard/feedback");
        if (!feedbackResponse.ok) {
          throw new Error("Failed to fetch feedback data");
        }
        const feedbackResult = await feedbackResponse.json();

        // Make sure we have a valid array
        const feedbackData = Array.isArray(feedbackResult.data)
          ? feedbackResult.data
          : [];
        setFeedbackList(feedbackData);

        // Fetch total messages count for response rate calculation
        const messagesResponse = await cachedFetch(
          "/api/dashboard/messages-count"
        );
        if (messagesResponse.ok) {
          const messagesResult = await messagesResponse.json();
          setTotalMessages(messagesResult.totalMessages || 0);
        } else {
          console.warn(
            "Failed to fetch messages count, using fallback calculation"
          );
          setTotalMessages(0);
        }

        // Fetch metrics data
        const metricsResponse = await cachedFetch("/api/dashboard/metrics");
        if (!metricsResponse.ok) {
          throw new Error("Failed to fetch metrics data");
        }
        const metricsResult = await metricsResponse.json();

        // Initialize with default values to ensure proper structure
        const defaultMetrics = {
          ratingDistribution: [],
          ratingTrends: [],
          categoryBreakdown: [],
          timeBasedMetrics: {
            lastHour: { count: 0, avgRating: 0 },
            last24Hours: { count: 0, avgRating: 0 },
            lastWeek: { count: 0, avgRating: 0 },
            lastMonth: { count: 0, avgRating: 0 },
          },
        };

        // Merge with actual data, ensuring we don't have nulls
        const metrics = metricsResult.data || defaultMetrics;

        // Safety checks for each property
        metrics.ratingDistribution = Array.isArray(metrics.ratingDistribution)
          ? metrics.ratingDistribution
          : [];

        metrics.ratingTrends = Array.isArray(metrics.ratingTrends)
          ? metrics.ratingTrends
          : [];

        metrics.categoryBreakdown = Array.isArray(metrics.categoryBreakdown)
          ? metrics.categoryBreakdown
          : [];

        metrics.timeBasedMetrics =
          metrics.timeBasedMetrics || defaultMetrics.timeBasedMetrics;

        setFeedbackMetrics(metrics);
        setFeedbackHasFetched(true);
      } catch (error) {
        console.error("Error fetching feedback data:", error);
        // Initialize with empty arrays to prevent null reference errors
        setFeedbackList([]);
        setFeedbackMetrics({
          ratingDistribution: [],
          ratingTrends: [],
          categoryBreakdown: [],
          timeBasedMetrics: {
            lastHour: { count: 0, avgRating: 0 },
            last24Hours: { count: 0, avgRating: 0 },
            lastWeek: { count: 0, avgRating: 0 },
            lastMonth: { count: 0, avgRating: 0 },
          },
        });

        toast({
          title: "Error",
          description: "Failed to load feedback data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [feedbackHasFetched]);

  // Filter feedback data based on selected filters
  const filteredFeedback = useMemo(() => {
    // Safety check for null or undefined feedbackList
    if (!feedbackList || !Array.isArray(feedbackList)) {
      return [];
    }

    let filtered = [...feedbackList];

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (feedback) => feedback.category === categoryFilter
      );
    }

    // Apply time range filter
    const now = new Date();
    filtered = filtered.filter((feedback) => {
      try {
        if (!feedback || !feedback.timestamp) return false;

        const feedbackDate = new Date(feedback.timestamp);
        // Skip invalid dates
        if (isNaN(feedbackDate.getTime())) return false;

        const hoursDiff =
          (now.getTime() - feedbackDate.getTime()) / (1000 * 60 * 60);

        switch (timeRange) {
          case "24h":
            return hoursDiff <= 24;
          case "7d":
            return hoursDiff <= 168;
          case "30d":
            return hoursDiff <= 720;
          default:
            return true;
        }
      } catch {
        // Skip items that cause errors
        return false;
      }
    });

    // Apply Recent Feedback specific filters

    // Search filter - search in feedback text, userId, and category
    if (feedbackSearchTerm && feedbackSearchTerm.trim() !== "") {
      const searchLower = feedbackSearchTerm.toLowerCase();
      filtered = filtered.filter((feedback) => {
        try {
          return (
            (feedback.feedback &&
              feedback.feedback.toLowerCase().includes(searchLower)) ||
            (feedback.userId &&
              feedback.userId.toLowerCase().includes(searchLower)) ||
            (feedback.category &&
              feedback.category.toLowerCase().includes(searchLower))
          );
        } catch {
          return false;
        }
      });
    }

    // Rating filter
    if (feedbackRatingFilter !== "all") {
      filtered = filtered.filter((feedback) => {
        switch (feedbackRatingFilter) {
          case "positive":
            return feedback.rating > 60;
          case "negative":
            return feedback.rating > 0 && feedback.rating <= 60;
          case "not-rated":
            return feedback.rating === 0;
          default:
            return true;
        }
      });
    }

    // Model filter
    if (feedbackModelFilter !== "all") {
      filtered = filtered.filter((feedback) => {
        return feedback.model === feedbackModelFilter;
      });
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: string | number = 0;
      let bValue: string | number = 0;

      switch (feedbackSortBy) {
        case "timestamp":
          aValue = new Date(a.timestamp || 0).getTime();
          bValue = new Date(b.timestamp || 0).getTime();
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "userId":
          aValue = (a.userId || "").toLowerCase();
          bValue = (b.userId || "").toLowerCase();
          break;
        case "category":
          aValue = (a.category || "").toLowerCase();
          bValue = (b.category || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (feedbackSortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    categoryFilter,
    timeRange,
    feedbackList,
    feedbackSearchTerm,
    feedbackRatingFilter,
    feedbackSortBy,
    feedbackSortOrder,
    feedbackModelFilter,
  ]);

  // Get all available models from feedback data
  const availableFeedbackModels = useMemo(() => {
    if (!feedbackList || !Array.isArray(feedbackList)) {
      return [];
    }

    const models = new Set<string>();
    feedbackList.forEach((feedback) => {
      if (feedback.model && feedback.model !== "Unknown") {
        models.add(feedback.model);
      }
    });

    return Array.from(models).sort();
  }, [feedbackList]);

  // Calculate average rating for the filtered data
  const averageRating = useMemo(() => {
    if (!filteredFeedback || filteredFeedback.length === 0) return 0;

    try {
      const sum = filteredFeedback.reduce((acc, curr) => {
        // Safety check for missing or NaN rating
        const rating = curr && !isNaN(curr.rating) ? curr.rating : 0;
        return acc + rating;
      }, 0);

      return (sum / filteredFeedback.length).toFixed(1);
    } catch (error) {
      console.error("Error calculating average rating:", error);
      return "0.0";
    }
  }, [filteredFeedback]);

  // Function to generate smooth red-to-green gradient color based on rating
  const getRatingColor = (rating: number): string => {
    // Normalize rating to 0-1 scale
    const normalized = Math.max(0, Math.min(100, rating)) / 100;

    // Define color stops for smooth transition
    if (normalized <= 0.5) {
      // Red to Yellow (0-50%)
      const factor = normalized * 2; // 0 to 1
      const red = 255;
      const green = Math.round(255 * factor);
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Yellow to Green (50-100%)
      const factor = (normalized - 0.5) * 2; // 0 to 1
      const red = Math.round(255 * (1 - factor));
      const green = 255;
      const blue = 0;
      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  // Calculate dynamic metrics based on filtered feedback
  const dynamicMetrics = useMemo(() => {
    if (!filteredFeedback || filteredFeedback.length === 0) {
      return {
        ratingDistribution: [],
        ratingTrends: [],
        categoryBreakdown: [],
        responseRate: 0,
      };
    }

    // Calculate rating distribution (for percentage-based ratings 0-100)
    const ratingCounts: { [key: number]: number } = {};
    filteredFeedback.forEach((feedback) => {
      if (feedback.rating && feedback.rating >= 0 && feedback.rating <= 100) {
        const rating = Math.round(feedback.rating); // Round to nearest integer
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      }
    });

    const ratingDistribution = Object.entries(ratingCounts)
      .map(([rating, count]) => ({
        rating: `${rating}%`,
        ratingValue: parseInt(rating),
        count: count as number,
        percentage:
          filteredFeedback.length > 0
            ? (((count as number) / filteredFeedback.length) * 100).toFixed(1)
            : 0,
        // Use smooth gradient color based on rating value
        color: getRatingColor(parseInt(rating)),
      }))
      .sort((a, b) => a.ratingValue - b.ratingValue); // Sort by rating value

    // Calculate rating trends (group by date)
    const trendMap = new Map();
    filteredFeedback.forEach((feedback) => {
      if (feedback.timestamp && feedback.rating) {
        const date = new Date(feedback.timestamp).toISOString().split("T")[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, { ratings: [], count: 0 });
        }
        trendMap.get(date).ratings.push(feedback.rating);
        trendMap.get(date).count++;
      }
    });

    const ratingTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        avgRating:
          data.ratings.reduce(
            (sum: number, rating: number) => sum + rating,
            0
          ) / data.ratings.length,
        count: data.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate category breakdown
    const categoryMap = new Map();
    filteredFeedback.forEach((feedback) => {
      const category = feedback.category || "Unknown";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, 0);
      }
      categoryMap.set(category, categoryMap.get(category) + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({
        category,
        count,
        percentage:
          filteredFeedback.length > 0
            ? ((count / filteredFeedback.length) * 100).toFixed(1)
            : 0,
      })
    );

    // Calculate response rate: total feedback / total messages
    // Filter the messages based on the same time range as feedback for accurate comparison
    let responseRate = 0;
    if (totalMessages > 0) {
      // For time-filtered views, we need to estimate the messages in that time period
      // For now, we'll use the simple calculation: filtered feedback / total messages
      // This could be enhanced by fetching time-filtered message counts
      responseRate = (filteredFeedback.length / totalMessages) * 100;
    }

    return {
      ratingDistribution,
      ratingTrends,
      categoryBreakdown,
      responseRate: responseRate.toFixed(1),
    };
  }, [filteredFeedback, totalMessages]);

  // Get all available categories for the filter dropdown
  const availableCategories = useMemo(() => {
    if (!feedbackList || !Array.isArray(feedbackList)) {
      return [];
    }

    const categories = new Set<string>();
    feedbackList.forEach((feedback) => {
      if (feedback.category && typeof feedback.category === "string") {
        categories.add(feedback.category);
      }
    });

    return Array.from(categories);
  }, [feedbackList]);

  // Helper function to render Rating Distribution charts
  const renderRatingDistributionChart = (data: RatingDistributionData[]) => {
    const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981"];

    switch (ratingDistributionChartType) {
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ rating, count, percent }: PieChartLabelProps) =>
                `${rating}: ${count} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
            />
          </PieChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="rating"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        );

      default: // bar
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="rating"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
              formatter={(value) => [
                <span key="count">{value}</span>,
                <span key="label">Feedbacks</span>,
              ]}
            />
            <Bar
              dataKey="count"
              name="Number of Feedbacks"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  // Helper function to render Rating Trends charts
  const renderRatingTrendsChart = (data: RatingTrendsData[]) => {
    switch (ratingTrendsChartType) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
              formatter={(value) => [
                <span key="rating">{Number(value).toFixed(1)}%</span>,
                <span key="label">Average Rating</span>,
              ]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <Bar dataKey="avgRating" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
              formatter={(value) => [
                <span key="rating">{Number(value).toFixed(1)}%</span>,
                <span key="label">Average Rating</span>,
              ]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <Area
              type="monotone"
              dataKey="avgRating"
              stroke="#10B981"
              fill="url(#trendGradient)"
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        );

      default: // line
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#F3F4F6",
              }}
              formatter={(value) => [
                <span key="rating">{Number(value).toFixed(1)}%</span>,
                <span key="label">Average Rating</span>,
              ]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke="url(#ratingGradient)"
              strokeWidth={3}
              dot={{
                fill: "#10B981",
                strokeWidth: 2,
                r: 4,
                stroke: "#fff",
              }}
              activeDot={{
                r: 6,
                fill: "#10B981",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-900/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-32"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Average Rating</div>
              <div className="text-3xl font-bold text-green-400">
                {`${averageRating}%`}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Total Feedback</div>
              <div className="text-3xl font-bold text-blue-400">
                {filteredFeedback.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Response Rate</div>
              <div className="text-3xl font-bold text-purple-400">
                {`${dynamicMetrics.responseRate}%`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Metrics</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" />
                  Rating Distribution
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {ratingDistributionChartType === "bar" &&
                    "Compare rating counts across categories"}
                  {ratingDistributionChartType === "pie" &&
                    "View rating proportions at a glance"}
                  {ratingDistributionChartType === "area" &&
                    "See rating distribution trends"}
                </p>
              </div>
              <Select
                value={ratingDistributionChartType}
                onValueChange={setRatingDistributionChartType}
              >
                <SelectTrigger className="w-[120px] bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
                <div className="h-64 bg-gray-700 rounded"></div>
              </div>
            ) : !dynamicMetrics?.ratingDistribution ||
              !Array.isArray(dynamicMetrics.ratingDistribution) ||
              dynamicMetrics.ratingDistribution.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p>No rating data available</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderRatingDistributionChart(
                    dynamicMetrics.ratingDistribution
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Trends */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5" />
                  Rating Trends
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {ratingTrendsChartType === "line" &&
                    "Track rating changes over time"}
                  {ratingTrendsChartType === "bar" &&
                    "Compare ratings across time periods"}
                  {ratingTrendsChartType === "area" &&
                    "Visualize rating trends with emphasis"}
                </p>
              </div>
              <Select
                value={ratingTrendsChartType}
                onValueChange={setRatingTrendsChartType}
              >
                <SelectTrigger className="w-[120px] bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
                <div className="h-64 bg-gray-700 rounded"></div>
              </div>
            ) : !dynamicMetrics?.ratingTrends ||
              !Array.isArray(dynamicMetrics.ratingTrends) ||
              dynamicMetrics.ratingTrends.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p>No trend data available</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderRatingTrendsChart(dynamicMetrics.ratingTrends)}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 animate-pulse space-y-3 p-6">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="flex justify-center">
                  <div className="h-40 w-40 bg-gray-700 rounded-full"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            ) : !dynamicMetrics?.categoryBreakdown ||
              !Array.isArray(dynamicMetrics.categoryBreakdown) ||
              dynamicMetrics.categoryBreakdown.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <p>No category data available</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicMetrics.categoryBreakdown}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#3B82F6"
                      label={({
                        value,
                        percentage,
                      }: {
                        value: number;
                        percentage: string;
                      }) => `${value} (${percentage}%)`}
                      name=""
                    >
                      {dynamicMetrics.categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            [
                              "#3B82F6",
                              "#8B5CF6",
                              "#EC4899",
                              "#10B981",
                              "#F59E0B",
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "#F3F4F6",
                      }}
                      formatter={(value, name) => [
                        <span key="value" className="text-gray-100">
                          {value} (
                          {dynamicMetrics.categoryBreakdown.find(
                            (d) => d.category === name
                          )?.percentage || 0}
                          %)
                        </span>,
                        <span key="category" className="text-gray-100">
                          {name}
                        </span>,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time-based Metrics */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time-based Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                      <div className="h-5 bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded w-12"></div>
                  </div>
                ))}
              </div>
            ) : !feedbackMetrics?.timeBasedMetrics ? (
              <div className="h-80 flex items-center justify-center">
                <p>No time-based metrics available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(feedbackMetrics.timeBasedMetrics || {}).map(
                  ([period, data]) => (
                    <div
                      key={period}
                      className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="text-sm text-gray-400">
                          {period
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </div>
                        <div className="font-medium">
                          {data.count} feedbacks
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {data.avgRating}%
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback List */}
      <div className="space-y-4">
        {/* Recent Feedback Filters */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5" />
              Recent Feedback Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search feedback..."
                    value={feedbackSearchTerm}
                    onChange={(e) => setFeedbackSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Rating Filter
                </label>
                <Select
                  value={feedbackRatingFilter}
                  onValueChange={setFeedbackRatingFilter}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="positive">
                      Positive ({">"}60%)
                    </SelectItem>
                    <SelectItem value="negative">Negative (1-60%)</SelectItem>
                    <SelectItem value="not-rated">Not Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Sort By
                </label>
                <Select
                  value={feedbackSortBy}
                  onValueChange={setFeedbackSortBy}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="userId">User</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Sort Order
                </label>
                <Select
                  value={feedbackSortOrder}
                  onValueChange={(value) =>
                    setFeedbackSortOrder(value as "asc" | "desc")
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Model Filter
                </label>
                <Select
                  value={feedbackModelFilter}
                  onValueChange={setFeedbackModelFilter}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {availableFeedbackModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary and Clear Filters */}
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {filteredFeedback.length} of {feedbackList.length}{" "}
                feedback entries
                {feedbackSearchTerm && ` matching "${feedbackSearchTerm}"`}
                {feedbackRatingFilter !== "all" &&
                  ` • Filtered by ${feedbackRatingFilter} ratings`}
                {feedbackModelFilter !== "all" &&
                  ` • Filtered by ${feedbackModelFilter} model`}
              </p>

              {/* Clear Filters Button */}
              {(feedbackSearchTerm ||
                feedbackRatingFilter !== "all" ||
                feedbackModelFilter !== "all" ||
                feedbackSortBy !== "timestamp" ||
                feedbackSortOrder !== "desc") && (
                <button
                  onClick={() => {
                    setFeedbackSearchTerm("");
                    setFeedbackRatingFilter("all");
                    setFeedbackModelFilter("all");
                    setFeedbackSortBy("timestamp");
                    setFeedbackSortOrder("desc");
                  }}
                  className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent Feedback</h3>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                          <div className="w-14 h-14 bg-gray-700 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-700 rounded w-32"></div>
                            <div className="h-4 bg-gray-700 rounded w-48"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-4 bg-gray-700 rounded w-20"></div>
                          <div className="h-5 w-5 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !Array.isArray(filteredFeedback) ||
            filteredFeedback.length === 0 ? (
            <div className="text-center py-10">No feedback found</div>
          ) : (
            filteredFeedback.map((feedback, fbIndex) => {
              const isExpanded = expandedFeedback.has(feedback.id);
              return (
                <Card
                  key={`fb-${feedback.id}-${fbIndex}`}
                  className="bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-200 overflow-hidden"
                >
                  {/* Feedback Header - Always Visible */}
                  <CardContent className="p-0">
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer"
                      onClick={() => toggleFeedbackExpansion(feedback.id)}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold border-2
                            ${
                              feedback.rating === 0
                                ? "bg-gray-800/30 text-gray-300 border-gray-600/50 text-xs"
                                : feedback.rating >= 80
                                  ? "bg-green-500/20 text-green-400 border-green-500/30 text-lg"
                                  : feedback.rating >= 60
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg"
                                    : "bg-red-500/20 text-red-400 border-red-500/30 text-lg"
                            }`}
                        >
                          {feedback.rating === 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs leading-tight">NOT</span>
                              <span className="text-xs leading-tight">
                                RATED
                              </span>
                            </div>
                          ) : (
                            `${feedback.rating}%`
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {feedback.userId}
                            <span className="text-sm text-gray-400">
                              {feedback.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {feedback.feedback}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">
                          {new Date(feedback.timestamp).toLocaleDateString()}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0 space-y-4 border-t border-gray-700/50">
                            {/* Quick Info Bar */}
                            <div className="bg-gray-800/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wider">
                                  User
                                </div>
                                <div className="text-white font-medium truncate">
                                  {feedback.userId}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wider">
                                  Category
                                </div>
                                <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm inline-block">
                                  {feedback.category}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-400 uppercase tracking-wider">
                                  Thread ID
                                </div>
                                <div className="text-white font-mono text-sm truncate">
                                  {feedback.threadId}
                                </div>
                              </div>
                            </div>

                            {/* Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* User Query */}
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  User Query ({feedback.query.length} chars)
                                </h4>
                                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600 max-h-40 overflow-y-auto">
                                  <pre className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm font-sans">
                                    {feedback.query}
                                  </pre>
                                </div>
                              </div>

                              {/* AI Response */}
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  AI Response ({feedback.response.length} chars)
                                  {feedback.model && (
                                    <span className="ml-2 text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                                      {feedback.model}
                                    </span>
                                  )}
                                </h4>
                                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-500/20 max-h-40 overflow-y-auto">
                                  <pre className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm font-sans">
                                    {feedback.response}
                                  </pre>
                                </div>
                              </div>

                              {/* User Feedback */}
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <svg
                                    className={`w-4 h-4 ${
                                      feedback.rating === 0
                                        ? "text-gray-400"
                                        : feedback.rating >= 80
                                          ? "text-green-400"
                                          : feedback.rating >= 60
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                    />
                                  </svg>
                                  User Feedback (Rating:{" "}
                                  {feedback.rating === 0
                                    ? "Not Rated"
                                    : `${feedback.rating}%`}
                                  )
                                </h4>
                                <div
                                  className={`rounded-lg p-3 border max-h-32 overflow-y-auto ${
                                    feedback.rating === 0
                                      ? "bg-gray-800/20 border-gray-500/20"
                                      : feedback.rating >= 80
                                        ? "bg-green-900/20 border-green-500/20"
                                        : feedback.rating >= 60
                                          ? "bg-yellow-900/20 border-yellow-500/20"
                                          : "bg-red-900/20 border-red-500/20"
                                  }`}
                                >
                                  <pre className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm font-sans">
                                    {feedback.feedback}
                                  </pre>
                                </div>
                              </div>

                              {/* Technical Details */}
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Technical Details
                                </h4>
                                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600 space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Feedback ID:
                                    </span>
                                    <span className="text-white font-mono text-xs">
                                      {feedback.id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Timestamp:
                                    </span>
                                    <span className="text-white text-xs">
                                      {new Date(
                                        feedback.timestamp
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">
                                      Status:
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${
                                        feedback.resolved
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-gray-500/20 text-gray-400"
                                      }`}
                                    >
                                      {feedback.resolved
                                        ? "Resolved"
                                        : "Pending"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

interface ModelMetrics {
  modelUsage: Array<{
    model: string;
    count: number;
    percentage: string;
  }>;
  modelRatingAvg: Array<{
    model: string;
    avgRating: string;
    feedbackCount: number;
    totalMessages: number;
    feedbackRate: string;
  }>;
  modelTrends: Record<string, unknown>[];
  modelSatisfaction: Array<{
    model: string;
    avgRating: string;
    positiveCount: number;
    negativeCount: number;
    totalFeedback: number;
    satisfactionRate: string;
  }>;
  allModels: string[];
}

const ModelPerformance = () => {
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("all");
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch model performance data
  useEffect(() => {
    const fetchModelMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dashboard/model-performance");
        if (!response.ok) {
          throw new Error("Failed to fetch model performance data");
        }
        const result = await response.json();
        setModelMetrics(result.data);
      } catch (error) {
        console.error("Error fetching model performance:", error);
        toast({
          title: "Error",
          description: "Failed to load model performance data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModelMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-900/50">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-32"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!modelMetrics) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">No model performance data available</p>
      </div>
    );
  }

  // Filter data based on selected model
  const filteredUsage = selectedModel === "all" 
    ? modelMetrics.modelUsage 
    : modelMetrics.modelUsage.filter(m => m.model === selectedModel);

  const filteredSatisfaction = selectedModel === "all"
    ? modelMetrics.modelSatisfaction
    : modelMetrics.modelSatisfaction.filter(m => m.model === selectedModel);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {modelMetrics.allModels?.map((model: string) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Total Models</div>
              <div className="text-3xl font-bold text-blue-400">
                {modelMetrics.allModels?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Most Used Model</div>
              <div className="text-lg font-bold text-green-400">
                {modelMetrics.modelUsage?.[0]?.model || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Highest Rated</div>
              <div className="text-lg font-bold text-purple-400">
                {modelMetrics.modelRatingAvg?.[0]?.model || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Best Satisfaction</div>
              <div className="text-lg font-bold text-orange-400">
                {modelMetrics.modelSatisfaction?.[0]?.model || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage Distribution */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Model Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="model" 
                    stroke="#9CA3AF" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Performance vs Usage */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Performance vs Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelMetrics.modelRatingAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="model" 
                    stroke="#9CA3AF" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                  />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value) => [`${value}%`, "Avg Rating"]}
                  />
                  <Bar dataKey="avgRating" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage Trends */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Usage Trends (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modelMetrics.modelTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                  {modelMetrics.allModels?.slice(0, 5).map((model: string, index: number) => (
                    <Line
                      key={model}
                      type="monotone"
                      dataKey={model}
                      stroke={[
                        "#3B82F6",
                        "#10B981",
                        "#F59E0B",
                        "#EF4444",
                        "#8B5CF6",
                      ][index % 5]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Satisfaction */}
        <Card className="bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Model Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredSatisfaction}
                    dataKey="satisfactionRate"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#3B82F6"
                    label={({value, name}) => `${name}: ${value}%`}
                  >
                    {filteredSatisfaction.map((entry, index: number) => (
                      <Cell
                        key={index}
                        fill={[
                          "#3B82F6",
                          "#10B981", 
                          "#F59E0B",
                          "#EF4444",
                          "#8B5CF6"
                        ][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Model Performance Table */}
      <Card className="bg-gray-900/50">
        <CardHeader>
          <CardTitle>Detailed Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-300">Model</th>
                  <th className="text-left p-4 text-gray-300">Usage Count</th>
                  <th className="text-left p-4 text-gray-300">Usage %</th>
                  <th className="text-left p-4 text-gray-300">Avg Rating</th>
                  <th className="text-left p-4 text-gray-300">Feedback Count</th>
                  <th className="text-left p-4 text-gray-300">Feedback Rate</th>
                  <th className="text-left p-4 text-gray-300">Satisfaction Rate</th>
                </tr>
              </thead>
              <tbody>
                {modelMetrics.modelUsage?.map((usage) => {
                  const rating = modelMetrics.modelRatingAvg?.find(r => r.model === usage.model);
                  const satisfaction = modelMetrics.modelSatisfaction?.find(s => s.model === usage.model);
                  
                  return (
                    <tr key={usage.model} className="border-b border-gray-800">
                      <td className="p-4 font-medium text-white">{usage.model}</td>
                      <td className="p-4 text-gray-300">{usage.count}</td>
                      <td className="p-4 text-gray-300">{usage.percentage}%</td>
                      <td className="p-4 text-gray-300">{rating?.avgRating || "N/A"}%</td>
                      <td className="p-4 text-gray-300">{rating?.feedbackCount || 0}</td>
                      <td className="p-4 text-gray-300">{rating?.feedbackRate || "0"}%</td>
                      <td className="p-4 text-gray-300">{satisfaction?.satisfactionRate || "N/A"}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState("chat");

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-black via-gray-900 to-black overflow-auto">
      {/* Enhanced Header with Gradient Background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-12"
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold leading-normal bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              CodeConnect Insights Hub
            </motion.h1>
            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Real-time monitoring and intelligence for developer interactions,
              user engagement, and platform performance metrics
            </motion.p>
          </motion.div>

          {/* Enhanced Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            <Tabs
              defaultValue="chat"
              className="space-y-8"
              onValueChange={setActiveTab}
            >
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 lg:grid-cols-5 bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-2 shadow-2xl">
                  <TabsTrigger
                    value="chat"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-800/50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat Monitoring</span>
                    <span className="sm:hidden">Chats</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="feedback"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-800/50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Feedback</span>
                    <span className="sm:hidden">Feedback</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-800/50"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Users</span>
                    <span className="sm:hidden">Users</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="model-performance"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-800/50"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Model Performance</span>
                    <span className="sm:hidden">Models</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="app-feedback"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300 hover:bg-gray-800/50"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">App Feedback</span>
                    <span className="sm:hidden">App</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content with Enhanced Animations */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="chat" className="mt-8">
                    <div className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
                      <ChatMonitoring />
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="mt-8">
                    <div className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
                      <FeedbackMonitoring />
                    </div>
                  </TabsContent>

                  <TabsContent value="users" className="mt-8">
                    <div className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
                      <UserMonitoring />
                    </div>
                  </TabsContent>

                  <TabsContent value="model-performance" className="mt-8">
                    <div className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
                      <ModelPerformance />
                    </div>
                  </TabsContent>

                  <TabsContent value="app-feedback" className="mt-8">
                    <div className="bg-gray-900/30 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
                      <ApplicationFeedbackMonitoring />
                    </div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default Dashboard;
