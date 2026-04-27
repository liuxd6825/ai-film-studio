import React from "react";
import { Card, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { usePromptStore } from "../stores/promptStore";

export const PromptPlayground: React.FC = () => {
  const { renderedContent } = usePromptStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderedContent);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  return (
    <Card
      title="预览结果"
      extra={
        <Button
          icon={<CopyOutlined />}
          onClick={handleCopy}
          disabled={!renderedContent}
        >
          复制
        </Button>
      }
      style={{ height: "100%" }}
    >
      <pre
        style={{
          whiteSpace: "pre-wrap",
          display: "block",
          padding: 16,
          background: "#f5f5f5",
          borderRadius: 4,
          minHeight: 200,
          fontFamily: "monospace",
        }}
      >
        {renderedContent || "填写变量后预览结果..."}
      </pre>
    </Card>
  );
};
