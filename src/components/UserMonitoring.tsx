"use client";
import React, { useState, useEffect, useRef } from "react";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  User,
  Search,
  Download,
  Users,
  TrendingUp,
  Activity,
  MessageSquare,
  MessageCircle,
  Star,
  RefreshCw,
  Crown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cachedFetch } from "@/lib/cached-fetch";
import { Badge } from "@/components/ui/badge";

interface UserAnalytics {
  _id: string;
  name: string;
  email: string;
  lastLogin: Date | null;
  createdAt: Date;
  totalChats: number;
  totalMessages: number;
  totalFeedbacks: number;
  totalApplicationFeedbacks: number;
  averageRating: number;
  role: string;
  isActive: boolean;
  activityScore: number;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface UserActivityData {
  date: string;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
];

const UserMonitoring = () => {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
  const [activityData, setActivityData] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("activityScore");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  // Add a ref to prevent multiple simultaneous API calls
  const fetchingRef = useRef(false);

  // Update user role function
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Prevent multiple simultaneous updates for the same user
      if (updatingRoles.has(userId)) {
        return;
      }

      setUpdatingRoles((prev) => new Set(prev).add(userId));

      const response = await fetch("/api/users/update-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      // Update the local state to reflect the change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingRoles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const fetchUserAnalytics = async () => {
    if (fetchingRef.current) {
      console.log("Already fetching data, skipping...");
      return;
    }

    try {
      console.log("fetchUserAnalytics called at:", new Date().toISOString());
      fetchingRef.current = true;
      setLoading(true);

      // Fetch all user data
      const [analyticsRes, growthRes, activityRes] = await Promise.all([
        cachedFetch("/api/dashboard/users?action=analytics"),
        cachedFetch("/api/dashboard/users?action=growth"),
        cachedFetch("/api/dashboard/users?action=activity"),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setUsers(analyticsData.data || []);
      }

      if (growthRes.ok) {
        const growthResult = await growthRes.json();
        setGrowthData(growthResult.data || []);
      }

      if (activityRes.ok) {
        const activityResult = await activityRes.json();
        setActivityData(activityResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    console.log("UserMonitoring useEffect triggered");

    // Add a small delay to debounce rapid useEffect calls
    const timer = setTimeout(() => {
      fetchUserAnalytics();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const exportData = async () => {
    try {
      const response = await fetch(
        "/api/dashboard/users?action=export&format=csv"
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user-analytics-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "User data exported successfully",
        });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export user data",
        variant: "destructive",
      });
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === "active") return matchesSearch && user.isActive;
      if (filterBy === "inactive") return matchesSearch && !user.isActive;
      if (filterBy === "admin") return matchesSearch && user.role === "admin";
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "activityScore":
          return b.activityScore - a.activityScore;
        case "totalChats":
          return b.totalChats - a.totalChats;
        case "totalMessages":
          return b.totalMessages - a.totalMessages;
        case "averageRating":
          return b.averageRating - a.averageRating;
        case "lastLogin":
          return (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0);
        case "createdAt":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

  // Calculate summary metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const averageActivityScore =
    users.reduce((sum, u) => sum + u.activityScore, 0) / totalUsers;
  const totalChats = users.reduce((sum, u) => sum + u.totalChats, 0);
  const totalMessages = users.reduce((sum, u) => sum + u.totalMessages, 0);

  // Prepare chart data
  const roleDistribution = users.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const roleChartData = Object.entries(roleDistribution).map(
    ([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      percentage: ((count / totalUsers) * 100).toFixed(1),
    })
  );

  const activityScoreDistribution = [
    {
      range: "90-100",
      count: users.filter((u) => u.activityScore >= 90).length,
    },
    {
      range: "80-89",
      count: users.filter((u) => u.activityScore >= 80 && u.activityScore < 90)
        .length,
    },
    {
      range: "70-79",
      count: users.filter((u) => u.activityScore >= 70 && u.activityScore < 80)
        .length,
    },
    {
      range: "60-69",
      count: users.filter((u) => u.activityScore >= 60 && u.activityScore < 70)
        .length,
    },
    {
      range: "50-59",
      count: users.filter((u) => u.activityScore >= 50 && u.activityScore < 60)
        .length,
    },
    { range: "0-49", count: users.filter((u) => u.activityScore < 50).length },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
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
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-green-400">
                    {activeUsers}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((activeUsers / totalUsers) * 100).toFixed(1)}% active
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
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
                  <p className="text-gray-400 text-sm">Total Chats</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {totalChats}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(totalChats / totalUsers).toFixed(1)} avg per user
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
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
                  <p className="text-gray-400 text-sm">Total Messages</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {totalMessages}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(totalMessages / totalUsers).toFixed(1)} avg per user
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Activity Score</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {averageActivityScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">out of 100</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                User Growth (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthData}>
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
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="New Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalUsers"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                    name="Total Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5" />
                Daily Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
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
                    dataKey="activeUsers"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalChats"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Total Chats"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="w-5 h-5" />
                User Roles Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, percentage }) => `${role} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {roleChartData.map((_, index) => (
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

        {/* Activity Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Star className="w-5 h-5" />
                Activity Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                User Management
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "cards" : "table")
                  }
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-gray-300"
                >
                  {viewMode === "table" ? "Card View" : "Table View"}
                </Button>
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
                  onClick={fetchUserAnalytics}
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="activityScore">Activity Score</SelectItem>
                  <SelectItem value="totalChats">Total Chats</SelectItem>
                  <SelectItem value="totalMessages">Total Messages</SelectItem>
                  <SelectItem value="averageRating">Average Rating</SelectItem>
                  <SelectItem value="lastLogin">Last Login</SelectItem>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table/Cards */}
            {viewMode === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">
                        Activity Score
                      </TableHead>
                      <TableHead className="text-gray-300">Chats</TableHead>
                      <TableHead className="text-gray-300">Messages</TableHead>
                      <TableHead className="text-gray-300">
                        Avg Rating
                      </TableHead>
                      <TableHead className="text-gray-300">
                        Last Login
                      </TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} className="border-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(newRole) =>
                                updateUserRole(user._id, newRole)
                              }
                              disabled={updatingRoles.has(user._id)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue>
                                  <div className="flex items-center gap-1">
                                    {user.role === "admin" ? (
                                      <Crown className="w-3 h-3 text-yellow-500" />
                                    ) : (
                                      <User className="w-3 h-3 text-blue-500" />
                                    )}
                                    <span className="text-xs">
                                      {user.role.charAt(0).toUpperCase() +
                                        user.role.slice(1)}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-blue-500" />
                                    User
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingRoles.has(user._id) && (
                              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2 relative">
                              <div
                                className={`bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300`}
                                style={{
                                  width: `${Math.min(user.activityScore, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-white">
                              {user.activityScore}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          {user.totalChats}
                        </TableCell>
                        <TableCell className="text-white">
                          {user.totalMessages}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-white">
                              {user.averageRating}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Role Management */}
                    <div className="mb-3 p-2 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Role:</span>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) =>
                              updateUserRole(user._id, newRole)
                            }
                            disabled={updatingRoles.has(user._id)}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue>
                                <div className="flex items-center gap-1">
                                  {user.role === "admin" ? (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  ) : (
                                    <User className="w-3 h-3 text-blue-500" />
                                  )}
                                  <span className="text-xs">
                                    {user.role.charAt(0).toUpperCase() +
                                      user.role.slice(1)}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-blue-500" />
                                  User
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="w-3 h-3 text-yellow-500" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingRoles.has(user._id) && (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Activity Score:</span>
                        <span className="text-white font-medium">
                          {user.activityScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Chats:</span>
                        <span className="text-white">{user.totalChats}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Messages:</span>
                        <span className="text-white">{user.totalMessages}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Avg Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-white">
                            {user.averageRating}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Last Login:</span>
                        <span className="text-white">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No users found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserMonitoring;
