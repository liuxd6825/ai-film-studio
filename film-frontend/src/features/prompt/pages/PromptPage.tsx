import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout, Input, Button, List, Tag } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Prompt, promptApi, PROMPT_CATEGORIES } from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";
import { PromptEditor } from "../components/PromptEditor";
import { PromptViewModal } from "../components/PromptViewModal";

const { Sider, Content } = Layout;

export const PromptPage: React.FC = () => {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || "";

  const {
    prompts,
    selectedCategoryKey,
    searchKeyword,
    setPrompts,
    setSelectedPrompt,
    setSelectedCategoryKey,
    setSearchKeyword,
    setDetailModalOpen,
  } = usePromptStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    if (selectedCategoryKey) {
      promptApi.listByCategory(projectId, selectedCategoryKey).then((res) => setPrompts(res)).catch(console.error);
    } else {
      promptApi.list(projectId).then((res) => setPrompts(res)).catch(console.error);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryKey]);

  const filteredPrompts = (prompts || []).filter((p) => {
    const matchSearch =
      !searchKeyword ||
      p.title.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchSearch;
  });

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleViewPrompt = (prompt: Prompt) => {
    promptApi
      .get(prompt.id)
      .then((res) => {
        setSelectedPrompt(res);
        setDetailModalOpen(true);
      })
      .catch(console.error);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingPrompt(null);
    loadData();
  };

  const getCategoryName = (key: string) => {
    const cat = PROMPT_CATEGORIES.find((c) => c.key === key);
    return cat ? cat.name : key;
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        width={200}
        style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      >
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ fontWeight: 500 }}>分类</span>
          </div>
          <div
            onClick={() => setSelectedCategoryKey(null)}
            style={{
              padding: "8px 12px",
              marginBottom: 4,
              borderRadius: 4,
              cursor: "pointer",
              background:
                selectedCategoryKey === null ? "#e6f7ff" : "transparent",
              fontWeight: selectedCategoryKey === null ? 500 : 400,
            }}
          >
            全部
          </div>
          {PROMPT_CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              onClick={() => setSelectedCategoryKey(cat.key === selectedCategoryKey ? null : cat.key)}
              style={{
                padding: "8px 12px",
                marginBottom: 4,
                borderRadius: 4,
                cursor: "pointer",
                background:
                  selectedCategoryKey === cat.key ? "#e6f7ff" : "transparent",
              }}
            >
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </Sider>

      <Content>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索提示词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPrompt(null);
                setEditorOpen(true);
              }}
            >
              新建提示词
            </Button>
          </div>

          <List
            locale={{ emptyText: "暂无提示词" }}
            dataSource={filteredPrompts}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: "12px 16px",
                  border: "1px solid #f0f0f0",
                }}
                actions={[
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewPrompt(item)}
                  >
                    查看
                  </Button>,
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditPrompt(item)}
                  >
                    编辑
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => handleViewPrompt(item)}
                      >
                        {item.title}
                      </span>
                      {item.isSystem && (
                        <Tag color="red">系统</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <span style={{ marginRight: 8, color: "#999" }}>
                        {getCategoryName(item.categoryKey)}
                      </span>
                      {(typeof item.tags === "string"
                        ? item.tags.split(",").filter(Boolean)
                        : item.tags || []
                      ).map((tag, index) => (
                        <span
                          key={index}
                          style={{ marginRight: 8, color: "#999" }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Content>

      <PromptViewModal />

      <PromptEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        prompt={editingPrompt}
        projectId={projectId}
      />
    </Layout>
  );
};