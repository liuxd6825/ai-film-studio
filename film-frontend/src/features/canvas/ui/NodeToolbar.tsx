import { memo } from "react";
import { NodeToolbar as ReactFlowNodeToolbar, useViewport } from "@xyflow/react";
import {
  NODE_TOOLBAR_ALIGN,
  NODE_TOOLBAR_CLASS,
  NODE_TOOLBAR_OFFSET,
  NODE_TOOLBAR_POSITION,
} from "./nodeToolbarConfig";

export const NodeToolbar = memo(function NodeToolbar({
  nodeId,
  children,
  visible = true,
}: {
  nodeId: string;
  children: React.ReactNode;
  visible?: boolean;
}) {
  const { zoom } = useViewport();
  const scaledOffset = NODE_TOOLBAR_OFFSET * zoom;

  return (
    <ReactFlowNodeToolbar
      nodeId={nodeId}
      isVisible={visible}
      position={NODE_TOOLBAR_POSITION}
      align={NODE_TOOLBAR_ALIGN}
      offset={scaledOffset}
      className={NODE_TOOLBAR_CLASS}
    >
      <div
        className="flex items-center gap-1 rounded-full bg-white/90 dark:bg-gray-800/90 p-1 shadow-lg backdrop-blur-sm border border-gray-100 dark:border-gray-700"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "right center",
        }}
      >
        {children}
      </div>
    </ReactFlowNodeToolbar>
  );
});