package main

import (
	"context"
	"flag"
	"fmt"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/infrastructure/agent"
	"open-film-service/internal/service/ai_llm"
	"open-film-service/internal/service/ai_video"
	"os"
	"path/filepath"

	einoModel "github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"open-film-service/internal/config"
	"open-film-service/internal/handler"
	"open-film-service/internal/logging"
	"open-film-service/internal/middleware"
	appModel "open-film-service/internal/model"
	"open-film-service/internal/pkg/password"
	"open-film-service/internal/repository"
	agentSvcPkg "open-film-service/internal/service/agent"
	canvasSvc "open-film-service/internal/service/canvas"
	"open-film-service/internal/service/chat"
	"open-film-service/internal/service/comfy"
	"open-film-service/internal/service/document"
	"open-film-service/internal/service/file"
	"open-film-service/internal/service/folder"
	"open-film-service/internal/service/keys"
	"open-film-service/internal/service/media"
	"open-film-service/internal/service/memory"
	"open-film-service/internal/service/models"
	"open-film-service/internal/service/org"
	"open-film-service/internal/service/project"
	"open-film-service/internal/service/skill"
	"open-film-service/internal/service/style"
	"open-film-service/internal/service/video"

	promptSvc "open-film-service/internal/service"
	"open-film-service/internal/service/ai_image"
	aimodelSvc "open-film-service/internal/service/ai_model"
	canvasFileSvc "open-film-service/internal/service/canvas_file"
	canvasTaskSvc "open-film-service/internal/service/canvas_task"
	characterSvc "open-film-service/internal/service/character"
	dictionarySvc "open-film-service/internal/service/dictionary"
	imageSessionSvc "open-film-service/internal/service/image_session"
	propSvc "open-film-service/internal/service/prop"
	sceneSvc "open-film-service/internal/service/scene"
	shotSvc "open-film-service/internal/service/shot"
	keyframeSvc "open-film-service/internal/service/shot_keyframe"
	storyPageSvc "open-film-service/internal/service/story_page"
	storyboardSvc "open-film-service/internal/service/storyboard"
	visualImageSvc "open-film-service/internal/service/visual_image"
)

func main() {
	configPath := flag.String("config", "configs/config.json", "path to config file")
	logLevel := flag.String("log-level", "info", "log level: debug, info, warn, error")
	logDir := flag.String("log-dir", "./logs", "log directory")
	flag.Parse()

	logging.Init(logging.Config{
		Dir:   *logDir,
		Level: *logLevel,
	})

	if *configPath != "" {
		os.Setenv("CONFIG_PATH", *configPath)
	}

	cfg, err := config.Load()
	if err != nil {
		logging.Error("Failed to load config: ", err)
		os.Exit(1)
	}

	logging.Info("Config loaded from: ", os.Getenv("CONFIG_PATH"))
	logging.Info("Connecting to database at: ", cfg.DB.DSN)

	db, err := gorm.Open(postgres.Open(cfg.DB.DSN), &gorm.Config{})
	if err != nil {
		logging.Fatal("failed to connect to database: ", err)
	}

	if err := appModel.AutoMigrate(db); err != nil {
		logging.Fatal("failed to migrate database: ", err)
	}

	orgRepo := repository.NewOrgRepository(db)
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	styleRepo := repository.NewStyleRepository(db)
	folderRepo := repository.NewFolderRepository(db)
	documentRepo := repository.NewDocumentRepository(db)
	apiKeyRepo := repository.NewAPIKeyRepository(db)
	modelCfgRepo := repository.NewModelCfgRepository(db)
	agentRepo := repository.NewAgentRepository(db)
	skillRepo := repository.NewSkillRepository(db)
	memoryRepo := repository.NewMemoryRepository(db)
	chatSessionRepo := repository.NewChatSessionRepository(db)
	chatMessageRepo := repository.NewChatMessageRepository(db)
	comfyWorkflowRepo := repository.NewComfyWorkflowRepository(db)
	mediaTaskRepo := repository.NewMediaTaskRepository(db)
	videoTaskRepo := repository.NewVideoTaskRepository(db)

	dictionaryRepo := repository.NewDictionaryRepository(db)
	characterRepo := repository.NewCharacterRepository(db)
	scenesRepo := repository.NewSceneRepository(db)
	propRepo := repository.NewPropRepository(db)
	visualImageRepo := repository.NewVisualImageRepository(db)
	imageSessionRepo := repository.NewImageSessionRepository(db)
	canvasFileRepo := repository.NewCanvasFileRepository(db)
	canvasTaskRepo := repository.NewCanvasTaskRepository(db)
	canvasTaskResultRepo := repository.NewCanvasTaskResultRepository(db)
	boardRepo := repository.NewBoardRepository(db)
	storyPageRepo := repository.NewStoryPageRepository(db)
	shotRepo := repository.NewShotRepository(db)
	shotKeyframeRepo := repository.NewShotKeyframeRepository(db)
	promptRepo := repository.NewPromptRepository(db)

	if err := initDefaultUser(db, orgRepo, userRepo); err != nil {
		logging.Fatal("failed to initialize default user: ", err)
	}

	orgSvc := org.NewService(orgRepo)
	authHandler := handler.NewAuthHandler(userRepo)
	projectSvc := project.NewService(projectRepo)
	folderSvc := folder.NewService(folderRepo)
	fileRepo := repository.NewFileRepository(db)
	fileSvc := file.NewService(fileRepo, projectSvc)
	keysSvc := keys.NewService(apiKeyRepo)
	modelsSvc := models.NewService(modelCfgRepo)
	skillSvc := skill.NewService(skillRepo)

	chatSessionSvc := chat.NewChatSessionService(chatSessionRepo, chatMessageRepo, cfg.MasterAgentPath)
	chatSvc := chat.NewChatService(chatMessageRepo)

	mediaSvc := media.NewService(mediaTaskRepo)
	videoSvc := video.NewService(videoTaskRepo)
	comfySvc := comfy.NewService(comfyWorkflowRepo)

	skillLoader := initSkillLoader()
	skillEngine := initSkillEngine(skillLoader)
	agentExecutor := agentSvcPkg.NewExecutor(agentRepo, modelCfgRepo, skillLoader, skillEngine)

	agentMasterCfg, err := agent.LoadMasterConfig(cfg.MasterAgentPath)
	if err != nil {
		logging.Error("failed to load master agent config: ", err)
	}
	agentConfigs, err := agent.LoadAgentConfigs(filepath.Dir(cfg.MasterAgentPath))
	if err != nil {
		logging.Error("failed to load agent configs: ", err)
	}

	var agentRunner *agent.AgentRunner
	charSvcForAgent := characterSvc.NewService(characterRepo, visualImageRepo)
	sceneSvcForAgent := sceneSvc.NewService(scenesRepo, visualImageRepo)
	propSvcForAgent := propSvc.NewService(propRepo, visualImageRepo)
	if agentMasterCfg != nil && agentConfigs != nil {
		agentsDir := filepath.Dir(cfg.MasterAgentPath)
		agentRegistry := agent.NewAgentRegistry(agentConfigs, agentMasterCfg.DefaultAgent, agentsDir, skillLoader, fileSvc, folderSvc, charSvcForAgent, sceneSvcForAgent, propSvcForAgent)
		agentRunner = agent.NewAgentRunner(agentRegistry, cfg)
		logging.Info("AgentRunner initialized with default agent: ", agentMasterCfg.DefaultAgent)
	}

	orgHandler := handler.NewOrgHandler(orgSvc)
	projectHandler := handler.NewProjectHandler(projectSvc)
	canvasRepo := repository.NewCanvasRepository(db)
	canvasService := canvasSvc.NewService(canvasRepo)
	canvasHandler := handler.NewCanvasHandler(canvasService)
	styleSvc := style.NewService(styleRepo)
	if err := styleSvc.SeedDefaults(); err != nil {
		logging.Fatal("failed to seed default styles: ", err)
	}
	styleHandler := handler.NewStyleHandler(styleSvc)
	folderSvc = folder.NewService(folderRepo)
	folderHandler := handler.NewFolderHandler(folderSvc)
	documentSvc := document.NewService(documentRepo)
	documentHandler := handler.NewDocumentHandler(documentSvc)
	fileRepo = repository.NewFileRepository(db)
	fileSvc = file.NewService(fileRepo, projectSvc)
	fileAPIHandler := handler.NewFileAPIHandler(fileSvc)
	keysHandler := handler.NewKeysHandler(keysSvc)
	modelsHandler := handler.NewModelsHandler(modelsSvc)
	chatMessageHandler := handler.NewChatMessageHandler(chatSessionSvc, chatSvc, agentRunner)
	chatStreamHandler := handler.NewChatStreamHandler(chatSvc, agentRunner)
	chatSessionHandler := handler.NewChatSessionHandler(chatSessionSvc)
	if agentRunner == nil {
		logging.Warn("AgentRunner is nil, agent endpoints will not be available")
	}
	agentHandler := handler.NewAgentHandler(agentRunner)
	skillHandler := handler.NewSkillHandler(skillSvc)
	memoryHandler := handler.NewMemoryHandler(memory.NewService(memoryRepo))
	mediaHandler := handler.NewMediaHandler(mediaSvc)
	videoHandler := handler.NewVideoHandler(videoSvc)
	comfyHandler := handler.NewComfyHandler(comfySvc)
	systemSkillHandler := handler.NewSystemSkillHandler(skillLoader, agentExecutor)

	dictionaryService := dictionarySvc.NewService(dictionaryRepo)
	characterService := characterSvc.NewService(characterRepo, visualImageRepo)
	scenesService := sceneSvc.NewService(scenesRepo, visualImageRepo)
	propService := propSvc.NewService(propRepo, visualImageRepo)
	visualImageService := visualImageSvc.NewService(visualImageRepo)
	imageSessionService := imageSessionSvc.NewService(imageSessionRepo)
	boardService := storyboardSvc.NewBoardService(boardRepo)
	storyPageService := storyPageSvc.NewService(storyPageRepo)
	shotService := shotSvc.NewService(shotRepo, agentRunner)
	keyframeService := keyframeSvc.NewService(shotKeyframeRepo, shotRepo, agentRunner)
	promptService := promptSvc.NewPromptService(promptRepo)
	promptAdminService := promptSvc.NewPromptAdminService(promptRepo)

	dictionaryHandler := handler.NewDictionaryHandler(dictionaryService)
	characterHandler := handler.NewCharacterHandler(characterService)
	sceneHandler := handler.NewSceneHandler(scenesService)
	propHandler := handler.NewPropHandler(propService)
	visualImageHandler := handler.NewVisualImageHandler(visualImageService)
	imageSessionHandler := handler.NewImageSessionHandler(imageSessionService)
	boardHandler := handler.NewBoardHandler(boardService, storyPageService)
	storyPageHandler := handler.NewStoryPageHandler(storyPageService)
	shotHandler := handler.NewShotHandler(shotService)
	keyframeHandler := handler.NewKeyframeHandler(keyframeService)
	promptHandler := handler.NewPromptHandler(promptService)
	promptAdminHandler := handler.NewPromptAdminHandler(promptAdminService)
	categoryHandler := handler.NewCategoryHandler()

	aimodelService := aimodelSvc.NewService()
	aimodelHandler := handler.NewAIModelHandler(aimodelService)

	canvasFileService := canvasFileSvc.NewService(canvasFileRepo)
	canvasFileHandler := handler.NewCanvasFileHandler(canvasFileService)

	aiLLMService := ai.NewAiLLMService(&cfg.TextModels)
	aiImageService := ai.NewAiImageService(&cfg.ImageModels)
	aiVideoService := ai.NewAiVideoService(&cfg.VideoModels)

	canvasTaskService := canvasTaskSvc.NewService(canvasTaskRepo, canvasTaskResultRepo, aiImageService, aiVideoService)
	canvasTaskHandler := handler.NewCanvasTaskHandler(canvasTaskService, aiVideoService, aiImageService, canvasTaskResultRepo)

	llmService := ai_llm.NewService(cfg, aiLLMService)
	llmHandler := handler.NewAILLMHandler(llmService)

	videoService := ai_video.NewService(cfg, aiVideoService)
	videoGenHandler := handler.NewAIVideoHandler(videoService, canvasTaskService)

	imageService := ai_image.NewService(cfg, aiImageService, canvasTaskRepo)
	imageHandler := handler.NewImageHandler(imageService, canvasTaskService)

	migrateCanvasFiles(canvasFileService)

	h := handler.NewHandler(
		cfg,
		llmHandler,
		authHandler,
		orgHandler,
		projectHandler,
		canvasHandler,
		styleHandler,
		folderHandler,
		documentHandler,
		fileAPIHandler,
		keysHandler,
		modelsHandler,
		chatMessageHandler,
		chatStreamHandler,
		chatSessionHandler,
		agentHandler,
		skillHandler,
		memoryHandler,
		mediaHandler,

		videoHandler,
		comfyHandler,
		dictionaryHandler,
		characterHandler,
		sceneHandler,
		propHandler,
		visualImageHandler,
		imageSessionHandler,
		boardHandler,
		storyPageHandler,
		shotHandler,
		keyframeHandler,
		promptHandler,
		promptAdminHandler,
		categoryHandler,
		imageHandler,
		aimodelHandler,
		videoGenHandler,
		canvasFileHandler,
		canvasTaskHandler,
	)

	app := iris.New()

	app.Use(middleware.Logger())

	app = handler.NewRouter(h)

	registerSystemSkillRoutes(app, systemSkillHandler)

	app.Listen(cfg.ServerAddr)
}

type skillModelAdapter struct {
	inner einoModel.BaseChatModel
}

func (a *skillModelAdapter) Generate(ctx context.Context, messages []*skill.Message) (string, error) {
	einoMsgs := make([]*schema.Message, len(messages))
	for i, m := range messages {
		einoMsgs[i] = &schema.Message{
			Role:    schema.RoleType(m.Role),
			Content: m.Content,
		}
	}
	resp, err := a.inner.Generate(ctx, einoMsgs)
	if err != nil {
		return "", err
	}
	return resp.Content, nil
}

func (a *skillModelAdapter) Stream(ctx context.Context, messages []*skill.Message) (<-chan string, error) {
	einoMsgs := make([]*schema.Message, len(messages))
	for i, m := range messages {
		einoMsgs[i] = &schema.Message{
			Role:    schema.RoleType(m.Role),
			Content: m.Content,
		}
	}
	stream, err := a.inner.Stream(ctx, einoMsgs)
	if err != nil {
		return nil, err
	}
	ch := make(chan string, 1)
	go func() {
		defer close(ch)
		for {
			msg, err := stream.Recv()
			if err != nil {
				break
			}
			if msg.Content != "" {
				ch <- msg.Content
			}
		}
	}()
	return ch, nil
}

func initSkillEngine(skillLoader *skill.Loader) *skill.Engine {
	wrapped := &skillModelAdapter{}
	engine := skill.NewEngine(wrapped)

	if skillLoader != nil {
		skillLoader.RegisterInEngine(engine)
	}

	return engine
}

func initSkillLoader() *skill.Loader {

	dir, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	fmt.Println("应用执行目录:", dir)
	loader := skill.NewLoader(dir + "/configs")
	if err := loader.LoadAll(); err != nil {
		logging.Warn("failed to load skills from ", "./configs", ": ", err)
	} else {
		logging.Info("Loaded ", len(loader.ListSkills()), " skills from ", "./configs")
	}

	return loader
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func registerSystemSkillRoutes(app *iris.Application, h *handler.SystemSkillHandler) {
	api := app.Party("/api/v1")
	{
		api.Get("/skills", h.ListSkills)
		api.Get("/skills/:name", h.GetSkill)
		api.Post("/skills/execute", h.ExecuteSkill)
		api.Post("/agents/:agent_id/execute", h.ExecuteAgent)
		api.Get("/agents/:agent_id/config", h.GetAgentConfig)
	}
}

func migrateCanvasFiles(svc *canvasFileSvc.Service) {
	logging.Info("[Migration] Canvas file migration started")

	files, err := svc.ListAllFiles()
	if err != nil {
		logging.Error("[Migration] Failed to list files: ", err)
		return
	}

	var migrated, skipped, failed int
	for _, file := range files {
		oldPath := filepath.Join("storage", "projects", file.ProjectID, "canvas", "files", file.ID+"_"+file.Name)
		newPath := filepath.Join("storage", "projects", file.ProjectID, "canvas", file.CanvasID, "files", file.ID+"_"+file.Name)

		if file.FilePath == oldPath && file.CanvasID != "" {
			if _, err := os.Stat(newPath); os.IsNotExist(err) {
				newDir := filepath.Dir(newPath)
				if err := os.MkdirAll(newDir, 0755); err != nil {
					logging.Error("[Migration] Failed to create directory for file ", file.ID, ": ", err)
					failed++
					continue
				}
				if err := os.Rename(oldPath, newPath); err != nil {
					logging.Error("[Migration] Failed to move file ", file.ID, ": ", err)
					failed++
					continue
				}
				if err := svc.MigrateFilePath(file.ID, newPath); err != nil {
					logging.Error("[Migration] Failed to update DB for file ", file.ID, ": ", err)
					failed++
					continue
				}
				migrated++
			} else {
				logging.Info("[Migration] File already exists at new path, skipping: ", file.ID)
				skipped++
			}
		} else if file.CanvasID == "" {
			skipped++
		}
	}

	logging.Info("[Migration] Migrated ", migrated, " files")
	logging.Info("[Migration] Skipped ", skipped, " files")
	logging.Info("[Migration] Failed ", failed, " files")
	logging.Info("[Migration] Canvas file migration completed")
}

func initDefaultUser(db *gorm.DB, orgRepo *repository.OrgRepository, userRepo *repository.UserRepository) error {
	var existingUser appModel.User
	err := db.Where("username = ?", "admin").First(&existingUser).Error
	if err == nil {
		logging.Info("Default admin user already exists, skipping initialization")
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}

	var adminOrg *appModel.Org
	adminOrg, err = orgRepo.GetByName("admin")
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			adminOrg = &appModel.Org{
				ID:   uuid.New(),
				Name: "admin",
			}
			if err = orgRepo.Create(adminOrg); err != nil {
				return err
			}
			logging.Info("Created default admin org: ", adminOrg.ID)
		} else {
			return err
		}
	} else {
		logging.Info("Admin org already exists: ", adminOrg.ID)
	}

	hashedPassword, err := password.HashPassword("admin")
	if err != nil {
		return err
	}

	adminUser := &appModel.User{
		ID:           uuid.New(),
		Username:     "admin",
		PasswordHash: hashedPassword,
		OrgID:        adminOrg.ID,
	}

	if err = userRepo.Create(adminUser); err != nil {
		return err
	}

	logging.Info("Created default admin user: ", adminUser.ID, " with org: ", adminUser.OrgID)
	return nil
}
