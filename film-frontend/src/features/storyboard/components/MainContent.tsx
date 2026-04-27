import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Cloud,
  Video,
  List,
  LayoutGrid,
  PanelTop,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clapperboard,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useStoryboardStore } from "../store";
import { Badge, Button } from "./ui";
import { CameraMovementOverlay } from "./CameraMovementOverlay";
import { KeyframeEditDialog } from "./KeyframeEditDialog";
import { BatchGenerateModal } from "./BatchGenerateModal";
import { ShotEditDialog } from "./ShotEditDialog";
import { ExpandedKeyframeRow } from "./ExpandedKeyframeRow";
import { TextToVideoDialog } from "./TextToVideoDialog";
import {
  Keyframe,
  Shot,
  CameraShotType,
  CameraAngle,
  CameraMovement,
} from "../types";

const SHOTS_PER_NAV_PAGE = 10;

function formatDuration(value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "0s";
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num)) return "0s";
  return `${num}s`;
}

const SCENE_TYPE_OPTIONS = ["内景", "外景", "混合"];
const WEATHER_OPTIONS = ["晴", "雨", "阴", "雪", "雾", "风"];
const TIME_FRAME_OPTIONS = ["清晨", "上午", "中午", "下午", "傍晚", "夜晚"];
const LIGHTING_OPTIONS = ["自然光", "人工光", "逆光", "侧光", "顶光"];
const CAMERA_ANGLE_H_OPTIONS = ["正面", "侧面", "背面", "斜侧面"];
const CAMERA_ANGLE_V_OPTIONS = ["平视", "仰视", "俯视", "鸟瞰"];
const FRAMING_OPTIONS = ["全景", "中景", "近景", "特写", "过肩"];
const CAMERA_MOVEMENT_OPTIONS = [
  "固定",
  "推",
  "拉",
  "左摇",
  "右摇",
  "上摇",
  "下摇",
  "左移",
  "右移",
  "上升",
  "下降",
  "前跟",
  "后跟",
  "左环绕",
  "右环绕",
  "手持",
];
const NARRATIVE_POV_OPTIONS = [
  "客观视点",
  "主观视点",
  "半主观视点",
  "全知视点",
  "直接视点",
];

function InlineSelect({
  value,
  options,
  onSave,
  onCancel,
  placeholder,
}: {
  value: string;
  options: string[];
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave((e.target as HTMLInputElement).value);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        list={`datalist-${options[0]}`}
        className="w-full h-6 px-2 text-xs border border-blue-500 rounded bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-zinc-100"
        onBlur={(e) => onSave(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <datalist id={`datalist-${options[0]}`}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

export function MainContent() {
  const {
    projectId,
    storyPages,
    shots,
    setShots,
    keyframes,
    isShotsLoading,
    selectedShotIds,
    viewMode,
    setViewMode,
    selectedStoryPageId,
    setSelectedStoryPageId,
    showShotNav,
    setShowShotNav,
    shotNavPage,
    setShotNavPage,
    setEditingShot,
    editingShot,
    setKeyframes,
    openKeyframeEdit,
    updateKeyframe,
    updateKeyframeAPI,
    createKeyframe,
    deleteKeyframeAPI,
    setActivePromptId,
    batchUpdateKeyframesAPI,
    toggleShotSelection,
    deleteSelectedShotsAPI,
    updateShot,
    createShot,
    collapsedShotIds,
    setAllShotsCollapsed,
    editingKeyframeDraft,
    openStoryPageSelectDialog,
    generateKeyframesAI,
  } = useStoryboardStore();

  const [draggedKeyframeId, setDraggedKeyframeId] = useState<string | null>(
    null,
  );
  const [dragOverKeyframeId, setDragOverKeyframeId] = useState<string | null>(
    null,
  );
  const [showBatchGenerate, setShowBatchGenerate] = useState(false);
  const [editingShotField, setEditingShotField] = useState<{
    shotId: string;
    field: string;
  } | null>(null);
  const [inlineEditingKfField, setInlineEditingKfField] = useState<{
    kfId: string;
    field: string;
  } | null>(null);
  const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
  const [textToVideoShot, setTextToVideoShot] = useState<{
    shot: Shot;
    keyframes: Keyframe[];
  } | null>(null);

  const selectedStoryPage = storyPages.find(
    (sp) => sp.id === selectedStoryPageId,
  );
  const pageShots = shots
    .filter((s) => s.storyPageId === selectedStoryPageId)
    .sort((a, b) => a.orderNum - b.orderNum);

  const totalNavPages = Math.ceil(pageShots.length / SHOTS_PER_NAV_PAGE);
  const currentNavShots = pageShots.slice(
    shotNavPage * SHOTS_PER_NAV_PAGE,
    (shotNavPage + 1) * SHOTS_PER_NAV_PAGE,
  );

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (editingShotField || inlineEditingKfField)) {
        setEditingShotField(null);
        setInlineEditingKfField(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingShotField, inlineEditingKfField]);

  const handleNavigate = (pageId: string, shotId?: string, kfId?: string) => {
    if (selectedStoryPageId !== pageId) {
      setSelectedStoryPageId(pageId);
      setShotNavPage(0);
    }
    const elementId = kfId ? `kf-${kfId}` : shotId ? `shot-${shotId}` : null;
    if (elementId) {
      setTimeout(() => scrollToElement(elementId), 100);
    }
  };

  const handleInlineEditSave = async (
    shotId: string,
    field: string,
    value: any,
  ) => {
    try {
      await updateShot(shotId, { [field]: value });
      setEditingShotField(null);
    } catch (error) {
      console.error("Failed to update shot:", error);
    }
  };

  const handleInlineKfEditSave = (kfId: string, field: string, value: any) => {
    if (kfId.startsWith("kf-new-")) {
      updateKeyframe(kfId, { [field]: value });
      setInlineEditingKfField(null);
      return;
    }
    updateKeyframe(kfId, { [field]: value });
    setInlineEditingKfField(null);
    updateKeyframeAPI(kfId, { [field]: value }).catch(() => {
      console.error("Failed to sync keyframe to server");
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedKeyframeId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverKeyframeId) {
      setDragOverKeyframeId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverKeyframeId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverKeyframeId(null);

    if (!draggedKeyframeId || draggedKeyframeId === targetId) {
      setDraggedKeyframeId(null);
      return;
    }

    const prev = keyframes;
    const draggedKf = prev.find((k) => k.id === draggedKeyframeId);
    const targetKf = prev.find((k) => k.id === targetId);
    if (!draggedKf || !targetKf) {
      setDraggedKeyframeId(null);
      return;
    }

    const shotGroups: Record<string, Keyframe[]> = {};
    prev.forEach((kf) => {
      if (!shotGroups[kf.shotId]) shotGroups[kf.shotId] = [];
      shotGroups[kf.shotId].push(kf);
    });

    Object.keys(shotGroups).forEach((shotId) => {
      shotGroups[shotId].sort((a, b) => a.orderNum - b.orderNum);
    });

    const sourceShot = shotGroups[draggedKf.shotId];
    const sourceIndex = sourceShot.findIndex((k) => k.id === draggedKeyframeId);
    if (sourceIndex !== -1) {
      sourceShot.splice(sourceIndex, 1);
    }

    const targetShot = shotGroups[targetKf.shotId] || [];
    const targetIndex = targetShot.findIndex((k) => k.id === targetId);
    const updatedDraggedKf = { ...draggedKf, shotId: targetKf.shotId };
    if (targetIndex !== -1) {
      targetShot.splice(targetIndex, 0, updatedDraggedKf);
    } else {
      targetShot.push(updatedDraggedKf);
    }

    if (!shotGroups[targetKf.shotId]) {
      shotGroups[targetKf.shotId] = targetShot;
    }

    const finalKeyframes: Keyframe[] = [];
    const affectedShotIds = new Set<string>();
    Object.keys(shotGroups).forEach((shotId) => {
      shotGroups[shotId].forEach((kf, index) => {
        finalKeyframes.push({
          ...kf,
          orderNum: index + 1,
          frameNumber: index + 1,
        });
      });
      affectedShotIds.add(shotId);
    });

    setKeyframes(finalKeyframes);

    const toUpdate = finalKeyframes
      .filter((kf) => affectedShotIds.has(kf.shotId))
      .map((kf) => ({
        id: kf.id,
        shotId: kf.shotId,
        orderNum: kf.orderNum,
        frameNumber: kf.frameNumber,
      }));
    batchUpdateKeyframesAPI(toUpdate);

    setDraggedKeyframeId(null);
  };

  const handleDropOnShot = (e: React.DragEvent, targetShotId: string) => {
    e.preventDefault();
    setDragOverKeyframeId(null);

    if (!draggedKeyframeId) return;

    const prev = keyframes;
    const draggedKf = prev.find((k) => k.id === draggedKeyframeId);
    if (!draggedKf) {
      setDraggedKeyframeId(null);
      return;
    }

    const shotGroups: Record<string, Keyframe[]> = {};
    prev.forEach((kf) => {
      if (!shotGroups[kf.shotId]) shotGroups[kf.shotId] = [];
      shotGroups[kf.shotId].push(kf);
    });

    Object.keys(shotGroups).forEach((shotId) => {
      shotGroups[shotId].sort((a, b) => a.orderNum - b.orderNum);
    });

    const sourceShot = shotGroups[draggedKf.shotId];
    const sourceIndex = sourceShot.findIndex((k) => k.id === draggedKeyframeId);
    if (sourceIndex !== -1) {
      sourceShot.splice(sourceIndex, 1);
    }

    const targetShot = shotGroups[targetShotId] || [];
    const updatedDraggedKf = { ...draggedKf, shotId: targetShotId };
    targetShot.unshift(updatedDraggedKf);

    if (!shotGroups[targetShotId]) {
      shotGroups[targetShotId] = targetShot;
    }

    const finalKeyframes: Keyframe[] = [];
    const affectedShotIds = new Set<string>([draggedKf.shotId, targetShotId]);
    Object.keys(shotGroups).forEach((shotId) => {
      shotGroups[shotId].forEach((kf, index) => {
        finalKeyframes.push({
          ...kf,
          orderNum: index + 1,
          frameNumber: index + 1,
        });
      });
      affectedShotIds.add(shotId);
    });

    setKeyframes(finalKeyframes);

    const toUpdate = finalKeyframes
      .filter((kf) => affectedShotIds.has(kf.shotId))
      .map((kf) => ({
        id: kf.id,
        shotId: kf.shotId,
        orderNum: kf.orderNum,
        frameNumber: kf.frameNumber,
      }));
    batchUpdateKeyframesAPI(toUpdate);

    setDraggedKeyframeId(null);
  };

  const handleDeleteKeyframe = (kfId: string) => {
    setKeyframes((prev) => prev.filter((kf) => kf.id !== kfId));
    deleteKeyframeAPI(kfId);
  };

  const handleInsertKeyframe = (shotId: string, afterOrderNum?: number) => {
    const shotKfs = keyframes
      .filter((kf) => kf.shotId === shotId)
      .sort((a, b) => a.orderNum - b.orderNum);
    const insertIndex =
      afterOrderNum !== undefined
        ? shotKfs.findIndex((kf) => kf.orderNum === afterOrderNum) + 1
        : shotKfs.length;
    const orderNum = insertIndex + 1;

    const tempId = `kf-new-${Date.now()}`;
    const newKf: Keyframe = {
      id: tempId,
      shotId,
      frameNumber: orderNum,
      imageUrl:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
      thumbnailUrl:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
      description: "新关键帧画面描述",
      imagePrompt: "",
      actionDescription: "新关键帧动作说明",
      cameraSettings: { focalLength: "35mm", aperture: "f/2.8" },
      orderNum: orderNum,
      cameraShotType: CameraShotType.Medium,
      cameraAngle: CameraAngle.EyeLevel,
      cameraMovement: CameraMovement.Static,
      duration: "2",
      soundEffects: "",
    };

    const apiData = {
      frameNumber: orderNum,
      orderNum: orderNum,
      imageUrl: newKf.imageUrl,
      thumbnailUrl: newKf.thumbnailUrl,
      description: newKf.description,
      imagePrompt: newKf.imagePrompt,
      actionDescription: newKf.actionDescription,
      cameraShotType: newKf.cameraShotType,
      cameraAngle: newKf.cameraAngle,
      cameraMovement: newKf.cameraMovement,
      duration: parseInt(newKf.duration, 10),
      soundEffects: newKf.soundEffects,
    };

    const newShotKfs = [...shotKfs];
    newShotKfs.splice(insertIndex, 0, newKf);

    newShotKfs.forEach((kf, idx) => {
      kf.orderNum = idx + 1;
      kf.frameNumber = idx + 1;
    });

    setKeyframes((prev) => [
      ...prev.filter((kf) => kf.shotId !== shotId),
      ...newShotKfs,
    ]);

    createKeyframe(shotId, apiData)
      .then((created) => {
        if (created) {
          setKeyframes((prev) => prev.filter((kf) => kf.id !== tempId));
        }
      })
      .catch((error) => {
        console.error("Failed to create keyframe:", error);
        setKeyframes((prev) => prev.filter((kf) => kf.id !== tempId));
      });
  };

  if (!selectedStoryPage) {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-col gap-4">
      <Clapperboard size={48} className="text-zinc-300 dark:text-zinc-600" />
      <p>请在左侧选择一个故事页</p>
    </div>
  );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50">
      <header className="bg-white dark:bg-zinc-900 border-b dark:border-zinc-700 flex flex-col shrink-0">
        <div className="px-4 py-3 flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {selectedStoryPage.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 mr-2">
              <button
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${showShotNav ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                onClick={() => setShowShotNav(!showShotNav)}
              >
                <PanelTop size={14} />
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-1" />
              <button
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${viewMode === "edit" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                onClick={() => setViewMode("edit")}
              >
                <List size={14} />
              </button>
              <button
                className={`p-1.5 rounded flex items-center justify-center transition-colors ${viewMode === "browse" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
                onClick={() => setViewMode("browse")}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 text-zinc-500"
                onClick={() => setAllShotsCollapsed(true)}
                title="全部收起"
              >
                <ChevronDown size={12} className="rotate-180" />
                收起
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 text-zinc-500"
                onClick={() => setAllShotsCollapsed(false)}
                title="全部展开"
              >
                <ChevronDown size={12} />
                展开
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-zinc-400 dark:text-zinc-500" />{" "}
                {selectedStoryPage.storyTime}
              </div>
              <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-600" />
              <div className="flex items-center gap-1.5">
                <Cloud size={12} className="text-zinc-400 dark:text-zinc-500" />{" "}
                {selectedStoryPage.weather}
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() =>
                setEditingShot({
                  id: "",
                  storyPageId: selectedStoryPageId || "",
                  content: "",
                  orderNum: 0,
                  state: "草稿" as any,
                  characterIds: [],
                })
              }
            >
              <Plus size={14} />
              添加镜头
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBatchGenerate(true)}
              disabled={!selectedStoryPageId}
            >
              <Sparkles size={16} className="mr-2" />
              批量生成
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openStoryPageSelectDialog}
            >
              打开
            </Button>
            {selectedShotIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedShotsAPI}
              >
                <Trash2 size={14} className="mr-1" />
                删除选中 ({selectedShotIds.length})
              </Button>
            )}
          </div>
        </div>

        {showShotNav && pageShots.length > 0 && (
          <div className="px-4 py-2 bg-zinc-50/80 dark:bg-zinc-800/80 border-t border-zinc-100 dark:border-zinc-700 flex items-start sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 flex-wrap">
              {currentNavShots.map((shot) => (
                <button
                  key={shot.id}
                  onClick={() => handleNavigate(selectedStoryPage.id, shot.id)}
                  className="px-2.5 py-1.5 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Video size={12} className="text-zinc-400 dark:text-zinc-500" />
                  <span>{shot.orderNum}</span>
                </button>
              ))}
            </div>

            {totalNavPages > 1 && (
              <div className="flex items-center gap-1 shrink-0 ml-auto pl-2 border-l border-zinc-200 dark:border-zinc-700 mt-0.5 sm:mt-0">
                <button
                  className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
                  disabled={shotNavPage === 0}
                  onClick={() => setShotNavPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium min-w-[30px] text-center">
                  {shotNavPage + 1} / {totalNavPages}
                </span>
                <button
                  className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
                  disabled={shotNavPage >= totalNavPages - 1}
                  onClick={() =>
                    setShotNavPage((p) => Math.min(totalNavPages - 1, p + 1))
                  }
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-0">
          <div className="space-y-2 pb-12">
            {viewMode === "edit" ? (
              pageShots.map((shot) => {
                const shotKeyframes = keyframes
                  .filter((kf) => kf.shotId === shot.id)
                  .sort((a, b) => a.orderNum - b.orderNum);

                return (
                  <div
                    key={shot.id}
                    id={`shot-${shot.id}`}
                    className="bg-white dark:bg-zinc-800 rounded-lg border shadow-sm scroll-mt-4 flex items-stretch dark:border-zinc-700"
                    onDragOver={(e) => handleDragOver(e, `shot-${shot.id}`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnShot(e, shot.id)}
                  >
                    <div className="w-1/4 min-w-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 flex flex-col">
                      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/90 dark:bg-zinc-800/90 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedShotIds.includes(shot.id)}
                            onChange={() => toggleShotSelection(shot.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                            镜头 {shot.orderNum}
                          </span>
                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "state" ? (
                            <InlineSelect
                              value={shot.state}
                              options={["草稿", "已修订", "已批准"]}
                              onSave={(value) =>
                                handleInlineEditSave(shot.id, "state", value)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <span
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "state",
                                })
                              }
                              className="cursor-pointer"
                            >
                              <Badge
                                variant={
                                  shot.state === "已批准"
                                    ? "default"
                                    : shot.state === "已修订"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="font-normal text-[10px] h-5 px-1.5 hover:bg-zinc-100"
                              >
                                {shot.state}
                              </Badge>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1">
                        <div className="w-2/5 p-2 border-r border-zinc-200 dark:border-zinc-700 flex flex-col flex-1 min-h-0">
                          <div className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase mb-1 shrink-0">
                            画面描述
                          </div>
                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "content" ? (
                            <textarea
                              className="w-full flex-1 px-2 py-1 text-[10px] border border-blue-500 rounded bg-white dark:bg-zinc-800 focus:outline-none resize-none dark:text-zinc-100"
                              defaultValue={shot.content || ""}
                              onBlur={(e) =>
                                handleInlineEditSave(
                                  shot.id,
                                  "content",
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setEditingShotField(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="flex-1 min-h-0 p-2 text-[10px] text-zinc-700 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-700/50 rounded border border-transparent cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 overflow-y-auto"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "content",
                                })
                              }
                            >
                              {shot.content || "-"}
                            </div>
                          )}
                        </div>

                        <div className="w-1/5 p-2 border-r border-zinc-200 dark:border-zinc-700 space-y-1">
                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "sceneType" ? (
                            <InlineSelect
                              value={shot.sceneType || ""}
                              options={SCENE_TYPE_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "sceneType", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 text-[10px] text-zinc-700 dark:text-zinc-300"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "sceneType",
                                })
                              }
                            >
                              <span className="text-zinc-400 dark:text-zinc-500">场景:</span>
                              <span className="truncate">
                                {shot.sceneType || "-"}
                              </span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "weather" ? (
                            <InlineSelect
                              value={shot.weather || ""}
                              options={WEATHER_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "weather", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 text-[10px] text-zinc-700 dark:text-zinc-300"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "weather",
                                })
                              }
                            >
                              <span className="text-zinc-400 dark:text-zinc-500">天气:</span>
                              <span>{shot.weather || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "timeFrame" ? (
                            <InlineSelect
                              value={shot.timeFrame || ""}
                              options={TIME_FRAME_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "timeFrame", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 text-[10px] text-zinc-700 dark:text-zinc-300"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "timeFrame",
                                })
                              }
                            >
                              <span className="text-zinc-400 dark:text-zinc-500">时间:</span>
                              <span>{shot.timeFrame || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "lighting" ? (
                            <InlineSelect
                              value={shot.lighting || ""}
                              options={LIGHTING_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "lighting", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 text-[10px] text-zinc-700 dark:text-zinc-300"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "lighting",
                                })
                              }
                            >
                              <span className="text-zinc-400 dark:text-zinc-500">光线:</span>
                              <span>{shot.lighting || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "cameraAngleH" ? (
                            <InlineSelect
                              value={shot.cameraAngleH || ""}
                              options={CAMERA_ANGLE_H_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "cameraAngleH", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 text-[10px] text-zinc-700 dark:text-zinc-300"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "cameraAngleH",
                                })
                              }
                            >
                              <span className="text-zinc-400 dark:text-zinc-500">水平:</span>
                              <span>{shot.cameraAngleH || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "cameraAngleV" ? (
                            <InlineSelect
                              value={shot.cameraAngleV || ""}
                              options={CAMERA_ANGLE_V_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "cameraAngleV", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 text-[10px]"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "cameraAngleV",
                                })
                              }
                            >
                              <span className="text-zinc-400">垂直:</span>
                              <span>{shot.cameraAngleV || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "cameraMovement" ? (
                            <InlineSelect
                              value={shot.cameraMovement || ""}
                              options={CAMERA_MOVEMENT_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(
                                  shot.id,
                                  "cameraMovement",
                                  v,
                                )
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 text-[10px]"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "cameraMovement",
                                })
                              }
                            >
                              <span className="text-zinc-400">运镜:</span>
                              <span className="truncate">
                                {shot.cameraMovement || "-"}
                              </span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "narrativePov" ? (
                            <InlineSelect
                              value={shot.narrativePov || ""}
                              options={NARRATIVE_POV_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "narrativePov", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 text-[10px]"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "narrativePov",
                                })
                              }
                            >
                              <span className="text-zinc-400">视点:</span>
                              <span className="truncate">
                                {shot.narrativePov || "-"}
                              </span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "framing" ? (
                            <InlineSelect
                              value={shot.framing || ""}
                              options={FRAMING_OPTIONS}
                              onSave={(v) =>
                                handleInlineEditSave(shot.id, "framing", v)
                              }
                              onCancel={() => setEditingShotField(null)}
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 text-[10px]"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "framing",
                                })
                              }
                            >
                              <span className="text-zinc-400">景别:</span>
                              <span>{shot.framing || "-"}</span>
                            </div>
                          )}

                          {editingShotField?.shotId === shot.id &&
                          editingShotField?.field === "duration" ? (
                            <input
                              type="number"
                              className="w-full h-5 px-1 text-[10px] border border-blue-500 rounded bg-white focus:outline-none"
                              defaultValue={shot.duration || 0}
                              onBlur={(e) =>
                                handleInlineEditSave(
                                  shot.id,
                                  "duration",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape")
                                  setEditingShotField(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-zinc-700 text-[10px]"
                              onClick={() =>
                                setEditingShotField({
                                  shotId: shot.id,
                                  field: "duration",
                                })
                              }
                            >
                              <span className="text-zinc-400">时长:</span>
                              <span>
                                {shot.duration ? `${shot.duration}s` : "-"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-2/5 p-2 flex flex-col flex-1 min-h-0">
                          <div className="text-[9px] text-zinc-400 uppercase mb-1 shrink-0">
                            动作情绪
                          </div>
                          <div className="mb-2 flex-1 min-h-0">
                            {editingShotField?.shotId === shot.id &&
                            editingShotField?.field === "actionEmotion" ? (
                              <textarea
                                className="w-full h-full px-2 py-1 text-[10px] border border-blue-500 rounded bg-white focus:outline-none resize-none"
                                defaultValue={shot.actionEmotion || ""}
                                onBlur={(e) =>
                                  handleInlineEditSave(
                                    shot.id,
                                    "actionEmotion",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Escape")
                                    setEditingShotField(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="h-full p-2 text-[10px] text-zinc-700 bg-zinc-100/50 rounded border border-transparent cursor-pointer hover:border-zinc-300 overflow-y-auto"
                                onClick={() =>
                                  setEditingShotField({
                                    shotId: shot.id,
                                    field: "actionEmotion",
                                  })
                                }
                              >
                                {shot.actionEmotion || "-"}
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-zinc-400 uppercase mb-1 shrink-0">
                            对白音效
                          </div>
                          <div className="flex-1 min-h-0">
                            {editingShotField?.shotId === shot.id &&
                            editingShotField?.field === "dialogueSound" ? (
                              <textarea
                                className="w-full h-full px-2 py-1 text-[10px] border border-blue-500 rounded bg-white focus:outline-none resize-none"
                                defaultValue={shot.dialogueSound || ""}
                                onBlur={(e) =>
                                  handleInlineEditSave(
                                    shot.id,
                                    "dialogueSound",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Escape")
                                    setEditingShotField(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="h-full p-2 text-[10px] text-zinc-700 bg-zinc-100/50 rounded border border-transparent cursor-pointer hover:border-zinc-300 overflow-y-auto"
                                onClick={() =>
                                  setEditingShotField({
                                    shotId: shot.id,
                                    field: "dialogueSound",
                                  })
                                }
                              >
                                {shot.dialogueSound || "-"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-3/4 min-w-0 flex flex-col">
                      <div className="px-3 py-1.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between shrink-0">
                        <span className="text-[10px] text-zinc-400 uppercase">
                          关键帧 ({shotKeyframes.length})
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 text-[10px] px-1.5"
                            onClick={async () => {
                              setGeneratingShotId(shot.id);
                              try {
                                await generateKeyframesAI(shot.id);
                              } finally {
                                setGeneratingShotId(null);
                              }
                            }}
                            disabled={generatingShotId === shot.id}
                          >
                            <Sparkles size={10} className="mr-0.5" />
                            {generatingShotId === shot.id ? "生成中..." : "生成关键帧"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-5 text-[10px] px-1.5"
                            onClick={() => handleInsertKeyframe(shot.id)}
                          >
                            <Plus size={10} className="mr-0.5" />
                            添加
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] px-1.5"
                            onClick={() =>
                              setTextToVideoShot({ shot, keyframes: shotKeyframes })
                            }
                          >
                            <Clapperboard size={10} className="mr-0.5" />
                            文生视频
                          </Button>
                        </div>
                      </div>

                      {!collapsedShotIds.has(shot.id) && (
                        <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto">
                          {shotKeyframes.map((kf) => (
                            <ExpandedKeyframeRow
                              key={kf.id}
                              kf={kf}
                              onEdit={() => openKeyframeEdit(kf)}
                              onDelete={() => handleDeleteKeyframe(kf.id)}
                              onInsertAfter={() =>
                                handleInsertKeyframe(shot.id, kf.orderNum)
                              }
                              onInlineSave={(kfId, field, value) =>
                                handleInlineKfEditSave(kfId, field, value)
                              }
                              dragging={draggedKeyframeId === kf.id}
                              dragOver={dragOverKeyframeId === kf.id}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              editingField={inlineEditingKfField}
                              onStartEdit={(kfId, field) =>
                                setInlineEditingKfField({ kfId, field })
                              }
                              onCancelEdit={() => setInlineEditingKfField(null)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {pageShots.map((shot) => {
                  const shotKeyframes = keyframes
                    .filter((kf) => kf.shotId === shot.id)
                    .sort((a, b) => a.orderNum - b.orderNum);

                  return (
                    <React.Fragment key={shot.id}>
                      <div
                        className={`rounded-lg border bg-white flex flex-col items-center justify-center aspect-video shadow-sm p-4 text-center relative overflow-hidden group transition-all ${dragOverKeyframeId === `shot-${shot.id}` ? "border-blue-500 border-2 shadow-md bg-blue-50/50" : "border-zinc-200"}`}
                        onDragOver={(e) => handleDragOver(e, `shot-${shot.id}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnShot(e, shot.id)}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800" />
                        <Video size={24} className="text-zinc-400 mb-2" />
                        <span className="font-medium text-zinc-900">
                          镜头 {shot.orderNum}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              shot.state === "已批准"
                                ? "default"
                                : shot.state === "已修订"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="font-normal text-[10px]"
                          >
                            {shot.state}
                          </Badge>
                        </div>
                      </div>

                      {shotKeyframes.map((kf) => (
                        <div
                          key={kf.id}
                          className={`group relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 aspect-video shadow-sm cursor-move transition-all ${draggedKeyframeId === kf.id ? "opacity-50 scale-[0.95]" : ""} ${dragOverKeyframeId === kf.id ? "border-blue-500 border-2 shadow-md" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, kf.id)}
                          onDragOver={(e) => handleDragOver(e, kf.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, kf.id)}
                        >
                          <img
                            src={kf.thumbnailUrl}
                            alt={`Frame ${kf.frameNumber}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <CameraMovementOverlay movement={kf.cameraMovement} />
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-mono z-10">
                            F
                            {kf.frameNumber?.toString().padStart(2, "0") ??
                              "--"}
                          </div>
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 z-10">
                            <Clock size={10} />
                            {formatDuration(kf.duration)}
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="flex items-center gap-1.5">
                              <button className="p-1 bg-white/90 hover:bg-white rounded text-zinc-700 hover:text-zinc-900 shadow-sm">
                                <Edit2 size={12} />
                              </button>
                              <button className="p-1 bg-white/90 hover:bg-white rounded text-zinc-700 hover:text-red-600 shadow-sm">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {kf.promptId && (
                                <button
                                  className="p-1 bg-blue-500/90 hover:bg-blue-500 rounded text-white shadow-sm"
                                  onClick={() =>
                                    setActivePromptId(kf.promptId!)
                                  }
                                >
                                  <ImageIcon size={12} />
                                </button>
                              )}
                              <button
                                className="p-1 bg-white/90 hover:bg-white rounded text-zinc-700 hover:text-zinc-900 shadow-sm"
                                onClick={() =>
                                  handleInsertKeyframe(shot.id, kf.orderNum)
                                }
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {isShotsLoading ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-xl border border-dashed dark:border-zinc-700">
                <div className="animate-spin w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">加载中...</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">正在加载镜头数据</p>
              </div>
            ) : pageShots.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-xl border border-dashed dark:border-zinc-700">
                <Video size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">暂无镜头</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                  这个故事页还没有添加任何镜头。
                </p>
                <Button
                  onClick={() =>
                    setEditingShot({
                      id: "",
                      storyPageId: selectedStoryPageId || "",
                      content: "",
                      orderNum: 0,
                      state: "草稿" as any,
                      characterIds: [],
                    })
                  }
                >
                  添加第一个镜头
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {editingKeyframeDraft && <KeyframeEditDialog onClose={() => {}} />}

      {showBatchGenerate && selectedStoryPageId && projectId && (
        <BatchGenerateModal
          storyPageId={selectedStoryPageId}
          projectId={projectId}
          onClose={() => setShowBatchGenerate(false)}
          onSaved={() => {
            setShowBatchGenerate(false);
          }}
        />
      )}

      {editingShot && (
        <ShotEditDialog
          shot={editingShot}
          isNew={!editingShot.id}
          onSave={async (updatedShot) => {
            if (!updatedShot.id) {
              if (!projectId) {
                console.error("projectId is required to create a shot");
                return;
              }
              const result = await createShot(
                projectId,
                updatedShot.storyPageId,
                updatedShot,
              );
              if (result) {
                setShots((prev) => [...prev, result]);
              }
            } else {
              const result = await updateShot(updatedShot.id, updatedShot);
              if (result) {
                setShots((prev) =>
                  prev.map((s) => (s.id === result.id ? result : s)),
                );
              }
            }
            setEditingShot(null);
          }}
          onClose={() => setEditingShot(null)}
        />
      )}

      {textToVideoShot && (
        <TextToVideoDialog
          shot={textToVideoShot.shot}
          keyframes={textToVideoShot.keyframes}
          open={true}
          onClose={() => setTextToVideoShot(null)}
        />
      )}
    </div>
  );
}
