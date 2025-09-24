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
import { WhatsNewModal } from "./whats-new-modal";
import { WhatsNewTrigger } from "./whats-new-trigger";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, Settings } from "lucide-react";

export function WhatsNewDemo() {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const clearLocalStorage = () => {
    localStorage.removeItem("isc-code-connect-whats-new-seen");
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500">
          What&apos;s New Feature Demo
        </h1>
        <p className="text-muted-foreground">
          Test and preview the What&apos;s New modal component
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Manual Modal Trigger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Manual Modal
            </CardTitle>
            <CardDescription>
              Open the modal manually to preview its content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsManualModalOpen(true)}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Open What&apos;s New Modal
            </Button>
          </CardContent>
        </Card>

        {/* Trigger Components */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Components</CardTitle>
            <CardDescription>
              Different variants of the trigger component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Button Variant:</p>
              <WhatsNewTrigger variant="button" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Badge Variant:</p>
              <WhatsNewTrigger variant="badge" />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Demo Settings
            </CardTitle>
            <CardDescription>Control the demo behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Reset Demo:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLocalStorage}
                className="w-full"
              >
                Clear Local Storage
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                This will reset the &quot;seen&quot; status and reload the page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>{" "}
      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Features</CardTitle>
          <CardDescription>
            Click on any feature card to see detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">When You Click Cards</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Detailed feature descriptions</li>
                <li>• Key benefits and advantages</li>
                <li>• Step-by-step getting started guide</li>
                <li>• Direct action buttons to try features</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Interactive Elements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Navigation to actual feature pages</li>
                <li>• Demo availability indicators</li>
                <li>• Benefits with checkmark icons</li>
                <li>• Numbered getting started steps</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary">11 Detailed Views</Badge>
            <Badge variant="secondary">Interactive Cards</Badge>
            <Badge variant="secondary">Action Buttons</Badge>
            <Badge variant="secondary">Getting Started</Badge>
          </div>
        </CardContent>
      </Card>
      {/* Manual Modal */}
      <WhatsNewModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
}
