export type UUID = string;

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description: string;
  sortOrder: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export enum SceneType {
  Interior = "内景",
  Exterior = "外景",
  Mixed = "混合",
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  type: SceneType;
}

export enum StoryPageState {
  Draft = "草稿",
  InProgress = "进行中",
  Completed = "已完成",
}

export enum StoryPageTime {
  Day = "日",
  Night = "夜",
  Dawn = "黎明",
  Dusk = "黄昏",
  Morning = "晨",
  Noon = "午",
  Midnight = "午夜",
  EarlyMorning = "凌晨",
}

export enum StoryPageWeather {
  Sunny = "晴",
  Rainy = "雨",
  Snowy = "雪",
  Foggy = "雾",
  Windy = "风",
  Cloudy = "阴",
  Thunderstorm = "雷暴",
  PartlyCloudy = "多云",
}

export interface StoryPage {
  id: string;
  boardId: string;
  title: string;
  desc: string;
  sortOrder: number;
  status: number;
  storyTime: string;
  weather: string;
  createdAt: string;
  updatedAt: string;
}

export enum ShotState {
  Draft = "草稿",
  Approved = "已批准",
  Revised = "已修订",
}

export interface Shot {
  id: string;
  storyPageId: string;
  content: string;
  orderNum: number;
  state: ShotState;
  characterIds: string[];
  sceneIds?: string[];
  propIds?: string[];
  sceneType?: string;
  weather?: string;
  script?: string;
  directorIntent?: string;
  promptId?: string;
  videoUrl?: string;
  duration?: number;
  timeFrame?: string;
  lighting?: string;
  cameraAngleH?: string;
  cameraAngleV?: string;
  narrativePov?: string;
  cameraMovement?: string;
  framing?: string;
  actionEmotion?: string;
  dialogueSound?: string;
  notes?: string;
}

export enum CharacterType {
  Lead = "主演",
  Supporting = "配角",
  Extra = "群众",
  Animal = "动物",
  Other = "其他",
}

export interface Character {
  id: string;
  name: string;
  description: string;
  type: CharacterType;
}

export interface Prop {
  id: string;
  name: string;
  description: string;
}

export enum CameraShotType {
  Wide = "全景",
  Medium = "中景",
  CloseUp = "近景",
  ExtremeCloseUp = "特写",
  OverTheShoulder = "过肩",
  POV = "主观镜头",
}

export enum CameraAngle {
  EyeLevel = "平视",
  HighAngle = "俯拍",
  LowAngle = "仰拍",
  BirdsEye = "鸟瞰",
  WormsEye = "虫视",
}

export enum CameraMovement {
  Static = "固定 (Static)",
  PushIn = "推 (Push In)",
  PullOut = "拉 (Pull Out)",
  PanLeft = "左摇 (Pan Left)",
  PanRight = "右摇 (Pan Right)",
  TiltUp = "上摇 (Tilt Up)",
  TiltDown = "下摇 (Tilt Down)",
  TrackLeft = "左移 (Track Left)",
  TrackRight = "右移 (Track Right)",
  PedestalUp = "上升 (Pedestal Up)",
  PedestalDown = "下降 (Pedestal Down)",
  FollowForward = "前跟 (Follow Forward)",
  FollowBackward = "后跟 (Follow Backward)",
  ArcLeft = "左环绕 (Arc Left)",
  ArcRight = "右环绕 (Arc Right)",
  Handheld = "手持 (Handheld)",
}

export interface Prompt {
  id: string;
  text: string;
  mediaUrls: string[]; // Can be image or video URLs
  createdAt: string;
}

export interface Keyframe {
  id: string;
  shotId: string;
  frameNumber: number;
  imageUrl: string;
  thumbnailUrl: string;
  description: string; // 画面描述 (Screen Description)
  imagePrompt?: string; // 图片提示词
  promptId?: string; // 关联的提示词
  actionDescription: string;
  cameraSettings: any;
  orderNum: number;
  cameraShotType: CameraShotType;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  duration: string;
  soundEffects: string;
}

export interface ShotSuggestion {
  name: string;
  content: string;
  storyTime: string;
  weather: string;
  shotNumber: number;
  keyframes: KeyframeSuggestion[];
}

export interface KeyframeSuggestion {
  frameNumber: number;
  imageDesc: string;
  actionDesc: string;
  dialogue: string;
  cameraType: string;
  cameraSetting: string;
  cameraAngle: string;
  cameraMovement: string;
  duration: string;
  soundDesc: string;
  imagePrompt?: string;
}

export interface AnalyzeResult {
  shots: ShotSuggestion[];
}

export interface ShotSummary {
  sceneNo: string;
  totalShots: number;
  totalDuration: string;
  description: string;
}

export interface ShotItem {
  shotId: string;
  duration: number;
  sceneType: string;
  timeFrame: string;
  weather: string;
  lighting: string;
  shotType: string;
  cameraMovement: string;
  framing: string;
  content: string;
  actionEmotion: string;
  dialogueSound: string;
  notes: string;
}

export interface GenerateResult {
  scriptSegment: string;
  summary: ShotSummary;
  storyboard: ShotItem[];
}
