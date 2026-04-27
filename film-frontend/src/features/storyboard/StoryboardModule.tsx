import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Clapperboard } from "lucide-react";
import { useStoryboardStore } from "./store";
import { MainContent } from "./components/MainContent";
import { StoryPageSelectDialog } from "./components/StoryPageSelectDialog";
import { Button } from "./components/ui";

export default function StoryboardModule() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    fetchBoards,
    setProjectId,
    boards,
    currentBoardId,
    selectedStoryPageId,
    setSelectedStoryPageId,
    showStoryPageSelectDialog,
    openStoryPageSelectDialog,
    closeStoryPageSelectDialog,
  } = useStoryboardStore();

  useEffect(() => {
    console.log("StoryboardModule projectId:", projectId);
    if (projectId) {
      setProjectId(projectId);
      fetchBoards(projectId);
    }
  }, [projectId, fetchBoards, setProjectId]);

  useEffect(() => {
    console.log(
      "boards updated:",
      boards.length,
      "currentBoardId:",
      currentBoardId,
    );
  }, [boards, currentBoardId]);

  const handleSelectStoryPage = (page: { id: string }) => {
    setSelectedStoryPageId(page.id);
    closeStoryPageSelectDialog();
  };

  return (
    <div className="flex h-full w-full bg-zinc-50 dark:bg-zinc-900">
      {selectedStoryPageId ? (
        <MainContent />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clapperboard size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              请选择一个故事页开始编辑
            </p>
            <Button onClick={openStoryPageSelectDialog}>打开</Button>
          </div>
        </div>
      )}

      {projectId && (
        <StoryPageSelectDialog
          isOpen={showStoryPageSelectDialog}
          onClose={closeStoryPageSelectDialog}
          onSelect={handleSelectStoryPage}
          projectId={projectId}
        />
      )}
    </div>
  );
}
