import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

export interface NodeTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  noResize?: boolean;
}

export const NodeTextarea = forwardRef<HTMLTextAreaElement, NodeTextareaProps>(
  ({ className, onMouseMove, onMouseDown, noResize, ...props }, ref) => {
    const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      onMouseMove?.(e as unknown as React.MouseEvent<HTMLTextAreaElement>);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      onMouseDown?.(e as unknown as React.MouseEvent<HTMLTextAreaElement>);
    };

    return (
      <textarea
        ref={ref}
        className={`nodrag nowheel w-full text-sm border border-gray-200 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
          noResize ? "resize-none" : ""
        } ${className || ""}`}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        {...props}
      />
    );
  },
);

NodeTextarea.displayName = "NodeTextarea";
