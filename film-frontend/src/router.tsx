import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { LoginPage, DashboardPage } from "./pages";
import ProjectLayout from "./features/project/ProjectLayout";
import { AssetsModule } from "./features/assets/AssetsModule";
import StoryboardModule from "@/features/storyboard/StoryboardModule";
import { PromptPage } from "./features/prompt/pages/PromptPage";
import SeriesModule from "./features/series/SeriesModule";
import { Canvas } from "./features/canvas";
import { CanvasListPage } from "./features/canvas/pages/CanvasListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "project/:projectId",
        element: <ProjectLayout />,
        children: [
          { index: true, element: <Navigate to="home" replace /> },
          { path: "home", element: <div /> },
          { path: "chat", element: <div>Chat</div> },
          { path: "document", element: <div>Document</div> },
          { path: "canvases", element: <CanvasListPage /> },
          { path: "canvas/:canvasId", element: <Canvas /> },
          { path: "assets", element: <AssetsModule /> },
          { path: "storyboard", element: <StoryboardModule /> },
          { path: "series", element: <SeriesModule /> },
          { path: "prompts", element: <PromptPage /> },
        ],
      },
    ],
  },
]);
