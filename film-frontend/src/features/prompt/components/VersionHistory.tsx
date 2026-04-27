import React, { useEffect } from "react";
import { Timeline, Button, Card, Typography, message } from "antd";
import { promptApi } from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";

const { Text } = Typography;

interface VersionHistoryProps {
  promptId: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ promptId }) => {
  const { versions, setVersions, setSelectedPrompt } = usePromptStore();

  useEffect(() => {
    promptApi
      .getVersions(promptId)
      .then((res) => {
        setVersions(res);
      })
      .catch(console.error);
  }, [promptId, setVersions]);

  const handleRestore = async (version: number) => {
    try {
      await promptApi.restoreVersion(promptId, version);
      message.success("已恢复到该版本");
      const res = await promptApi.get(promptId);
      setSelectedPrompt(res);
    } catch {
      message.error("恢复失败");
    }
  };

  if (versions.length === 0) {
    return (
      <Card title="版本历史" size="small">
        <Text type="secondary">暂无版本历史</Text>
      </Card>
    );
  }

  return (
    <Card title="版本历史" size="small">
      <Timeline
        items={versions.map((v, index) => ({
          color: index === 0 ? "blue" : "gray",
          children: (
            <div>
              <Text strong>v{v.version}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(v.createdAt * 1000).toLocaleString()}
              </Text>
              {index !== 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleRestore(v.version)}
                  style={{ padding: 0, marginLeft: 8 }}
                >
                  恢复
                </Button>
              )}
            </div>
          ),
        }))}
      />
    </Card>
  );
};
