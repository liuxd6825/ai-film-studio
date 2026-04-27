import React from "react";
import { Form, Input, Select } from "antd";
import { PromptVariable } from "../api/promptApi";
import { usePromptStore } from "../stores/promptStore";

const { TextArea } = Input;

interface VariableFormProps {
  variables: PromptVariable[];
}

export const VariableForm: React.FC<VariableFormProps> = ({ variables }) => {
  const { variableValues, setVariableValue } = usePromptStore();

  const renderInput = (variable: PromptVariable) => {
    switch (variable.type) {
      case "long_text":
        return (
          <TextArea
            placeholder={variable.description}
            value={variableValues[variable.name] || ""}
            onChange={(e) => setVariableValue(variable.name, e.target.value)}
            rows={4}
          />
        );
      case "enum":
        return (
          <Select
            style={{ width: "100%" }}
            value={variableValues[variable.name] || variable.default}
            onChange={(val) => setVariableValue(variable.name, val)}
            options={variable.options?.map((opt) => ({
              label: opt,
              value: opt,
            }))}
            placeholder={variable.description}
          />
        );
      default:
        return (
          <Input
            placeholder={variable.description}
            value={variableValues[variable.name] || ""}
            onChange={(e) => setVariableValue(variable.name, e.target.value)}
          />
        );
    }
  };

  return (
    <Form layout="vertical">
      {variables.map((variable) => (
        <Form.Item key={variable.name} label={variable.name}>
          {renderInput(variable)}
        </Form.Item>
      ))}
    </Form>
  );
};
