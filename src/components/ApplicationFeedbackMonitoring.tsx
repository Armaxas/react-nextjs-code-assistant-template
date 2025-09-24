"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  MessageSquare,
  Search,
  Download,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  RefreshCw,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cachedFetch } from "@/lib/cached-fetch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationFeedback {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  feedbackType: "feature_request" | "bug_report" | "suggestion" | "other";
  type?: "feature_request" | "bug_report" | "suggestion" | "other"; // fallback
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  tags: string[];
  votes?: number;
  upvotes?: number;
  downvotes?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  userInfo?: {
    name: string;
    email: string;
  };
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "feature_request":
      return "bg-blue-500";
    case "bug_report":
      return "bg-red-500";
    case "suggestion":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-500";
    case "in_progress":
      return "bg-yellow-500";
    case "resolved":
      return "bg-green-500";
    case "closed":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const ApplicationFeedbackMonitoring = () => {
  const [feedbacks, setFeedbacks] = useState<ApplicationFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedFeedback, setSelectedFeedback] =
    useState<ApplicationFeedback | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());

  const fetchApplicationFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await cachedFetch("/api/application-feedback");

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      } else {
        console.error("Failed to fetch application feedbacks");
        toast({
          title: "Error",
          description: "Failed to fetch application feedbacks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching application feedbacks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch application feedbacks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationFeedbacks();
  }, []);

  const exportData = async () => {
    try {
      const response = await fetch("/api/application-feedback?export=csv");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `application-feedback-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Application feedback data exported successfully",
        });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export application feedback data",
        variant: "destructive",
      });
    }
  };

  // Update feedback status
  const updateFeedbackStatus = async (
    feedbackId: string,
    newStatus: string
  ) => {
    try {
      // Prevent multiple simultaneous updates for the same feedback
      if (updatingStatus.has(feedbackId)) {
        return;
      }

      setUpdatingStatus((prev) => new Set(prev).add(feedbackId));

      const response = await fetch("/api/application-feedback", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update feedback status");
      }

      // Update the local state to reflect the change
      setFeedbacks((prevFeedbacks) =>
        prevFeedbacks.map((feedback) =>
          feedback._id === feedbackId
            ? {
                ...feedback,
                status: newStatus as
                  | "open"
                  | "in_progress"
                  | "resolved"
                  | "closed",
                updatedAt: new Date(),
              }
            : feedback
        )
      );

      // Update selected feedback if it's the one being updated
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setSelectedFeedback((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as
                  | "open"
                  | "in_progress"
                  | "resolved"
                  | "closed",
              }
            : null
        );
      }

      toast({
        title: "Success",
        description: `Feedback status updated to ${newStatus.replace("_", " ")}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update feedback status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(feedbackId);
        return newSet;
      });
    }
  };

  // Filter and sort feedbacks
  const filteredFeedbacks = feedbacks
    .filter((feedback) => {
      const userName = feedback.userName || feedback.userInfo?.name || "";
      const userEmail = feedback.userEmail || feedback.userInfo?.email || "";

      const matchesSearch =
        (feedback.title &&
          feedback.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (feedback.description &&
          feedback.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (userName &&
          userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (userEmail &&
          userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const feedbackType = feedback.feedbackType || feedback.type || "";
      const matchesType = filterType === "all" || feedbackType === filterType;
      const matchesStatus =
        filterStatus === "all" || feedback.status === filterStatus;
      const matchesPriority =
        filterPriority === "all" || feedback.priority === filterPriority;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "votes":
          return (b.votes || b.upvotes || 0) - (a.votes || a.upvotes || 0);
        case "priority":
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // Calculate metrics
  const totalFeedbacks = feedbacks.length;
  const openFeedbacks = feedbacks.filter((f) => f.status === "open").length;
  const resolvedFeedbacks = feedbacks.filter(
    (f) => f.status === "resolved"
  ).length;
  const averageVotes =
    feedbacks.reduce((sum, f) => sum + (f.votes || f.upvotes || 0), 0) /
      totalFeedbacks || 0;

  // Chart data
  const typeDistribution = feedbacks.reduce(
    (acc, feedback) => {
      const type = feedback.feedbackType || feedback.type || "other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const typeChartData = Object.entries(typeDistribution).map(
    ([type, count]) => ({
      type: type
        ? type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "Unknown",
      count,
    })
  );

  const statusDistribution = feedbacks.reduce(
    (acc, feedback) => {
      const status = feedback.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusChartData = Object.entries(statusDistribution).map(
    ([status, count]) => ({
      status: status
        ? status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
        : "Unknown",
      count,
    })
  );

  const priorityDistribution = feedbacks.reduce(
    (acc, feedback) => {
      acc[feedback.priority] = (acc[feedback.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const priorityChartData = Object.entries(priorityDistribution).map(
    ([priority, count]) => ({
      priority:
        priority && priority.length > 0
          ? priority.charAt(0).toUpperCase() + priority.slice(1)
          : "Unknown",
      count,
    })
  );

  // Get trend data for the last 30 days
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];

    const dayFeedbacks = feedbacks.filter(
      (f) => new Date(f.createdAt).toISOString().split("T")[0] === dateStr
    );

    return {
      date: dateStr,
      count: dayFeedbacks.length,
      resolved: dayFeedbacks.filter((f) => f.status === "resolved").length,
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Feedback</p>
                  <p className="text-2xl font-bold text-white">
                    {totalFeedbacks}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Open Items</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {openFeedbacks}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalFeedbacks > 0
                      ? ((openFeedbacks / totalFeedbacks) * 100).toFixed(1)
                      : 0}
                    % pending
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolved</p>
                  <p className="text-2xl font-bold text-green-400">
                    {resolvedFeedbacks}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalFeedbacks > 0
                      ? ((resolvedFeedbacks / totalFeedbacks) * 100).toFixed(1)
                      : 0}
                    % resolved
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Votes</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {averageVotes.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">per feedback</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                Feedback Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="New Feedback"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5" />
                Feedback Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertCircle className="w-5 h-5" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="priority" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feedback Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5" />
                Application Feedback
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={exportData}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={fetchApplicationFeedbacks}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feature_request">
                    Feature Request
                  </SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="votes">Votes</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-300">Title</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Priority</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Votes</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback._id} className="border-gray-800">
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-white truncate">
                            {feedback.title}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {feedback.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(() => {
                              const userName =
                                feedback.userName ||
                                feedback.userInfo?.name ||
                                "U";
                              return userName.charAt(0).toUpperCase();
                            })()}
                          </div>
                          <div>
                            <div className="text-white text-sm">
                              {feedback.userName ||
                                feedback.userInfo?.name ||
                                "Unknown User"}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {feedback.userEmail ||
                                feedback.userInfo?.email ||
                                "No email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getTypeColor(feedback.feedbackType || feedback.type || "other")} text-white`}
                        >
                          {(() => {
                            const type = feedback.feedbackType || feedback.type;
                            return type
                              ? type
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())
                              : "Unknown";
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getPriorityColor(feedback.priority)} text-white`}
                        >
                          {feedback.priority && feedback.priority.length > 0
                            ? feedback.priority.charAt(0).toUpperCase() +
                              feedback.priority.slice(1)
                            : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(feedback.status)} text-white`}
                        >
                          {feedback.status
                            ? feedback.status
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())
                            : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-white">
                            {feedback.votes || feedback.upvotes || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Status Update Dropdown */}
                          <Select
                            value={feedback.status}
                            onValueChange={(newStatus) =>
                              updateFeedbackStatus(feedback._id, newStatus)
                            }
                            disabled={updatingStatus.has(feedback._id)}
                          >
                            <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem
                                value="open"
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                Open
                              </SelectItem>
                              <SelectItem
                                value="in_progress"
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                In Progress
                              </SelectItem>
                              <SelectItem
                                value="resolved"
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                Resolved
                              </SelectItem>
                              <SelectItem
                                value="closed"
                                className="text-gray-300 hover:bg-gray-700"
                              >
                                Closed
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* View Details Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-gray-800 border-gray-700 text-gray-300"
                                onClick={() => setSelectedFeedback(feedback)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  {selectedFeedback?.title}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedFeedback && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-gray-400 text-sm">
                                        Type
                                      </p>
                                      <Badge
                                        className={`${getTypeColor(selectedFeedback.feedbackType || selectedFeedback.type || "other")} text-white mt-1`}
                                      >
                                        {(() => {
                                          const type =
                                            selectedFeedback.feedbackType ||
                                            selectedFeedback.type;
                                          return type
                                            ? type
                                                .replace("_", " ")
                                                .replace(/\b\w/g, (l) =>
                                                  l.toUpperCase()
                                                )
                                            : "Unknown";
                                        })()}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-sm">
                                        Priority
                                      </p>
                                      <Badge
                                        className={`${getPriorityColor(selectedFeedback.priority)} text-white mt-1`}
                                      >
                                        {selectedFeedback.priority &&
                                        selectedFeedback.priority.length > 0
                                          ? selectedFeedback.priority
                                              .charAt(0)
                                              .toUpperCase() +
                                            selectedFeedback.priority.slice(1)
                                          : "Unknown"}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-sm">
                                        Status
                                      </p>
                                      <Badge
                                        className={`${getStatusColor(selectedFeedback.status)} text-white mt-1`}
                                      >
                                        {selectedFeedback.status
                                          ? selectedFeedback.status
                                              .replace("_", " ")
                                              .replace(/\b\w/g, (l) =>
                                                l.toUpperCase()
                                              )
                                          : "Unknown"}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-gray-400 text-sm">
                                        Votes
                                      </p>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span className="text-white">
                                          {selectedFeedback.votes ||
                                            selectedFeedback.upvotes ||
                                            0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">
                                      User
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                        {(() => {
                                          const userName =
                                            selectedFeedback.userName ||
                                            selectedFeedback.userInfo?.name ||
                                            "U";
                                          return userName
                                            .charAt(0)
                                            .toUpperCase();
                                        })()}
                                      </div>
                                      <div>
                                        <div className="text-white text-sm">
                                          {selectedFeedback.userName ||
                                            selectedFeedback.userInfo?.name ||
                                            "Unknown User"}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          {selectedFeedback.userEmail ||
                                            selectedFeedback.userInfo?.email ||
                                            "No email"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">
                                      Description
                                    </p>
                                    <Textarea
                                      value={selectedFeedback.description}
                                      readOnly
                                      className="bg-gray-800 border-gray-700 text-white"
                                      rows={6}
                                    />
                                  </div>

                                  {selectedFeedback.tags.length > 0 && (
                                    <div>
                                      <p className="text-gray-400 text-sm mb-2">
                                        Tags
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedFeedback.tags.map(
                                          (tag, index) => (
                                            <Badge
                                              key={index}
                                              variant="secondary"
                                            >
                                              {tag}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-400">Created</p>
                                      <p className="text-white">
                                        {new Date(
                                          selectedFeedback.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Updated</p>
                                      <p className="text-white">
                                        {new Date(
                                          selectedFeedback.updatedAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredFeedbacks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No feedback found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ApplicationFeedbackMonitoring;
