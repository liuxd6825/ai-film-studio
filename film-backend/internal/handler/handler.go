package handler

import (
	"open-film-service/internal/config"

	"github.com/kataras/iris/v12"
)

type Handler struct {
	cfg            *config.Config
	Auth           *AuthHandler
	Org            *OrgHandler
	Project        *ProjectHandler
	Canvas         *CanvasHandler
	Style          *StyleHandler
	Folder         *FolderHandler
	Document       *DocumentHandler
	FileAPI        *FileAPIHandler
	Keys           *KeysHandler
	Models         *ModelsHandler
	Chat           *ChatMessageHandler
	ChatStream     *ChatStreamHandler
	ChatSession    *ChatSessionHandler
	Agent          *AgentHandler
	Skill          *SkillHandler
	Memory         *MemoryHandler
	Media          *MediaHandler
	Audio          *SimpleAudioHandler
	LLMHandler     *AILLMHandler
	Video          *VideoHandler
	Comfy          *ComfyHandler
	Dictionary     *DictionaryHandler
	Character      *CharacterHandler
	Scene          *SceneHandler
	Prop           *PropHandler
	VisualImage    *VisualImageHandler
	ImageSession   *ImageSessionHandler
	Board          *BoardHandler
	StoryPage      *StoryPageHandler
	Shot           *ShotHandler
	Keyframe       *KeyframeHandler
	Prompt         *PromptHandler
	PromptAdmin   *PromptAdminHandler
	Category       *CategoryHandler
	AIImageHandler *AIImageHandler
	AIModel        *AIModelHandler
	AIAudioHandler *AIAudioHandler
	AIVideoHandler *AIVideoHandler
	CanvasFile     *CanvasFileHandler
	CanvasTask     *CanvasTaskHandler
}

func NewHandler(
	cfg *config.Config,
	aiLLMHandler *AILLMHandler,
	authHandler *AuthHandler,
	orgHandler *OrgHandler,
	projectHandler *ProjectHandler,
	canvasHandler *CanvasHandler,
	styleHandler *StyleHandler,
	folderHandler *FolderHandler,
	documentHandler *DocumentHandler,
	fileAPIHandler *FileAPIHandler,
	keysHandler *KeysHandler,
	modelsHandler *ModelsHandler,
	chatHandler *ChatMessageHandler,
	chatStreamHandler *ChatStreamHandler,
	chatSessionHandler *ChatSessionHandler,
	agentHandler *AgentHandler,
	skillHandler *SkillHandler,
	memoryHandler *MemoryHandler,
	mediaHandler *MediaHandler,
	videoHandler *VideoHandler,
	comfyHandler *ComfyHandler,
	dictionaryHandler *DictionaryHandler,
	characterHandler *CharacterHandler,
	sceneHandler *SceneHandler,
	propHandler *PropHandler,
	visualImageHandler *VisualImageHandler,
	imageSessionHandler *ImageSessionHandler,
	boardHandler *BoardHandler,
	storyPageHandler *StoryPageHandler,
	shotHandler *ShotHandler,
	keyframeHandler *KeyframeHandler,
	promptHandler *PromptHandler,
	promptAdminHandler *PromptAdminHandler,
	categoryHandler *CategoryHandler,
	aiImageHandler *AIImageHandler,
	aiModelHandler *AIModelHandler,
	simpleAudioHandler *SimpleAudioHandler,
	aiAudioHandler *AIAudioHandler,
	aiVideoHandler *AIVideoHandler,
	canvasFileHandler *CanvasFileHandler,
	canvasTaskHandler *CanvasTaskHandler,
) *Handler {
	return &Handler{
		cfg:            cfg,
		LLMHandler:     aiLLMHandler,
		Auth:           authHandler,
		Org:            orgHandler,
		Project:        projectHandler,
		Canvas:         canvasHandler,
		Style:          styleHandler,
		Folder:         folderHandler,
		Document:       documentHandler,
		FileAPI:        fileAPIHandler,
		Keys:           keysHandler,
		Models:         modelsHandler,
		Chat:           chatHandler,
		ChatStream:     chatStreamHandler,
		ChatSession:    chatSessionHandler,
		Agent:          agentHandler,
		Skill:          skillHandler,
		Memory:         memoryHandler,
		Media:          mediaHandler,
		Video:          videoHandler,
		Comfy:          comfyHandler,
		Dictionary:     dictionaryHandler,
		Character:      characterHandler,
		Scene:          sceneHandler,
		Prop:           propHandler,
		VisualImage:    visualImageHandler,
		ImageSession:   imageSessionHandler,
		Board:          boardHandler,
		StoryPage:      storyPageHandler,
		Shot:           shotHandler,
		Keyframe:       keyframeHandler,
		Prompt:         promptHandler,
		PromptAdmin:   promptAdminHandler,
		Category:       categoryHandler,
		AIImageHandler: aiImageHandler,
		AIModel:        aiModelHandler,
		Audio:          simpleAudioHandler,
		AIAudioHandler: aiAudioHandler,
		AIVideoHandler: aiVideoHandler,
		CanvasFile:     canvasFileHandler,
		CanvasTask:     canvasTaskHandler,
	}
}

func (h *Handler) Health(ctx iris.Context) {
	ctx.JSON(iris.Map{"status": "ok"})
}
