import { useState } from "react";
import { Tabs } from "antd";
import { useParams } from "react-router-dom";
import { CharacterTab } from "./characters/CharacterTab";
import { SceneTab } from "./scenes/SceneTab";
import { PropTab } from "./props/PropTab";

export function AssetsModule() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState("character");

  if (!projectId) {
    return <div>Project not found</div>;
  }

  return (
    <div className="h-full flex flex-col dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "character",
              label: "角色",
              children: <CharacterTab projectId={projectId} />,
            },
            {
              key: "scene",
              label: "场景",
              children: <SceneTab projectId={projectId} />,
            },
            {
              key: "prop",
              label: "道具",
              children: <PropTab projectId={projectId} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
