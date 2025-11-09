
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ExternalLink, BookOpen, Video, FileText, Plus } from "lucide-react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ModeToggle } from "./ModeToggle";

interface Resource {
  title: string;
  url: string;
  type: "article" | "video" | "book";
}

// Node data including callback for expanding
interface LearningNode {
  id: string;
  label: string;
  description: string;
  resources: Resource[];
  level: "Beginner" | "Intermediate" | "Advanced";
}

interface LearningMap {
  nodes: LearningNode[];
  edges: { source: string; target: string }[];
}

// Custom Node Component
type MapNodeData = LearningNode & {
  onExpand?: (node: LearningNode) => void;
  expanding?: boolean;
  [key: string]: unknown;
};
const MapNode = ({ data }: NodeProps<Node<MapNodeData>>) => {
  const [open, setOpen] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
      case "Advanced": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "article": return <FileText className="w-3 h-3" />;
      case "video": return <Video className="w-3 h-3" />;
      case "book": return <BookOpen className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border-2 bg-card text-card-foreground p-3 shadow-sm hover:shadow-md transition-shadow min-w-48"
      >
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm truncate pr-2">{data.label}</h4>
          <Badge variant="outline" className={`text-xs ${getLevelColor(data.level)}`}>
            {data.level}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
        {/* Expand button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onExpand?.(data);
          }}
          className="absolute -right-3 -top-3 bg-primary text-primary-foreground rounded-full p-1 shadow hover:scale-105 transition-transform"
        >
          {data.expanding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        </button>
        {data.resources.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {data.resources.slice(0, 2).map((r: Resource, i: number) => (
              <div key={i} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                {getIcon(r.type)}
                <span className="truncate max-w-20">{r.title}</span>
              </div>
            ))}
            {data.resources.length > 2 && (
              <span className="text-xs text-muted-foreground">+{data.resources.length - 2}</span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />

      {/* Sheet for details */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {data.label}
              <Badge variant="outline" className={getLevelColor(data.level)}>
                {data.level}
              </Badge>
            </SheetTitle>
            <SheetDescription>{data.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 ml-6 mr-6">
            <h4 className="font-medium">Learning Resources</h4>
            {data.resources.length > 0 ? (
              <ul className="space-y-2">
                {data.resources.map((res: Resource, i: number) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                    <div className="flex items-center gap-2">
                      {getIcon(res.type)}
                      <span className="text-sm font-medium">{res.title}</span>
                    </div>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No resources listed.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const nodeTypes = { learningNode: MapNode } as NodeTypes;

export default function ReactFlowMap() {
  const [topic, setTopic] = useState("");
  const [map, setMap] = useState<LearningMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genDuration, setGenDuration] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Nodes & edges will be kept in local state via useNodesState/useEdgesState. On layout we update these states directly.

  // Auto-layout with dagre
  const onLayout = useCallback(() => {
    if (!map) return;

    import("dagre").then((dagre) => {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 150 });
      g.setDefaultEdgeLabel(() => ({}));

      map.nodes.forEach((node) => {
        g.setNode(node.id, { width: 220, height: 100 });
      });
      map.edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      const layoutedNodes: Node<MapNodeData>[] = map.nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
          id: node.id,
          type: "learningNode",
          position: {
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
          },
          data: { ...node, expanding: false, onExpand: handleExpand },
        };
      });

      setNodes(layoutedNodes);
      setEdges(
        map.edges.map((e): Edge => ({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: "bezier",
          style: { strokeWidth: 2 },
          animated: false,
        }))
      );
    });
  }, [map, setNodes, setEdges]);

  // Expand handler
  const handleExpand = useCallback(async (n: LearningNode) => {
    // mark node expanding
    setNodes((nds) => nds.map((item) => item.id === n.id ? { ...item, data: { ...item.data as MapNodeData, expanding: true } } : item));
    //Calling api 
    try {
      const res = await fetch("/api/generate-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: n.label }),
      });
      if (!res.ok) throw new Error("Failed to expand topic");
      const subMap: LearningMap = await res.json();

      // prefix ids to keep uniqueness
      const prefix = `${n.id}-`;
      const newNodes: Node<MapNodeData>[] = subMap.nodes.map((sn): Node<MapNodeData> => ({
        id: prefix + sn.id,
        type: "learningNode",
        position: { x: 0, y: 0 },
        data: { ...sn, expanding: false, onExpand: handleExpand },
      }));
      const newEdges: Edge[] = subMap.edges.map((se): Edge => ({
        id: prefix + `${se.source}-${se.target}`,
        source: prefix + se.source,
        target: prefix + se.target,
        type: "bezier",
        style: { strokeWidth: 2 },
        animated: false,
      }));

      // Find root nodes (nodes that are not targets of any edge in the subMap)
      const targetIds = new Set(subMap.edges.map(e => e.target));
      const rootNodeIds = subMap.nodes
        .filter(node => !targetIds.has(node.id))
        .map(node => prefix + node.id);

      // Connect parent only to root nodes (first-level children)
      rootNodeIds.forEach(rootId => {
        newEdges.push({
          id: `${n.id}-${rootId}`,
          source: n.id,
          target: rootId,
          type: "bezier",
          style: { strokeWidth: 2 },
          animated: false,
        });
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      // re-layout whole graph
      setMap({ nodes: [...(map?.nodes || []), ...subMap.nodes.map((sn) => ({ ...sn, id: prefix + sn.id }))], edges: [...(map?.edges || []), ...newEdges.map((e) => ({ source: e.source, target: e.target }))] });
    } catch (err) {
      console.error(err);
    } finally {
      setNodes((nds) => nds.map((item) => item.id === n.id ? { ...item, data: { ...item.data as MapNodeData, expanding: false } } : item));
    }
  }, [map, setNodes, setEdges]);

  // Run layout when map loads or updates
  useEffect(() => {
    if (map) onLayout();
  }, [map, onLayout]);

  const generateMap = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    startTimeRef.current = Date.now();
    setGenDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGenDuration(Date.now() - startTimeRef.current);
    }, 100);
    setError(null);
    setMap(null);

    try {
      const res = await fetch("/api/generate-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error: ${res.status}`);
      }

      const data: LearningMap = await res.json();
      setMap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate map");
    } finally {
      setLoading(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
            
          <Input
            placeholder="e.g. Web Development, Quantum Physics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateMap()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={generateMap} disabled={loading}>
            
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              </>
            ) : (
              "Generate Map"
            )}
          </Button>
          <ModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative touch-pan-y overflow-hidden">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="flex items-center gap-2 p-3 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          </div>
        )}

        {loading && !map ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">
              Generating… {genDuration >= 1000 ? (genDuration / 1000).toFixed(1) + 's' : genDuration + 'ms'}
            </p>
          </div>
        ) : map ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodesDraggable={true}
            panOnDrag={[1, 2]}
            zoomOnScroll={false}
            defaultEdgeOptions={{ type: "bezier", style: { strokeWidth: 2 } }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/20"
          >
            <Controls />
            <Background gap={12} size={1} />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-lg">Enter a topic to generate your learning map</p>
          </div>
        )}
      </main>
    </div>
  );
}