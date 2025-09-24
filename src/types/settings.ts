// Types for user settings and feature toggles

export interface FeatureSettings {
  githubCodeIntelligence: boolean;
  requirementBlueprint: boolean;
  salesforceExplorer: boolean;
  feedbackDashboard: boolean;
  allChats: boolean;
  adminDashboard: boolean;
  whatsNew: boolean;
  logAnalysis: boolean;
}

export interface UserSettings {
  features: FeatureSettings;
  lastUpdated: string;
}

export const DEFAULT_FEATURE_SETTINGS: FeatureSettings = {
  githubCodeIntelligence: true,
  requirementBlueprint: true,
  salesforceExplorer: true,
  feedbackDashboard: true,
  allChats: true,
  adminDashboard: true,
  whatsNew: true,
  logAnalysis: true,
};

export const FEATURE_DEFINITIONS = {
  githubCodeIntelligence: {
    label: "GitHub Code Intelligence",
    description:
      "Access GitHub repositories, analyze code, and view pull requests with AI insights",
    icon: "Github",
    category: "Development Tools",
  },
  requirementBlueprint: {
    label: "Requirement Blueprint",
    description:
      "Create and manage requirement blueprints for project planning",
    icon: "Lightbulb",
    category: "Project Management",
  },
  salesforceExplorer: {
    label: "Salesforce Explorer",
    description:
      "Explore Salesforce metadata, generate SOQL queries, and analyze org structure",
    icon: "Cloud",
    category: "Salesforce Tools",
  },
  feedbackDashboard: {
    label: "Feedback Dashboard",
    description:
      "Manage feedback, create JIRA tasks, and track user interactions",
    icon: "Heart",
    category: "Feedback & Analytics",
  },
  allChats: {
    label: "All Chats",
    description: "Browse and manage all your chat conversations",
    icon: "ListFilter",
    category: "Chat Management",
  },
  adminDashboard: {
    label: "Admin Dashboard",
    description:
      "Administrative tools for user and system management (admin only)",
    icon: "LayoutDashboard",
    category: "Administration",
  },
  whatsNew: {
    label: "What's New",
    description: "Stay updated with the latest features and improvements",
    icon: "Gift",
    category: "Information",
  },
  logAnalysis: {
    label: "Log Analysis",
    description:
      "Analyze Salesforce error logs and get AI-powered debugging insights",
    icon: "Bug",
    category: "Development Tools",
  },
} as const;
