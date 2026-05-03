import { getBezierPath, type EdgeProps } from "@xyflow/react";

import {
  DEFAULT_EDGE_STROKE_WIDTH,
  DEFAULT_EDGE_OPACITY,
} from "../domain/canvasNodes";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeWidth = style.strokeWidth ?? DEFAULT_EDGE_STROKE_WIDTH;
  const opacity = style.opacity ?? DEFAULT_EDGE_OPACITY;

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      opacity={opacity}
      className="react-flow__edge-path"
    />
  );
}