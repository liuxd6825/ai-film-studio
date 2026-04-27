import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSeriesStore } from "./store";
import { SeriesListPanel } from "./components/SeriesListPanel";
import { SeriesEditPanel } from "./components/SeriesEditPanel";

export default function SeriesModule() {
  const { projectId } = useParams<{ projectId: string }>();
  const { setProjectId, fetchAllStoryPages } = useSeriesStore();

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
      fetchAllStoryPages(projectId);
    }
  }, [projectId, setProjectId, fetchAllStoryPages]);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-900">
      <div className="flex-1 flex min-h-0">
        <SeriesListPanel />
        <SeriesEditPanel />
      </div>
    </div>
  );
}
