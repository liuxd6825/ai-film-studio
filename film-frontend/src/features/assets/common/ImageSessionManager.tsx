import { Modal, Button, Empty } from "antd";

interface ImageSessionManagerProps {
  visible: boolean;
  visualObjectId: string;
  projectId: string;
  onClose: () => void;
  onSelectImage: (imageId: string, imageUrl: string) => void;
}

export function ImageSessionManager({
  visible,
  visualObjectId,
  projectId,
  onClose,
  onSelectImage,
}: ImageSessionManagerProps) {
  // eslint-disable-next-line no-console
  console.log({ visualObjectId, projectId, onSelectImage });
  return (
    <Modal
      title="图片会话管理器"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20 }}
      styles={{ body: { height: "80vh", padding: 0 } }}
      destroyOnClose
    >
      <div className="flex w-full h-full dark:bg-gray-800">
        {/* Left Pane: AI Chat */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4">
          <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded">
            <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
              AI 图片生成功能即将上线
            </div>
          </div>
          <div className="h-32 border border-gray-300 dark:border-gray-600 rounded p-2 flex flex-col dark:bg-gray-700/30">
            <textarea
              className="flex-1 resize-none outline-none dark:bg-gray-800 dark:text-gray-100"
              placeholder="输入提示词生成图片..."
              disabled
            />
            <div className="flex justify-end mt-2">
              <Button type="primary" disabled>
                生成
              </Button>
            </div>
          </div>
        </div>

        {/* Right Pane: Visual Library */}
        <div className="w-1/2 flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-lg dark:text-gray-100">视觉资源库</h3>
            <Button>上传本地图片</Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded p-4 flex items-center justify-center">
            <Empty description="暂无关联图片，请先生成或上传" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
