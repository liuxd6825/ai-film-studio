import React, { memo, useState } from "react";
import { Input, Select, Tag, Empty, Button, Popconfirm } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { promptApi, categoryApi } from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";

interface PromptListProps {
  projectId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

export const PromptList = memo(function PromptList({
  projectId,
  onSelect,
  onCreateNew,
}: PromptListProps) {
  const { prompts, categories, setPrompts, setCategories, selectedPrompt } =
    usePromptStore();
  const [newCategoryName, setNewCategoryName] = useState("");

  React.useEffect(() => {
    promptApi
      .list(projectId)
      .then((res) => {
        setPrompts(res);
      })
      .catch(console.error);

    categoryApi
      .list(projectId)
      .then((res) => {
        setCategories(res);
      })
      .catch(console.error);
  }, [projectId, setPrompts, setCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryApi.create({ projectId, name: newCategoryName });
      const updated = await categoryApi.list(projectId);
      setCategories(updated);
      setNewCategoryName("");
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      const updated = await categoryApi.list(projectId);
      setCategories(updated);
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  return (
    <div style={{ padding: 16 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreateNew}
        block
        style={{ marginBottom: 16 }}
      >
        新建提示词
      </Button>

      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索提示词"
        style={{ marginBottom: 16 }}
      />

      <Select
        placeholder="按分类筛选"
        style={{ width: "100%", marginBottom: 16 }}
        allowClear
        options={categoryOptions}
      />

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#999" }}>分类管理</span>
      </div>
      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <Input
          size="small"
          placeholder="新分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={handleAddCategory}
          style={{ flex: 1 }}
        />
        <Button size="small" onClick={handleAddCategory}>
          添加
        </Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
              background: "#f5f5f5",
              borderRadius: 4,
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            <span>{cat.name}</span>
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
          </div>
        ))}
      </div>

      {prompts.length === 0 ? (
        <Empty description="暂无提示词" />
      ) : (
        <div>
          {prompts.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                cursor: "pointer",
                background:
                  selectedPrompt?.id === item.id ? "#e6f7ff" : undefined,
                borderRadius: 4,
                padding: "8px 12px",
                marginBottom: 8,
                border: "1px solid",
                borderColor:
                  selectedPrompt?.id === item.id ? "#1890ff" : "#f0f0f0",
              }}
            >
              <div style={{ fontWeight: 500 }}>{item.title}</div>
              <div style={{ marginTop: 4 }}>
                {(typeof item.tags === "string"
                  ? item.tags.split(",").filter(Boolean)
                  : item.tags || []
                ).map((tag, tagIndex) => (
                  <Tag key={`${tag}-${tagIndex}`} style={{ marginRight: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
