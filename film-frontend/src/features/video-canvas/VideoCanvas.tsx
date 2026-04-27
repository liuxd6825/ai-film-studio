import { useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { videoNodeTypes } from "./nodes";
import { videoApi } from "@/api/videoApi";

interface VideoCanvasProps {
  projectId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[], edges: Edge[]) => void;
}

export default function VideoCanvas({
  projectId,
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
}: VideoCanvasProps) {
  const [nodes, setNodes, onNodesChangeLocal] =
    useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    if (projectId) {
      videoApi
        .getProject(projectId)
        .then((project) => {
          const flowNodes: Node[] = project.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position as { x: number; y: number },
            data: n.data,
          }));
          const flowEdges: Edge[] = project.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          }));
          setNodes(flowNodes);
          setEdges(flowEdges);
        })
        .catch(console.error);
    }
  }, [projectId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeLocal(changes);
      if (onNodesChange) {
        setTimeout(() => {
          onNodesChange(nodes, edges);
        }, 0);
      }
    },
    [onNodesChangeLocal, onNodesChange, nodes, edges],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={videoNodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
