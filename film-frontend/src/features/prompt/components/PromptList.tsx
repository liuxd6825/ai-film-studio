import { memo, useState, useEffect } from "react";
import { Input, Select, Tag, Empty, Button } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { promptApi, PROMPT_CATEGORIES } from "../api/promptApi";
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
  const { prompts, setPrompts, selectedPrompt, selectedCategoryKey, setSelectedCategoryKey } =
    usePromptStore();
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    if (selectedCategoryKey) {
      promptApi.listByCategory(projectId, selectedCategoryKey).then((res) => {
        setPrompts(res);
      }).catch(console.error);
    } else {
      promptApi.list(projectId).then((res) => {
        setPrompts(res);
      }).catch(console.error);
    }
  }, [projectId, selectedCategoryKey, setPrompts]);

  const filteredPrompts = (prompts || []).filter((p) => {
    const matchSearch =
      !searchKeyword ||
      p.title.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchSearch;
  });

  const categoryOptions = PROMPT_CATEGORIES.map((cat) => ({
    label: cat.name,
    value: cat.key,
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
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
      />

      <Select
        placeholder="按分类筛选"
        style={{ width: "100%", marginBottom: 16 }}
        allowClear
        value={selectedCategoryKey}
        onChange={(val) => setSelectedCategoryKey(val || null)}
        options={categoryOptions}
      />

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#999" }}>分类</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        {PROMPT_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            onClick={() => setSelectedCategoryKey(cat.key === selectedCategoryKey ? null : cat.key)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              background: selectedCategoryKey === cat.key ? "#e6f7ff" : "#f5f5f5",
              borderRadius: 4,
              marginBottom: 4,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <span>{cat.name}</span>
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 ? (
        <Empty description="暂无提示词" />
      ) : (
        <div>
          {filteredPrompts.map((item) => (
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{item.title}</span>
                {item.isSystem && (
                  <Tag color="red">系统</Tag>
                )}
              </div>
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