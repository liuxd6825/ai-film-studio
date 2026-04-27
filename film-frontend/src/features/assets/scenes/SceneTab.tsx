import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import type {
  Asset,
  SortField,
  SortOrder,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../common/types";
import { SCENE_TYPES } from "./types";
import { sceneApi } from "./api";
import { AssetToolbar } from "../common/AssetToolbar";
import { AssetGrid } from "../common/AssetGrid";
import { SceneEditor } from "./SceneEditor";

interface SceneTabProps {
  projectId: string;
}

export function SceneTab({ projectId }: SceneTabProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sceneApi.list(projectId);
      setAssets(data);
    } catch {
      message.error("获取场景列表失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assets, searchQuery, sortField, sortOrder]);

  const handleCreateAsset = async (data: CreateAssetRequest) => {
    try {
      const orgId = localStorage.getItem("org_id");
      if (!orgId) {
        message.error("缺少组织信息");
        return;
      }
      await sceneApi.create(projectId, { ...data, orgId });
      message.success("创建成功");
      fetchAssets();
    } catch {
      message.error("创建失败");
      throw new Error("create failed");
    }
  };

  const handleUpdateAsset = async (id: string, data: UpdateAssetRequest) => {
    try {
      const { coverImageId, ...updateData } = data;
      await sceneApi.update(id, updateData);
      if (coverImageId) {
        await fetch(`/api/v1/visual_images/${id}/cover`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: coverImageId }),
        });
      }
      message.success("保存成功");
      fetchAssets();
    } catch {
      message.error("保存失败");
      throw new Error("update failed");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await sceneApi.delete(id);
      message.success("删除成功");
      fetchAssets();
    } catch {
      message.error("删除失败");
      throw new Error("delete failed");
    }
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setModalVisible(true);
  };

  return (
    <div>
      <AssetToolbar
        assetType="scene"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onCreate={openCreateModal}
      />

      <AssetGrid
        assets={filteredAssets}
        onEdit={handleEdit}
        loading={loading}
      />

      <SceneEditor
        visible={modalVisible}
        asset={editingAsset}
        typeOptions={SCENE_TYPES}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateAsset}
        onUpdate={handleUpdateAsset}
        onDelete={handleDeleteAsset}
      />
    </div>
  );
}
