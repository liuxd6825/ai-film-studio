import { Modal, Form, Input, Select, Button, message, Tabs } from "antd";
import { useEffect, useState } from "react";
import type {
  Asset,
  AssetStatus,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../common/types";
import { STATUS_LABELS } from "../common/types";
import { ImageSessionManager } from "../common/ImageSessionManager";

interface SceneEditorProps {
  visible: boolean;
  asset: Asset | null;
  typeOptions: { value: string; label: string }[];
  onClose: () => void;
  onCreate: (data: CreateAssetRequest) => Promise<void>;
  onUpdate: (id: string, data: UpdateAssetRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: Number(value) as AssetStatus,
  label,
}));

export function SceneEditor({
  visible,
  asset,
  typeOptions,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: SceneEditorProps) {
  const [form] = Form.useForm();
  const isEditing = !!asset;

  const [imageManagerVisible, setImageManagerVisible] = useState(false);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedCoverUrl(asset?.coverUrl || null);
      setSelectedCoverId(null);
      if (asset) {
        form.setFieldsValue({
          name: asset.name,
          desc: asset.desc,
          type: asset.type,
          status: asset.status,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, asset, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedCoverId) {
        values.coverImageId = selectedCoverId;
      }

      if (isEditing && asset) {
        await onUpdate(asset.id, values);
      } else {
        await onCreate(values);
      }
      onClose();
    } catch {
      // validation failed
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    try {
      await onDelete(asset.id);
      onClose();
    } catch {
      message.error("删除失败");
    }
  };

  const handleSelectImage = (imageId: string, imageUrl: string) => {
    setSelectedCoverId(imageId);
    setSelectedCoverUrl(imageUrl);
    setImageManagerVisible(false);
  };

  const tabItems = [
    {
      key: "basic",
      label: "基础信息",
      children: (
        <div className="pt-4">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" maxLength={255} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            {typeOptions.length > 0 ? (
              <Select
                placeholder="请选择类型"
                allowClear
                options={typeOptions}
              />
            ) : (
              <Input placeholder="请输入类型" maxLength={50} />
            )}
          </Form.Item>
          {isEditing && (
            <Form.Item name="status" label="状态">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
        </div>
      ),
    },
    {
      key: "details",
      label: "场景描述",
      children: (
        <div className="pt-4 space-y-2">
          <Form.Item name="desc" label="详细描述">
            <Input.TextArea
              rows={6}
              placeholder="场景的时间、地点、环境、氛围等详细描述..."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: "visuals",
      label: "场景视觉",
      children: (
        <div className="pt-4 flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
            {selectedCoverUrl ? (
              <img
                src={selectedCoverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 dark:text-gray-500">暂无封面图</span>
            )}
          </div>
          <Button
            type="primary"
            onClick={() => setImageManagerVisible(true)}
            disabled={!isEditing}
          >
            {isEditing ? "管理视觉资源" : "请先创建场景后再管理图片"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={isEditing ? "编辑场景" : "新建场景"}
        open={visible}
        onCancel={onClose}
        footer={
          <div className="flex justify-between">
            <div>
              {isEditing && (
                <Button danger onClick={handleDelete}>
                  删除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleSubmit}>
                {isEditing ? "保存" : "创建"}
              </Button>
            </div>
          </div>
        }
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Tabs items={tabItems} defaultActiveKey="basic" />
        </Form>
      </Modal>

      {asset && (
        <ImageSessionManager
          visible={imageManagerVisible}
          visualObjectId={asset.id}
          projectId={asset.projectId}
          onClose={() => setImageManagerVisible(false)}
          onSelectImage={handleSelectImage}
        />
      )}
    </>
  );
}
