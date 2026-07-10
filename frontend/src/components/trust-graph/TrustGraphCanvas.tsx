"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
  useEdgesState,
  useNodesState,
  Panel,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import type { ReactFlowInstance, Viewport } from "reactflow";
import TrustGraphNode from "./TrustGraphNode";
import type { TrustGraphApiEdge, TrustGraphApiNode, TrustGraphNodeData } from "@/lib/trust-graph-api";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 88;

const nodeTypes = { trustNode: TrustGraphNode };

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 72, marginx: 24, marginy: 24 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

function toFlowNodes(
  apiNodes: TrustGraphApiNode[],
  options: {
    focusedId: string | null;
    neighborIds: Set<string>;
    revealedIds: Set<string>;
  }
): Node[] {
  return apiNodes.map((n) => ({
    id: n.id,
    type: "trustNode",
    position: { x: 0, y: 0 },
    data: {
      ...n.data,
      dimmed: options.focusedId ? !options.neighborIds.has(n.id) : false,
      revealed: options.revealedIds.has(n.id),
    },
  }));
}

function toFlowEdges(apiEdges: TrustGraphApiEdge[]): Edge[] {
  return apiEdges.map((e) => {
    const count = e.data.sharedOrderCount;
    const strokeWidth = Math.min(4, 1 + count * 0.5);
    const fraud = e.data.hasFraud;
    const isCluster = e.data.edgeKind === "fraud-cluster";
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: fraud || isCluster,
      style: {
        stroke: isCluster ? "var(--negative)" : fraud ? "var(--negative)" : "var(--border-default)",
        strokeWidth: isCluster ? 2.5 : strokeWidth,
        strokeDasharray: isCluster ? "4 3" : fraud ? "6 4" : undefined,
        opacity: fraud || isCluster ? 1 : 0.85,
      },
      data: e.data,
    };
  });
}

function getNeighborIds(focusedId: string, edges: TrustGraphApiEdge[]): Set<string> {
  const neighbors = new Set<string>([focusedId]);
  for (const edge of edges) {
    if (edge.source === focusedId) neighbors.add(edge.target);
    if (edge.target === focusedId) neighbors.add(edge.source);
  }
  return neighbors;
}

interface TrustGraphCanvasProps {
  apiNodes: TrustGraphApiNode[];
  apiEdges: TrustGraphApiEdge[];
  onNodeHover: (node: TrustGraphNodeData | null) => void;
}

export default function TrustGraphCanvas({
  apiNodes,
  apiEdges,
  onNodeHover,
}: TrustGraphCanvasProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const neighborIds = useMemo(
    () => (focusedId ? getNeighborIds(focusedId, apiEdges) : new Set<string>()),
    [focusedId, apiEdges]
  );

  const initial = useMemo(() => {
    const flowNodes = toFlowNodes(apiNodes, { focusedId, neighborIds, revealedIds });
    const flowEdges = toFlowEdges(apiEdges);
    const laidOut = layoutGraph(flowNodes, flowEdges);
    return { nodes: laidOut, edges: flowEdges };
  }, [apiNodes, apiEdges, focusedId, neighborIds, revealedIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const initialViewportRef = useRef<Viewport | null>(null);
  const graphKeyRef = useRef("");

  useEffect(() => {
    const flowNodes = toFlowNodes(apiNodes, { focusedId, neighborIds, revealedIds });
    const flowEdges = toFlowEdges(apiEdges);
    const laidOut = layoutGraph(flowNodes, flowEdges);
    setNodes(laidOut);
    setEdges(flowEdges);
  }, [apiNodes, apiEdges, focusedId, neighborIds, revealedIds, setNodes, setEdges]);

  const captureInitialViewport = useCallback(() => {
    if (!rf) return;
    rf.fitView({ padding: 0.2, duration: 0 });
    initialViewportRef.current = rf.getViewport();
  }, [rf]);

  useEffect(() => {
    if (!rf) return;
    const graphKey = `${apiNodes.map((n) => n.id).join(",")}|${apiEdges.map((e) => e.id).join(",")}`;
    if (graphKeyRef.current === graphKey) return;
    graphKeyRef.current = graphKey;

    const timer = setTimeout(() => {
      captureInitialViewport();
    }, 80);
    return () => clearTimeout(timer);
  }, [rf, apiNodes, apiEdges, captureInitialViewport]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setFocusedId((prev) => (prev === node.id ? null : node.id));
    if (node.data.nodeType === "phone") {
      setRevealedIds((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    }
  }, []);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeHover(node.data as TrustGraphNodeData);
    },
    [onNodeHover]
  );

  const onNodeMouseLeave = useCallback(() => {
    onNodeHover(null);
  }, [onNodeHover]);

  const handleResetView = useCallback(() => {
    setFocusedId(null);
    setRevealedIds(new Set());
    if (rf && initialViewportRef.current) {
      rf.setViewport(initialViewportRef.current, { duration: 300 });
    } else if (rf) {
      captureInitialViewport();
    }
  }, [rf, captureInitialViewport]);

  const handleFitToScreen = useCallback(() => {
    rf?.fitView({ padding: 0.2, duration: 300 });
  }, [rf]);

  return (
    <div className="w-full h-full min-h-[480px] rounded-lg border border-border-default overflow-hidden bg-bg-base">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onInit={(instance) => {
          setRf(instance);
          setTimeout(() => {
            instance.fitView({ padding: 0.2, duration: 0 });
            initialViewportRef.current = instance.getViewport();
          }, 80);
        }}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-subtle)" />
        <Controls
          className="!bg-bg-raised !border-border-default !shadow-sm [&>button]:!bg-bg-raised [&>button]:!border-border-default [&>button]:!text-ink-secondary [&>button:hover]:!bg-bg-sunken"
          showInteractive={false}
        />
        <Panel position="top-right" className="flex gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-bg-raised text-ink-primary hover:bg-bg-sunken"
          >
            Reset view
          </button>
          <button
            type="button"
            onClick={handleFitToScreen}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-bg-raised text-ink-primary hover:bg-bg-sunken"
          >
            Fit to screen
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
