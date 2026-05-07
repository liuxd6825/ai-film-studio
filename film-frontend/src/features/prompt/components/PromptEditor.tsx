import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Card, Space, message, Button } from "antd";
import {
  Prompt,
  PromptVariable,
  promptApi,
  PROMPT_CATEGORIES,
} from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";
import {
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  PlusOutlined,
} from "@ant-design/icons";

interface PromptEditorProps {
  open: boolean;
  onClose: () => void;
  prompt?: Prompt | null;
  projectId: string;
}

const extractVariables = (content: string): PromptVariable[] => {
  const regex = /{{(.*?)}}/g;
  const matches = content.matchAll(regex);
  const seen = new Set<string>();
  const vars: PromptVariable[] = [];

  for (const match of matches) {
    const name = match[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      vars.push({ name, type: "short_text" });
    }
  }
  return vars;
};

export const PromptEditor: React.FC<PromptEditorProps> = ({
  open,
  onClose,
  prompt,
  projectId,
}) => {
  const [form] = Form.useForm();
  const { setPrompts } = usePromptStore();
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [addVarModalOpen, setAddVarModalOpen] = useState(false);
  const [newVarName, setNewVarName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (prompt) {
      form.setFieldsValue({
        title: prompt.title,
        content: prompt.content,
        categoryKey: prompt.categoryKey,
      });
      setContent(prompt.content);
      setVariables(prompt.variables || []);
    } else {
      form.resetFields();
      setContent("");
      setVariables([]);
    }
  }, [prompt, form, open]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleExtractVariables = () => {
    const extractedVars = extractVariables(content);
    const existingVarMap = new Map(variables.map((v) => [v.name, v]));
    const mergedVars = extractedVars.map((v) => ({
      ...v,
      type: existingVarMap.get(v.name)?.type || "short_text",
      default: existingVarMap.get(v.name)?.default || "",
      options: existingVarMap.get(v.name)?.options || [],
    }));
    setVariables(mergedVars);
    message.success(`已提取 ${mergedVars.length} 个变量`);
  };

  const updateVariable = (
    index: number,
    field: keyof PromptVariable,
    value: any,
  ) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const handleAddVariable = () => {
    const name = newVarName.trim();
    if (!name) return;
    if (variables.some((v) => v.name === name)) {
      message.warning("变量已存在");
      return;
    }
    const newVar: PromptVariable = { name, type: "short_text" };
    setVariables([...variables, newVar]);
    setNewVarName("");
    setAddVarModalOpen(false);
  };

  const handleDeleteVariable = (index: number) => {
    const updated = variables.filter((_, i) => i !== index);
    setVariables(updated);
  };

  const handleMoveVariable = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= variables.length) return;
    const updated = [...variables];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setVariables(updated);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        variables,
      };
      if (prompt) {
        await promptApi.update(prompt.id, data);
        message.success("更新成功");
      } else {
        await promptApi.create({ ...data, projectId });
        message.success("创建成功");
      }
      const updatedPrompts = await promptApi.list(projectId);
      setPrompts(updatedPrompts);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || "保存失败");
      }
      console.error(error);
    }
  };

  const categoryOptions = PROMPT_CATEGORIES.map((cat) => ({
    label: cat.name,
    value: cat.key,
  }));

  return (
    <>
      <Modal
        title={prompt ? "编辑提示词" : "新建提示词"}
        open={open}
        onCancel={onClose}
        onOk={handleSave}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入提示词标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: "请输入内容" }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="使用 {{变量名}} 定义变量，例如：请帮我写一个关于{{主题}}的{{文体}}文章"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8 }}>变量</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setAddVarModalOpen(true)}
                >
                  添加变量
                </Button>
                <Button size="small" onClick={handleExtractVariables}>
                  提取
                </Button>
              </div>
            </div>
            {variables.length === 0 ? (
              <Card size="small" style={{ marginTop: 8 }}>
                <div style={{ textAlign: "center", color: "#999" }}>
                  暂无变量，可点击"添加变量"或使用 {"{{变量名}}"} 语法
                </div>
              </Card>
            ) : (
              <Card size="small" style={{ marginTop: 8 }}>
                {variables.map((variable, index) => (
                  <div
                    key={variable.name}
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      background: "#f5f5f5",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{variable.name}</span>
                      <Space>
                        <div style={{ display: "flex", gap: 2 }}>
                          <Select
                            value={variable.type}
                            onChange={(val) =>
                              updateVariable(index, "type", val)
                            }
                            style={{ width: 100 }}
                            options={[
                              { label: "短文本", value: "short_text" },
                              { label: "长文本", value: "long_text" },
                              { label: "枚举", value: "enum" },
                            ]}
                          />
                          <Input
                            placeholder="默认值"
                            value={variable.default}
                            onChange={(e) =>
                              updateVariable(index, "default", e.target.value)
                            }
                            style={{ flex: 1 }}
                          />
                        </div>
                        {variable.type === "enum" && (
                          <Input
                            placeholder="枚举选项（逗号分隔，如：幽默,正式,专业）"
                            value={variable.options?.join(", ") || ""}
                            onChange={(e) =>
                              updateVariable(
                                index,
                                "options",
                                e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        )}
                        <Button
                          size="small"
                          icon={<UpOutlined />}
                          onClick={() => handleMoveVariable(index, "up")}
                          disabled={index === 0}
                        />
                        <Button
                          size="small"
                          icon={<DownOutlined />}
                          onClick={() => handleMoveVariable(index, "down")}
                          disabled={index === variables.length - 1}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteVariable(index)}
                        />
                      </Space>
                    </div>
                    <Space
                      direction="vertical"
                      style={{ width: "100%" }}
                    ></Space>
                  </div>
                ))}
              </Card>
            )}
          </Form.Item>
          <Form.Item name="categoryKey" label="分类">
            <Select
              allowClear
              placeholder="选择分类"
              options={categoryOptions}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加变量"
        open={addVarModalOpen}
        onCancel={() => {
          setAddVarModalOpen(false);
          setNewVarName("");
        }}
        onOk={handleAddVariable}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入变量名"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          onPressEnter={handleAddVariable}
        />
      </Modal>
    </>
  );
};