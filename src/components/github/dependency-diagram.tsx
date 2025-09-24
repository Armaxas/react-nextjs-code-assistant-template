"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  Position,
  MarkerType,
} from "@xyflow/react";
// @ts-expect-error: dagre types not available
import dagre from "dagre";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ModelSelector } from "@/components/ui/model-selector";
import { useModelSelection } from "@/hooks/use-model-selection";
import { useModels } from "@/hooks/use-models";
import {
  AlertCircle,
  Code,
  Eye,
  FileCode,
  Filter,
  Github,
  Loader2,
  Network,
  RefreshCw,
  Search,
  Zap,
  List,
  Target,
  ArrowRight,
  ArrowRightLeft,
} from "lucide-react";
import {
  DependencyGraph,
  DependencyNode,
} from "@/services/github-dependency-service";
import { Repository } from "@/services/github-assistant-service";
import { toast } from "sonner";

interface DependencyDiagramProps {
  selectedRepos: Repository[];
  onLoadComplete?: () => void;
}

interface NodeData {
  name: string;
  repo: string;
  path: string;
  type: string;
  size?: number;
  url?: string;
}

// Custom Node Component
const CustomNode = ({ data }: { data: NodeData }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "apex":
        return <Code className="h-4 w-4" />;
      case "lwc":
        return <Zap className="h-4 w-4" />;
      case "test":
        return <Target className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "apex":
        return "bg-blue-900/20 border-blue-400 text-blue-300 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200";
      case "lwc":
        return "bg-green-900/20 border-green-400 text-green-300 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200";
      case "test":
        return "bg-orange-900/20 border-orange-400 text-orange-300 dark:bg-orange-900/30 dark:border-orange-500 dark:text-orange-200";
      default:
        return "bg-gray-900/20 border-gray-400 text-gray-300 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200";
    }
  };

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md border-2 ${getNodeColor(
        data.type
      )} min-w-[120px] max-w-[200px]`}
    >
      <div className="flex items-center space-x-2">
        {getNodeIcon(data.type)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" title={data.name}>
            {data.name}
          </div>
          <div className="text-xs opacity-75 truncate" title={data.repo}>
            {data.repo}
          </div>
        </div>
      </div>
    </div>
  );
};

// Node types configuration
const nodeTypes = {
  custom: CustomNode,
};

// Layout function using Dagre
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 172;
  const nodeHeight = 64;

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

// Detailed Dependency View Component
interface DetailedDependencyViewProps {
  dependencyGraph: DependencyGraph | null;
  selectedFile: DependencyNode | null;
  onFileSelect: (file: DependencyNode) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

function DetailedDependencyView({
  dependencyGraph,
  selectedFile,
  onFileSelect,
  searchTerm,
  onSearchChange,
}: DetailedDependencyViewProps) {
  const [groupBy, setGroupBy] = useState<"repository" | "type">("repository");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!dependencyGraph) {
    return (
      <div className="flex items-center justify-center h-full">
        {" "}
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No data available</h3>
          <p className="text-sm text-muted-foreground">
            Select repositories to view dependencies
          </p>
        </div>
      </div>
    );
  }

  // Filter nodes based on search term
  const filteredNodes = dependencyGraph.nodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.repo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group nodes
  const groupedNodes = filteredNodes.reduce(
    (groups, node) => {
      const key = groupBy === "repository" ? node.repo : node.type;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(node);
      return groups;
    },
    {} as Record<string, DependencyNode[]>
  );

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Controls */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files, paths, or repositories..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Group by:</label>
            <Select
              value={groupBy}
              onValueChange={(value: "repository" | "type") =>
                setGroupBy(value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repository">Repository</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary">{filteredNodes.length} files found</Badge>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {Object.keys(groupedNodes).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No dependencies found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {Object.entries(groupedNodes).map(([groupKey, nodes]) => (
              <div key={groupKey}>
                <Button
                  variant="ghost"
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full justify-between p-2 h-auto"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">{groupKey}</div>
                    <Badge variant="outline">{nodes.length}</Badge>
                  </div>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      expandedGroups.has(groupKey) ? "rotate-90" : ""
                    }`}
                  />
                </Button>

                {expandedGroups.has(groupKey) && (
                  <div className="ml-4 space-y-1">
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => onFileSelect(node)}
                        className={`p-2 rounded cursor-pointer border transition-colors ${
                          selectedFile?.id === node.id
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted hover:bg-muted/80 border-border"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {node.type === "apex" && (
                            <Code className="h-4 w-4 text-blue-600" />
                          )}
                          {node.type === "lwc" && (
                            <Zap className="h-4 w-4 text-green-600" />
                          )}
                          {node.type === "test" && (
                            <Target className="h-4 w-4 text-orange-600" />
                          )}
                          {node.type === "other" && (
                            <FileCode className="h-4 w-4 text-gray-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {node.name}
                            </div>{" "}
                            <div className="text-xs text-muted-foreground truncate">
                              {node.path}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main React Flow Component
function ReactFlowDiagram({
  dependencyGraph,
  onNodeSelect,
}: {
  dependencyGraph: DependencyGraph | null;
  onNodeSelect: (node: DependencyNode | null) => void;
}) {
  // Initialize with proper types
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const { fitView } = useReactFlow();

  // Convert dependency graph to React Flow format
  useEffect(() => {
    if (!dependencyGraph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes
    const reactFlowNodes: Node[] = dependencyGraph.nodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        ...node,
        label: node.name,
      },
    }));

    // Create edges
    const reactFlowEdges: Edge[] = dependencyGraph.links.map((link, index) => ({
      id: `edge-${index}`,
      source: link.source,
      target: link.target,
      type: "smoothstep",
      animated: link.strength > 7,
      style: {
        strokeWidth: Math.max(1, link.strength / 2),
        stroke: getEdgeColor(link.type),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getEdgeColor(link.type),
      },
      label: link.type,
      labelStyle: {
        fontSize: 10,
        fontWeight: 500,
      },
    }));

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      reactFlowNodes,
      reactFlowEdges,
      layoutDirection
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.1 });
    }, 100);
  }, [dependencyGraph, layoutDirection, setNodes, setEdges, fitView]);

  const getEdgeColor = (type: string) => {
    switch (type) {
      case "import":
        return "#3b82f6"; // blue
      case "extends":
        return "#10b981"; // green
      case "implements":
        return "#8b5cf6"; // purple
      case "references":
        return "#f59e0b"; // yellow
      case "tests":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const dependencyNode = dependencyGraph?.nodes.find(
        (n) => n.id === node.id
      );
      onNodeSelect(dependencyNode || null);
    },
    [dependencyGraph, onNodeSelect]
  );

  const toggleLayout = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls />
        <MiniMap
          nodeColor={(node: Node) => {
            const nodeData = node.data;
            switch (nodeData.type) {
              case "apex":
                return "#3b82f6";
              case "lwc":
                return "#10b981";
              case "test":
                return "#f59e0b";
              default:
                return "#6b7280";
            }
          }}
          className="bg-card border border-border"
        />
        <Background gap={12} size={1} />
      </ReactFlow>

      {/* Layout Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={toggleLayout}
          variant="outline"
          size="sm"
          className="bg-card shadow-md"
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          {layoutDirection === "TB" ? "Horizontal" : "Vertical"}
        </Button>
      </div>
    </div>
  );
}

// Main Component
export function DependencyDiagram({
  selectedRepos,
  onLoadComplete,
}: DependencyDiagramProps) {
  const [dependencyGraph, setDependencyGraph] =
    useState<DependencyGraph | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<DependencyGraph | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);

  // Filter states
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>("all");
  const [linkTypeFilter, setLinkTypeFilter] = useState<string>("all");
  const [linkStrength, setLinkStrength] = useState<number[]>([1]);
  const [currentView, setCurrentView] = useState<"diagram" | "detailed">(
    "diagram"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Model selection for AI analysis
  const { isLoading: isLoadingModels } = useModels();
  const { selectedModel, setSelectedModel } = useModelSelection({
    storageKey: "dependency-diagram-model",
  });

  // Fetch dependency data when selected repos change
  useEffect(() => {
    if (selectedRepos.length === 0) return;

    const fetchDependencyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/github/dependencies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repositories: selectedRepos.map((repo) => repo.name),
            fileTypes: ["apex", "lwc", "test"],
            maxFiles: 200,
            selectedModel,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dependency data");
        }

        const data = await response.json();
        setDependencyGraph(data);
        setFilteredGraph(data);
        if (onLoadComplete) {
          onLoadComplete();
        }
      } catch (err) {
        console.error("Error fetching dependency data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        toast.error("Failed to load dependency data");
      } finally {
        setLoading(false);
      }
    };

    fetchDependencyData();
  }, [selectedRepos, onLoadComplete, selectedModel]);

  // Apply filters when they change
  useEffect(() => {
    if (!dependencyGraph) return;

    // Filter nodes by type
    let filteredNodes = dependencyGraph.nodes;
    if (nodeTypeFilter !== "all") {
      filteredNodes = dependencyGraph.nodes.filter(
        (node) => node.type === nodeTypeFilter
      );
    }

    // Get node IDs to filter links properly
    const nodeIds = new Set(filteredNodes.map((node) => node.id));

    // Filter links by type and strength
    let filteredLinks = dependencyGraph.links;
    if (linkTypeFilter !== "all") {
      filteredLinks = filteredLinks.filter(
        (link) => link.type === linkTypeFilter
      );
    }

    // Filter by link strength
    filteredLinks = filteredLinks.filter(
      (link) => link.strength >= linkStrength[0]
    );

    // Only include links where both source and target nodes exist in filtered nodes
    filteredLinks = filteredLinks.filter(
      (link) => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    // Create filtered graph
    setFilteredGraph({
      nodes: filteredNodes,
      links: filteredLinks,
      metadata: {
        ...dependencyGraph.metadata,
        nodeCount: filteredNodes.length,
        linkCount: filteredLinks.length,
      },
    });
  }, [dependencyGraph, nodeTypeFilter, linkTypeFilter, linkStrength]);

  // Handle refreshing the data
  const handleRefresh = () => {
    setDependencyGraph(null);
    setFilteredGraph(null);
    setSelectedNode(null);
    if (selectedRepos.length > 0) {
      // Re-trigger the useEffect for data fetching
      setLoading(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold flex items-center text-foreground">
              <Network className="mr-2 h-5 w-5" />
              Dependency Analysis
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="ml-2">
                {filteredGraph?.nodes.length || 0} Files
              </Badge>
              <Badge variant="outline">
                {filteredGraph?.links.length || 0} Connections
              </Badge>
            </div>
          </div>

          {/* Model Selection and Actions */}
          <div className="flex items-center space-x-4">
            {/* Model Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">
                AI Model:
              </label>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                size="sm"
                placeholder="Select model"
                disabled={isLoadingModels}
                className="w-48"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>

              <Tabs
                value={currentView}
                onValueChange={(value: string) =>
                  setCurrentView(value as "diagram" | "detailed")
                }
              >
                <TabsList>
                  <TabsTrigger value="diagram">
                    <Network className="h-4 w-4 mr-1" />
                    Diagram
                  </TabsTrigger>
                  <TabsTrigger value="detailed">
                    <List className="h-4 w-4 mr-1" />
                    Detailed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Node Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apex">Apex</SelectItem>
                <SelectItem value="lwc">LWC</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relations</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="extends">Extends</SelectItem>
                <SelectItem value="implements">Implements</SelectItem>
                <SelectItem value="references">References</SelectItem>
                <SelectItem value="tests">Tests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Strength:</span>
            <div className="w-20">
              <Slider
                value={linkStrength}
                onValueChange={setLinkStrength}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground w-8">
              {linkStrength[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Analyzing repository dependencies...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error loading data</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredGraph?.nodes.length === 0 ? (
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <Network className="h-10 w-10 text-muted-foreground mb-2 mx-auto" />
              <h3 className="text-lg font-medium">No dependencies found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or select different repositories
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Main view */}
            <div className="flex-1">
              {currentView === "diagram" ? (
                <ReactFlowProvider>
                  <ReactFlowDiagram
                    dependencyGraph={filteredGraph}
                    onNodeSelect={setSelectedNode}
                  />
                </ReactFlowProvider>
              ) : (
                <DetailedDependencyView
                  dependencyGraph={filteredGraph}
                  selectedFile={selectedNode}
                  onFileSelect={setSelectedNode}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              )}
            </div>

            {/* Side panel for selected node */}
            {selectedNode && (
              <div className="w-80 border-l border-border bg-card">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">File Details</h3>
                    <Button
                      onClick={() => setSelectedNode(null)}
                      variant="ghost"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        {selectedNode.type === "apex" && (
                          <Code className="h-4 w-4 text-blue-600" />
                        )}
                        {selectedNode.type === "lwc" && (
                          <Zap className="h-4 w-4 text-green-600" />
                        )}
                        {selectedNode.type === "test" && (
                          <Target className="h-4 w-4 text-orange-600" />
                        )}
                        {selectedNode.type === "other" && (
                          <FileCode className="h-4 w-4 text-gray-600" />
                        )}
                        <Badge className="capitalize">
                          {selectedNode.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {selectedNode.repo}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">File Name</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.name}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Path</h4>
                      <p className="text-sm text-muted-foreground break-all">
                        {selectedNode.path}
                      </p>
                    </div>

                    {selectedNode.size && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Size</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedNode.size} bytes
                        </span>
                      </div>
                    )}

                    {selectedNode.url && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            window.open(selectedNode.url, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View on GitHub
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
