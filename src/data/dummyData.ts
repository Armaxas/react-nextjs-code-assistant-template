// dummyData.ts

export const chatData = [
  {
    id: "chat-001",
    userId: "john.doe",
    threadId: "thread-123",
    lastMessage: "Generate an Apex trigger for Account duplicate prevention",
    messagesCount: 6,
    rating: 9,
    feedback: "Excellent code generation with proper error handling",
    timestamp: "2025-01-24T10:30:00",
    messages: [
      {
        type: "query",
        content:
          "Can you help me create an Apex trigger to prevent duplicate accounts?",
        timestamp: "2025-01-24T10:30:00",
      },
      {
        type: "response",
        content:
          "I'll help you create an Apex trigger with duplicate prevention logic. Here's the implementation...",
        timestamp: "2025-01-24T10:30:05",
      },
      {
        type: "query",
        content: "Can you add error handling for bulk operations?",
        timestamp: "2025-01-24T10:31:00",
      },
      {
        type: "response",
        content: "Here's the updated trigger with bulk operation handling...",
        timestamp: "2025-01-24T10:31:10",
      },
    ],
  },
  {
    id: "chat-002",
    userId: "sarah.smith",
    threadId: "thread-456",
    lastMessage:
      "Create a Lightning Web Component for displaying account hierarchy",
    messagesCount: 8,
    rating: 7,
    feedback: "Good component, but could use more inline documentation",
    timestamp: "2025-01-24T11:45:00",
    messages: [
      {
        type: "query",
        content:
          "I need a LWC to display account hierarchy in a tree structure",
        timestamp: "2025-01-24T11:45:00",
      },
      {
        type: "response",
        content:
          "I'll help you create a Lightning Web Component with a tree structure...",
        timestamp: "2025-01-24T11:45:10",
      },
    ],
  },
  {
    id: "chat-003",
    userId: "mike.johnson",
    threadId: "thread-789",
    lastMessage: "Implement batch class for data cleanup",
    messagesCount: 4,
    rating: 10,
    feedback:
      "Perfect implementation with excellent performance considerations",
    timestamp: "2025-01-24T14:20:00",
    messages: [
      {
        type: "query",
        content: "Need a batch class to clean up old records",
        timestamp: "2025-01-24T14:20:00",
      },
      {
        type: "response",
        content:
          "Here's a batch class implementation with chunking and error handling...",
        timestamp: "2025-01-24T14:20:15",
      },
    ],
  },
  {
    id: "chat-004",
    userId: "emma.davis",
    threadId: "thread-101",
    lastMessage: "Debug SOQL query performance issue",
    messagesCount: 10,
    rating: 5,
    feedback:
      "Solution worked but took multiple iterations to understand the problem",
    timestamp: "2025-01-24T15:10:00",
    messages: [
      {
        type: "query",
        content: "My SOQL query is timing out in production",
        timestamp: "2025-01-24T15:10:00",
      },
      {
        type: "response",
        content: "Let's analyze your query and optimize it...",
        timestamp: "2025-01-24T15:10:10",
      },
    ],
  },
  {
    id: "chat-005",
    userId: "alex.wilson",
    threadId: "thread-202",
    lastMessage: "Create test classes for trigger framework",
    messagesCount: 12,
    rating: 8,
    feedback: "Comprehensive test coverage with good edge cases",
    timestamp: "2025-01-24T16:30:00",
    messages: [
      {
        type: "query",
        content: "Need help creating test classes for my trigger framework",
        timestamp: "2025-01-24T16:30:00",
      },
      {
        type: "response",
        content: "I'll help you create comprehensive test classes...",
        timestamp: "2025-01-24T16:30:15",
      },
    ],
  },
];

export const feedbackList = [
  {
    id: 1,
    userId: "john.doe",
    threadId: "thread-123",
    rating: 9,
    feedback: "Excellent code generation with proper error handling",
    timestamp: "2025-01-24T10:30:00",
    query: "Generate an Apex trigger for Account duplicate prevention",
    response:
      "Here's the implementation of the Apex trigger with duplicate prevention...",
    category: "Code Generation",
    resolved: true,
  },
  {
    id: 2,
    userId: "sarah.smith",
    threadId: "thread-456",
    rating: 7,
    feedback: "Good component, but could use more inline documentation",
    timestamp: "2025-01-24T11:45:00",
    query: "Create a Lightning Web Component for displaying account hierarchy",
    response: "Here's the LWC implementation with tree structure...",
    category: "LWC Development",
    resolved: true,
  },
  {
    id: 3,
    userId: "mike.johnson",
    threadId: "thread-789",
    rating: 10,
    feedback:
      "Perfect implementation with excellent performance considerations",
    timestamp: "2025-01-24T14:20:00",
    query: "Implement batch class for data cleanup",
    response: "Here's the batch class implementation...",
    category: "Apex Development",
    resolved: true,
  },
  {
    id: 4,
    userId: "emma.davis",
    threadId: "thread-101",
    rating: 5,
    feedback:
      "Solution worked but took multiple iterations to understand the problem",
    timestamp: "2025-01-24T15:10:00",
    query: "Debug SOQL query performance issue",
    response: "After analyzing your query, here are the optimizations...",
    category: "Performance",
    resolved: true,
  },
  {
    id: 5,
    userId: "alex.wilson",
    threadId: "thread-202",
    rating: 8,
    feedback: "Comprehensive test coverage with good edge cases",
    timestamp: "2025-01-24T16:30:00",
    query: "Create test classes for trigger framework",
    response: "Here are the test classes with various scenarios...",
    category: "Testing",
    resolved: true,
  },
];

export const feedbackMetrics = {
  ratingDistribution: [
    { rating: 10, count: 45, color: "#22c55e" },
    { rating: 9, count: 30, color: "#84cc16" },
    { rating: 8, count: 25, color: "#86efac" },
    { rating: 7, count: 15, color: "#fde047" },
    { rating: 6, count: 10, color: "#fdba74" },
    { rating: 5, count: 8, color: "#f97316" },
    { rating: 4, count: 5, color: "#ef4444" },
    { rating: 3, count: 3, color: "#dc2626" },
    { rating: 2, count: 2, color: "#b91c1c" },
    { rating: 1, count: 1, color: "#7f1d1d" },
  ],
  ratingTrends: [
    { date: "Jan 20", rating: 8.5, count: 42 },
    { date: "Jan 21", rating: 8.8, count: 38 },
    { date: "Jan 22", rating: 9.2, count: 45 },
    { date: "Jan 23", rating: 8.9, count: 40 },
    { date: "Jan 24", rating: 9.5, count: 50 },
  ],
  categoryBreakdown: [
    { category: "Code Generation", count: 125, avgRating: 8.9 },
    { category: "LWC Development", count: 98, avgRating: 8.5 },
    { category: "Testing", count: 75, avgRating: 8.7 },
    { category: "Performance", count: 45, avgRating: 7.8 },
    { category: "Debugging", count: 35, avgRating: 8.2 },
  ],
  timeBasedMetrics: {
    lastHour: { count: 12, avgRating: 8.8 },
    last24Hours: { count: 144, avgRating: 8.6 },
    lastWeek: { count: 892, avgRating: 8.7 },
    lastMonth: { count: 3245, avgRating: 8.5 },
  },
  userMetrics: [
    {
      userId: "john.doe",
      totalInteractions: 45,
      avgRating: 9.2,
      topCategory: "Code Generation",
    },
    {
      userId: "sarah.smith",
      totalInteractions: 38,
      avgRating: 8.8,
      topCategory: "LWC Development",
    },
    {
      userId: "mike.johnson",
      totalInteractions: 32,
      avgRating: 9.5,
      topCategory: "Testing",
    },
  ],
};
