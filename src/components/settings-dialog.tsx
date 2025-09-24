"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings as SettingsIcon,
  Github,
  Lightbulb,
  Cloud,
  Heart,
  ListFilter,
  LayoutDashboard,
  Gift,
  Bug,
  RotateCcw,
  CheckCircle,
  Info,
} from "lucide-react";
import { useSettings } from "@/contexts/settings-context";
import { FEATURE_DEFINITIONS, FeatureSettings } from "@/types/settings";
import { User } from "@auth/core/types";
import { toast } from "sonner";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

const iconMap = {
  Github,
  Lightbulb,
  Cloud,
  Heart,
  ListFilter,
  LayoutDashboard,
  Gift,
  Bug,
};

const categoryColors = {
  "Development Tools":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Project Management":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Salesforce Tools":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Feedback & Analytics":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Chat Management":
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  Administration: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Information:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function SettingsDialog({ isOpen, onClose, user }: SettingsDialogProps) {
  const { settings, updateFeatureSetting, resetToDefaults, isLoading } =
    useSettings();
  const [localSettings, setLocalSettings] = useState(settings.features);

  // Check if user is admin
  const isAdmin = user && (user as { role?: string }).role === "admin";

  React.useEffect(() => {
    setLocalSettings(settings.features);
  }, [settings.features]);

  const handleToggle = (feature: keyof FeatureSettings, enabled: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [feature]: enabled }));
    updateFeatureSetting(feature, enabled);
    toast.success(
      `${FEATURE_DEFINITIONS[feature].label} ${enabled ? "enabled" : "disabled"}`
    );
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setLocalSettings(settings.features);
    toast.success("Settings reset to defaults");
  };

  const enabledFeaturesCount =
    Object.values(localSettings).filter(Boolean).length;
  const totalFeaturesCount = Object.keys(localSettings).length;

  // Group features by category
  const groupedFeatures = Object.entries(FEATURE_DEFINITIONS).reduce(
    (acc, [key, definition]) => {
      // Skip admin dashboard if user is not admin
      if (key === "adminDashboard" && !isAdmin) {
        return acc;
      }

      if (!acc[definition.category]) {
        acc[definition.category] = [];
      }
      acc[definition.category].push({
        key: key as keyof FeatureSettings,
        ...definition,
      });
      return acc;
    },
    {} as Record<
      string,
      Array<
        {
          key: keyof FeatureSettings;
        } & (typeof FEATURE_DEFINITIONS)[keyof typeof FEATURE_DEFINITIONS]
      >
    >
  );

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Feature Settings
                </DialogTitle>
                <DialogDescription>
                  Customize which features are visible in your navigation.
                  Changes are saved automatically.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Overview Stats */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">
                {enabledFeaturesCount} of {totalFeaturesCount} features enabled
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reset to Default Settings?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will enable all features and restore the default
                    configuration. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefaults}>
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Features by Category - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">{category}</h3>
                <Badge
                  variant="secondary"
                  className={
                    categoryColors[category as keyof typeof categoryColors]
                  }
                >
                  {features.length} feature{features.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid gap-3">
                {features.map(({ key, label, description, icon }) => {
                  const IconComponent = iconMap[icon as keyof typeof iconMap];
                  const isEnabled = localSettings[key];

                  return (
                    <Card
                      key={key}
                      className={`transition-all duration-200 ${isEnabled ? "ring-1 ring-primary/20" : "opacity-75"}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10" : "bg-muted"} transition-colors`}
                            >
                              <IconComponent
                                className={`h-4 w-4 ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {label}
                                </h4>
                                {key === "adminDashboard" && (
                                  <Badge variant="outline" className="text-xs">
                                    Admin Only
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                handleToggle(key, checked)
                              }
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {Object.keys(groupedFeatures).indexOf(category) <
                Object.keys(groupedFeatures).length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="p-6 pt-4 border-t bg-muted/20">
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">About Feature Settings</p>
              <p className="text-xs">
                Disabled features will be hidden from your navigation but can be
                re-enabled at any time. Your settings are saved locally and will
                persist across browser sessions.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
