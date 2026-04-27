import { useState, useEffect, useMemo } from "react";
import { api } from "@/api/client";
import { Project, Tag, Style, SortState } from "./types";
import { TagSidebar } from "./components/TagSidebar";
import { Toolbar } from "./components/Toolbar";
import { ProjectGrid } from "./components/ProjectGrid";
import { TagSelector } from "./components/TagSelector";
import { ProjectSettings } from "./components/ProjectSettings";
import { X } from "lucide-react";

export function ProjectDashboard({
  orgId,
  onSelectProject,
}: {
  orgId: string;
  onSelectProject: (projectId: string, projectName: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    field: "updated_at",
    direction: "desc",
  });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );

  const [tagSelectorProject, setTagSelectorProject] = useState<string | null>(
    null,
  );
  const [settingsProject, setSettingsProject] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get<Project[]>(`/api/v1/orgs/${orgId}/projects`);
      const projectsWithTags = res.map((p: any) => ({
        ...p,
        tags: p.tags || [],
      }));
      setProjects(projectsWithTags);
      updateTags(projectsWithTags);
    } catch (e) {
      setError("获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchStyles = async () => {
    try {
      const res = await api.get<Style[]>("/api/v1/styles");
      setStyles(res);
    } catch (e) {
      console.error("Failed to fetch styles");
    }
  };

  const updateTags = (projectList: Project[]) => {
    const tagMap = new Map<string, number>();
    projectList.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    const tagList: Tag[] = Array.from(tagMap.entries()).map(
      ([name, count], index) => ({
        id: String(index),
        name,
        project_count: count,
      }),
    );
    setTags(tagList);
  };

  useEffect(() => {
    fetchProjects();
    fetchStyles();
  }, [orgId]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (selectedTag) {
      result = result.filter((p) => (p.tags || []).includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const keywords = query.split(/\s+/);
      result = result.filter((p) => {
        const searchable = [p.name, p.description || "", ...(p.tags || [])]
          .join(" ")
          .toLowerCase();
        return keywords.every((kw) => searchable.includes(kw));
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortState.field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created_at":
          comparison = a.created_at - b.created_at;
          break;
        case "updated_at":
          comparison = a.updated_at - b.updated_at;
          break;
        case "tag_count":
          comparison = (a.tags?.length || 0) - (b.tags?.length || 0);
          break;
      }
      return sortState.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [projects, selectedTag, searchQuery, sortState]);

  const handleCreateProject = async (name: string, description: string) => {
    try {
      await api.post(`/api/v1/orgs/${orgId}/projects`, {
        name,
        description,
        tags: [],
      });
      fetchProjects();
    } catch (e) {
      setError("创建项目失败");
    }
  };

  const handleDeleteProjects = async () => {
    if (selectedProjects.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedProjects).map((id) =>
          api.delete(`/api/v1/orgs/${orgId}/projects/${id}`),
        ),
      );
      setSelectedProjects(new Set());
      setDeleteMode(false);
      fetchProjects();
    } catch (e) {
      setError("删除项目失败");
    }
  };

  const handleToggleProjectTag = (
    projectId: string,
    tagName: string,
    isAdding: boolean,
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newTags = isAdding
          ? [...(p.tags || []), tagName]
          : (p.tags || []).filter((t) => t !== tagName);
        return { ...p, tags: newTags };
      }),
    );
    updateTags(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tags: isAdding
                ? [...(p.tags || []), tagName]
                : (p.tags || []).filter((t) => t !== tagName),
            }
          : p,
      ),
    );
  };

  const handleCreateTag = (tagName: string) => {
    if (tagSelectorProject) {
      handleToggleProjectTag(tagSelectorProject, tagName, true);
    }
    setTagSelectorProject(null);
  };

  const handleToggleSelect = (projectId: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSaveProject = async (
    projectId: string,
    data: {
      name: string;
      description: string;
      status: number;
      duration: string;
      style: string;
      tags: string[];
    },
  ) => {
    try {
      await api.put(`/api/v1/projects/${projectId}`, data);
      setSettingsProject(null);
      fetchProjects();
    } catch (e) {
      setError("保存项目失败");
    }
  };

  const selectedProjectForSettings = settingsProject
    ? projects.find((p) => p.id === settingsProject)
    : null;

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">我的项目</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <TagSidebar
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          totalProjects={projects.length}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateProject={handleCreateProject}
            deleteMode={deleteMode}
            onToggleDeleteMode={() => {
              setDeleteMode(!deleteMode);
              setSelectedProjects(new Set());
            }}
            selectedCount={selectedProjects.size}
            onDeleteSelected={handleDeleteProjects}
            sortState={sortState}
            onSortChange={setSortState}
          />

          <div className="flex-1 overflow-auto p-6">
            <ProjectGrid
              projects={filteredProjects}
              deleteMode={deleteMode}
              selectedProjects={selectedProjects}
              onToggleSelect={handleToggleSelect}
              onSelectProject={(id) => {
                const project = projects.find((p) => p.id === id);
                onSelectProject(id, project?.name || "");
              }}
              onTagClick={(projectId) => setTagSelectorProject(projectId)}
              onSettingsClick={(projectId) => setSettingsProject(projectId)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg flex items-center gap-2">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {tagSelectorProject && (
        <TagSelector
          projectId={tagSelectorProject}
          currentTags={
            projects.find((p) => p.id === tagSelectorProject)?.tags || []
          }
          allTags={tags.map((t) => t.name)}
          onToggle={(tagName, isAdding) =>
            handleToggleProjectTag(tagSelectorProject, tagName, isAdding)
          }
          onCreateTag={handleCreateTag}
          onClose={() => setTagSelectorProject(null)}
        />
      )}

      {selectedProjectForSettings && (
        <ProjectSettings
          project={selectedProjectForSettings}
          styles={styles}
          onSave={(data) =>
            handleSaveProject(selectedProjectForSettings.id, data)
          }
          onClose={() => setSettingsProject(null)}
        />
      )}
    </div>
  );
}
