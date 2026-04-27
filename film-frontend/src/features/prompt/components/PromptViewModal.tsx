import React from "react";
import { Modal, Button, Card } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { usePromptStore } from "../stores/promptStore";
import { VariableForm } from "./VariableForm";

export const PromptViewModal: React.FC = () => {
  const {
    selectedPrompt,
    detailModalOpen,
    renderedContent,
    setDetailModalOpen,
    setSelectedPrompt,
  } = usePromptStore();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(renderedContent);
    } catch {
      // silent fail
    }
  };

  const handleClose = () => {
    setDetailModalOpen(false);
    setSelectedPrompt(null);
  };

  return (
    <Modal
      title={selectedPrompt?.title}
      open={detailModalOpen}
      onCancel={handleClose}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyPrompt}>
          复制 Prompt
        </Button>,
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
      ]}
      width={900}
    >
      {selectedPrompt && (
        <div style={{ display: "flex", gap: 16 }}>
          <Card
            title="变量设置"
            size="small"
            style={{
              flex: "0 0 320px",
              maxHeight: "calc(100vh - 200px)",
              overflow: "auto",
            }}
          >
            <VariableForm variables={selectedPrompt.variables || []} />
          </Card>
          <Card
            title="预览结果"
            size="small"
            style={{
              flex: 1,
              maxHeight: "calc(100vh - 200px)",
              overflow: "auto",
            }}
          >
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "monospace",
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 4,
                margin: 0,
                maxHeight: "calc(100vh - 280px)",
                overflow: "auto",
              }}
            >
              {renderedContent}
            </pre>
          </Card>
        </div>
      )}
    </Modal>
  );
};
