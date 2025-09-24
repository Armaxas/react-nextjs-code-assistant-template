import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface DependencyGraphProps {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    repo: string;
    path: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
    context?: string;
    lineNumber?: number;
  }>;
  className?: string;
}

type LayoutType = "hierarchical" | "circular" | "force" | "grid";

// Hierarchical Layout - Best for dependency flow understanding
const getHierarchicalLayout = (
  nodes: DependencyGraphProps["nodes"],
  links: DependencyGraphProps["links"],
  targetNodeId: string
) => {
  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();

  // Initialize edge maps
  nodes.forEach((node) => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  // Build edge maps
  links.forEach((link) => {
    outgoingEdges.get(link.source)?.push(link.target);
    incomingEdges.get(link.target)?.push(link.source);
  });

  const levels: string[][] = [];
  const visited = new Set<string>();

  // Level 0: Target node (center)
  levels.push([targetNodeId]);
  visited.add(targetNodeId);

  // Level -1: Direct dependencies (nodes that target depends on)
  const directDeps = incomingEdges.get(targetNodeId) || [];
  if (directDeps.length > 0) {
    const filteredDeps = directDeps.filter((id) => !visited.has(id));
    if (filteredDeps.length > 0) {
      levels.unshift(filteredDeps);
      filteredDeps.forEach((id) => visited.add(id));
    }
  }

  // Level -2: Second level dependencies
  const secondLevelDeps = directDeps.flatMap((dep) =>
    (incomingEdges.get(dep) || []).filter((id) => !visited.has(id))
  );
  if (secondLevelDeps.length > 0) {
    levels.unshift(secondLevelDeps);
    secondLevelDeps.forEach((id) => visited.add(id));
  }

  // Level +1: Direct dependents (nodes that depend on target)
  const directDependents = outgoingEdges.get(targetNodeId) || [];
  if (directDependents.length > 0) {
    const filteredDependents = directDependents.filter(
      (id) => !visited.has(id)
    );
    if (filteredDependents.length > 0) {
      levels.push(filteredDependents);
      filteredDependents.forEach((id) => visited.add(id));
    }
  }

  // Level +2: Second level dependents
  const secondLevelDependents = directDependents.flatMap((dep) =>
    (outgoingEdges.get(dep) || []).filter((id) => !visited.has(id))
  );
  if (secondLevelDependents.length > 0) {
    levels.push(secondLevelDependents);
    secondLevelDependents.forEach((id) => visited.add(id));
  }

  // Place remaining nodes in final level
  const remaining = nodes.filter((n) => !visited.has(n.id));
  if (remaining.length > 0) {
    levels.push(remaining.map((n) => n.id));
  }

  // Calculate positions with much better spacing
  const positions = new Map<string, { x: number; y: number }>();
  const levelHeight = 180; // Increased vertical spacing
  const minNodeSpacing = 200; // Minimum horizontal spacing between nodes
  const baseY = 100;

  levels.forEach((level, levelIndex) => {
    if (level.length === 0) return;

    const y = baseY + levelIndex * levelHeight;

    // Calculate horizontal spacing
    const totalWidth = Math.max(level.length * minNodeSpacing, 1000);
    const startX = (1200 - totalWidth) / 2; // Center on wider canvas
    const nodeSpacing = totalWidth / Math.max(level.length - 1, 1);

    level.forEach((nodeId, nodeIndex) => {
      let x: number;
      if (level.length === 1) {
        x = 600; // Center single nodes
      } else {
        x = startX + nodeIndex * nodeSpacing;
      }

      // Add some random jitter to avoid perfect alignment (looks more natural)
      const jitterX = (Math.random() - 0.5) * 30;
      const jitterY = (Math.random() - 0.5) * 20;

      positions.set(nodeId, {
        x: x + jitterX,
        y: y + jitterY,
      });
    });
  });

  return positions;
};

// Grid Layout - Organized by type with better spacing
const getGridLayout = (
  nodes: DependencyGraphProps["nodes"],
  targetNodeId: string
) => {
  const nodesByType = new Map<string, DependencyGraphProps["nodes"]>();
  nodes.forEach((node) => {
    const type = node.type || "other";
    if (!nodesByType.has(type)) nodesByType.set(type, []);
    nodesByType.get(type)!.push(node);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const typeOrder = ["apex", "trigger", "lwc", "test", "flow", "other"];
  let currentY = 80;

  typeOrder.forEach((type) => {
    if (!nodesByType.has(type)) return;

    const typeNodes = nodesByType.get(type)!;
    const nodesPerRow = Math.min(Math.ceil(Math.sqrt(typeNodes.length)), 6); // Max 6 per row
    const nodeSpacing = 220; // Increased spacing
    const rowHeight = 140; // Increased row height

    typeNodes.forEach((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;

      // Center the row
      const rowWidth = Math.min(typeNodes.length, nodesPerRow) * nodeSpacing;
      const startX = (1200 - rowWidth) / 2;

      // Give target node a special highlighted position
      const isTarget = node.id === targetNodeId;
      const baseX = startX + col * nodeSpacing + 110; // Center in grid cell
      const baseY = currentY + row * rowHeight;

      positions.set(node.id, {
        x: isTarget ? baseX + 10 : baseX, // Slight offset for target
        y: isTarget ? baseY - 5 : baseY,
      });
    });

    const rows = Math.ceil(typeNodes.length / nodesPerRow);
    currentY += rows * rowHeight + 60; // Extra spacing between type groups
  });

  return positions;
};

// Improved circular layout with concentric rings
const getCircularLayout = (
  nodes: DependencyGraphProps["nodes"],
  targetNodeId: string
) => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 600,
    centerY = 400; // Larger center coordinates

  // Place target in center
  positions.set(targetNodeId, { x: centerX, y: centerY });

  const otherNodes = nodes.filter((n) => n.id !== targetNodeId);

  if (otherNodes.length === 0) return positions;

  // Create concentric rings for better distribution
  const ringsNeeded = Math.ceil(otherNodes.length / 12); // Max 12 nodes per ring

  let nodeIndex = 0;
  for (let ring = 0; ring < ringsNeeded; ring++) {
    const nodesInThisRing = Math.min(12, otherNodes.length - nodeIndex);
    const radius = 180 + ring * 120; // Increase radius for each ring

    for (let i = 0; i < nodesInThisRing; i++) {
      if (nodeIndex >= otherNodes.length) break;

      const node = otherNodes[nodeIndex];
      const angle = (i / nodesInThisRing) * 2 * Math.PI;

      // Add slight randomization to avoid perfect symmetry
      const radiusJitter = (Math.random() - 0.5) * 20;
      const angleJitter = (Math.random() - 0.5) * 0.2;

      positions.set(node.id, {
        x: centerX + (radius + radiusJitter) * Math.cos(angle + angleJitter),
        y: centerY + (radius + radiusJitter) * Math.sin(angle + angleJitter),
      });

      nodeIndex++;
    }
  }

  return positions;
};

// Force-directed layout for natural node distribution
const getForceLayout = (
  nodes: DependencyGraphProps["nodes"],
  links: DependencyGraphProps["links"],
  targetNodeId: string
) => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 500,
    centerY = 350;

  // Start with target node in center
  positions.set(targetNodeId, { x: centerX, y: centerY });

  // Group nodes by connection type to target
  const directDependencies = new Set<string>();
  const directDependents = new Set<string>();
  const indirectNodes = new Set<string>();

  links.forEach((link) => {
    if (link.target === targetNodeId) {
      directDependencies.add(link.source);
    } else if (link.source === targetNodeId) {
      directDependents.add(link.target);
    }
  });

  nodes.forEach((node) => {
    if (
      node.id !== targetNodeId &&
      !directDependencies.has(node.id) &&
      !directDependents.has(node.id)
    ) {
      indirectNodes.add(node.id);
    }
  });

  // Position direct dependencies in a semi-circle to the left
  const depArray = Array.from(directDependencies);
  depArray.forEach((nodeId, index) => {
    const angle =
      Math.PI + (index / Math.max(1, depArray.length - 1)) * Math.PI * 0.8;
    const radius = 200;
    positions.set(nodeId, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  // Position direct dependents in a semi-circle to the right
  const depsArray = Array.from(directDependents);
  depsArray.forEach((nodeId, index) => {
    const angle = (index / Math.max(1, depsArray.length - 1)) * Math.PI * 0.8;
    const radius = 200;
    positions.set(nodeId, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  // Position indirect nodes in outer ring
  const indirectArray = Array.from(indirectNodes);
  indirectArray.forEach((nodeId, index) => {
    const angle = (index / Math.max(1, indirectArray.length)) * 2 * Math.PI;
    const radius = 350;
    positions.set(nodeId, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
};

// Smart node sizing based on total node count
const getNodeDimensions = (nodeCount: number) => {
  if (nodeCount > 50) return { width: 80, fontSize: 10, padding: 4 };
  if (nodeCount > 30) return { width: 100, fontSize: 11, padding: 6 };
  if (nodeCount > 15) return { width: 120, fontSize: 12, padding: 8 };
  return { width: 140, fontSize: 13, padding: 10 };
};
// Color mapping for different dependency types
const getNodeColor = (nodeType: string): string => {
  switch (nodeType.toLowerCase()) {
    case "apex":
    case "class":
      return "#3B82F6"; // Blue
    case "trigger":
      return "#EF4444"; // Red
    case "component":
    case "lwc":
      return "#10B981"; // Green
    case "test":
      return "#8B5CF6"; // Purple
    case "flow":
      return "#F59E0B"; // Amber
    default:
      return "#6B7280"; // Gray
  }
};

const getEdgeColor = (linkType: string): string => {
  switch (linkType) {
    case "method-call":
      return "#3B82F6";
    case "soql-query":
      return "#DC2626";
    case "database-operation":
      return "#059669";
    case "schema-reference":
      return "#7C3AED";
    case "trigger-context":
      return "#EA580C";
    case "wire-service":
      return "#0891B2";
    case "tests":
      return "#BE185D";
    default:
      return "#6B7280";
  }
};

export default function DependencyGraph({
  nodes,
  links,
  className = "",
}: DependencyGraphProps) {
  const [layoutType, setLayoutType] = useState<LayoutType>("hierarchical");

  // Convert our nodes and links to React Flow format
  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const nodeDimensions = getNodeDimensions(nodes.length);

    // Find the target node (usually the one being analyzed)
    const targetNodeId =
      nodes.find(
        (node) =>
          node.name.includes("Target") ||
          links.some(
            (link) => link.target === node.id && link.source !== node.id
          )
      )?.id ||
      nodes[0]?.id ||
      "";

    // Get layout positions based on selected layout type
    let layoutPositions: Map<string, { x: number; y: number }>;
    switch (layoutType) {
      case "hierarchical":
        layoutPositions = getHierarchicalLayout(nodes, links, targetNodeId);
        break;
      case "grid":
        layoutPositions = getGridLayout(nodes, targetNodeId);
        break;
      case "circular":
        layoutPositions = getCircularLayout(nodes, targetNodeId);
        break;
      case "force":
        // For force layout, we'll use a simple physics-based positioning
        layoutPositions = getForceLayout(nodes, links, targetNodeId);
        break;
      default:
        layoutPositions = getHierarchicalLayout(nodes, links, targetNodeId);
    }

    // Create React Flow nodes with improved layout
    const reactFlowNodes: Node[] = nodes.map((node) => {
      const isTarget = node.id === targetNodeId;
      const position = layoutPositions.get(node.id) || { x: 0, y: 0 };

      // Determine if this is a cross-repository node
      const isCrossRepo = nodes.some(
        (otherNode) =>
          otherNode.repo !== node.repo &&
          (links.some(
            (link) => link.source === node.id && link.target === otherNode.id
          ) ||
            links.some(
              (link) => link.target === node.id && link.source === otherNode.id
            ))
      );

      return {
        id: node.id,
        type: "default",
        position,
        data: {
          label: (
            <div className="text-center">
              <div
                className={`font-semibold truncate max-w-24 text-${Math.floor(nodeDimensions.fontSize)}px`}
                title={node.name}
              >
                {node.name.length > 15
                  ? `${node.name.substring(0, 12)}...`
                  : node.name}
              </div>
              <div className="text-xs text-gray-200 opacity-75">
                {node.repo.split("/").pop()}
              </div>
              {isCrossRepo && (
                <div className="text-xs text-yellow-300 font-bold">
                  Cross-Repo
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: isTarget ? "#DC2626" : getNodeColor(node.type), // Red for target
          color: "white",
          border: isCrossRepo ? "3px solid #FEF08A" : "2px solid #ffffff",
          borderRadius: "12px",
          padding: `${nodeDimensions.padding}px`,
          minWidth: `${nodeDimensions.width}px`,
          fontSize: `${nodeDimensions.fontSize}px`,
          boxShadow: isTarget
            ? "0 4px 20px rgba(220, 38, 38, 0.4)"
            : "0 2px 10px rgba(0,0,0,0.2)",
          transform: isTarget ? "scale(1.1)" : "scale(1)",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    // Create React Flow edges
    const reactFlowEdges: Edge[] = links
      .filter((link) => nodeMap.has(link.source) && nodeMap.has(link.target))
      .map((link, index) => ({
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        type: "smoothstep",
        animated:
          link.type === "soql-query" || link.type === "database-operation",
        style: {
          stroke: getEdgeColor(link.type),
          strokeWidth: 2,
        },
        label: link.type.replace("-", " "),
        labelStyle: {
          fontSize: "10px",
          fontWeight: "bold",
          fill: getEdgeColor(link.type),
        },
        labelBgStyle: {
          fill: "white",
          fillOpacity: 0.8,
        },
        markerEnd: {
          type: "arrowclosed",
          color: getEdgeColor(link.type),
        },
      }));

    return { reactFlowNodes, reactFlowEdges };
  }, [nodes, links, layoutType]);

  const [flowNodes, , onNodesChange] = useNodesState(reactFlowNodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(reactFlowEdges);

  if (nodes.length === 0) {
    return (
      <div
        className={`h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 ${className}`}
      >
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            No dependencies to visualize
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Run a dependency analysis to see the graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Graph Header */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dependency Graph ({nodes.length} nodes, {links.length} connections)
        </h3>

        {/* Layout Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Layout:
            </label>
            <select
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value as LayoutType)}
              title="Select graph layout type"
              aria-label="Graph layout selection"
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="hierarchical">Hierarchical Flow</option>
              <option value="grid">Grid by Type</option>
              <option value="circular">Circular</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            🔴 Target • 🟡 Cross-Repository • 🟢 Dependencies
          </div>
        </div>
      </div>

      {/* Layout Description */}
      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {layoutType === "hierarchical" && (
          <span>
            📊 <strong>Hierarchical Flow:</strong> Shows dependency flow from
            left to right - dependencies → target → dependents
          </span>
        )}
        {layoutType === "grid" && (
          <span>
            🗂️ <strong>Grid by Type:</strong> Organizes nodes by file type
            (Apex, Triggers, LWC, etc.) for easy categorization
          </span>
        )}
        {layoutType === "circular" && (
          <span>
            🔄 <strong>Circular:</strong> Target at center with all dependencies
            arranged in a circle around it
          </span>
        )}
      </div>

      {/* Main Layout: Sidebar + Graph */}
      <div className="flex gap-4">
        {/* Compact Sidebar Legend */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Statistics Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Statistics
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Nodes
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {nodes.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Dependencies
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {links.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Repositories
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {new Set(nodes.map((n) => n.repo)).size}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Cross-Repo
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {
                    links.filter((l) => {
                      const sourceRepo = nodes.find(
                        (n) => n.id === l.source
                      )?.repo;
                      const targetRepo = nodes.find(
                        (n) => n.id === l.target
                      )?.repo;
                      return sourceRepo !== targetRepo;
                    }).length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Compact Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Legend
            </h4>
            <div className="space-y-3">
              {/* Special Nodes */}
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Special
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded border border-white shadow-sm"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Target File
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded border-2 border-yellow-300"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Cross-Repo
                    </span>
                  </div>
                </div>
              </div>

              {/* Node Types */}
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Types
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { type: "apex", label: "Apex", color: "bg-blue-500" },
                    { type: "trigger", label: "Trigger", color: "bg-red-500" },
                    { type: "lwc", label: "LWC", color: "bg-green-500" },
                    { type: "test", label: "Test", color: "bg-purple-500" },
                  ].map(({ type, label, color }) => (
                    <div
                      key={type}
                      className="flex items-center space-x-2 text-xs"
                    >
                      <div className={`w-2 h-2 ${color} rounded`}></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Graph Container - Now Much Larger */}
        <div className="flex-1 h-[800px] border-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-lg">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{
              padding: 0.15,
              maxZoom: 1.5,
              minZoom: 0.1,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            attributionPosition="bottom-left"
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            className="bg-transparent"
          >
            <Controls
              position="top-right"
              className="
              [&>button]:bg-white [&>button]:dark:bg-gray-800 
              [&>button]:text-gray-700 [&>button]:dark:text-gray-200
              [&>button]:border [&>button]:border-gray-300 [&>button]:dark:border-gray-600
              [&>button]:shadow-sm [&>button]:hover:shadow-md
              [&>button]:hover:bg-gray-50 [&>button]:dark:hover:bg-gray-700
              [&>button]:transition-all [&>button]:duration-200
              [&>button]:rounded-md [&>button]:w-8 [&>button]:h-8
              bg-transparent border-0 gap-1
            "
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap
              position="bottom-left"
              style={{
                height: 120,
                width: 160,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
              }}
              zoomable
              pannable
              nodeColor={(node) => {
                const nodeData = nodes.find((n) => n.id === node.id);
                return nodeData ? getNodeColor(nodeData.type) : "#6B7280";
              }}
            />
            <Background gap={20} size={2} color="#e5e7eb" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
