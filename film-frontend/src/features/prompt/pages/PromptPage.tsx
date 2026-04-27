import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout, Input, Button, List, Modal, Popconfirm, message } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Prompt, promptApi, categoryApi } from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";
import { PromptEditor } from "../components/PromptEditor";
import { PromptViewModal } from "../components/PromptViewModal";

const { Sider, Content } = Layout;

export const PromptPage: React.FC = () => {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || "";

  const {
    prompts,
    categories,
    selectedCategoryId,
    searchKeyword,
    setPrompts,
    setCategories,
    setSelectedPrompt,
    setSelectedCategoryId,
    setSearchKeyword,
    setDetailModalOpen,
  } = usePromptStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = () => {
    promptApi
      .list(projectId)
      .then((res) => setPrompts(res))
      .catch(console.error);
    categoryApi
      .list(projectId)
      .then((res) => setCategories(res))
      .catch(console.error);
  };

  const filteredPrompts = prompts.filter((p) => {
    const matchCategory =
      !selectedCategoryId || p.categoryId === selectedCategoryId;
    const matchSearch =
      !searchKeyword ||
      p.title.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryApi.create({ projectId, name: newCategoryName });
      categoryApi.list(projectId).then((res) => setCategories(res));
      setNewCategoryName("");
      setAddCategoryOpen(false);
    } catch (error) {
      message.error("添加分类失败");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      categoryApi.list(projectId).then((res) => setCategories(res));
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      message.error("删除分类失败");
    }
  };

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
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => setAddCategoryOpen(true)}
            />
          </div>
          <div
            onClick={() => setSelectedCategoryId(null)}
            style={{
              padding: "8px 12px",
              marginBottom: 4,
              borderRadius: 4,
              cursor: "pointer",
              background:
                selectedCategoryId === null ? "#e6f7ff" : "transparent",
              fontWeight: selectedCategoryId === null ? 500 : 400,
            }}
          >
            全部
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                marginBottom: 4,
                borderRadius: 4,
                cursor: "pointer",
                background:
                  selectedCategoryId === cat.id ? "#e6f7ff" : "transparent",
              }}
            >
              <span style={{ flex: 1 }}>{cat.name}</span>
              <span onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="确定删除此分类?"
                  onConfirm={() => handleDeleteCategory(cat.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </span>
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
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() => handleViewPrompt(item)}
                    >
                      {item.title}
                    </span>
                  }
                  description={
                    <div>
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

      <Modal
        title="添加分类"
        open={addCategoryOpen}
        onCancel={() => {
          setAddCategoryOpen(false);
          setNewCategoryName("");
        }}
        onOk={handleAddCategory}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={handleAddCategory}
        />
      </Modal>
    </Layout>
  );
};
