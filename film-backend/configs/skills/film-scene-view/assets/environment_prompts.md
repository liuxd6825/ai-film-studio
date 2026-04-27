
# 🎨 电影级场景概念图 AI 提示词模板库 (Environment Concept Art Prompts)

本文件包含了用于生成高规格电影场景设定图（Environment Concept Art）、建置镜头（Establishing Shot）和环境细节特写（Macro Set Dressing）的结构化提示词模板。在生成提示词时，请 Agent 严格套用以下公式，并将剧本提炼出的建筑风格、环境叙事与光影词汇填入其中。

## 一、 场景构建核心公式 (The Environment Formula)
在 Midjourney V6 中，生成无人物或以环境为主的顶级概念图，必须遵循从“宏观空间”到“微观材质”，再到“空气光影”的逻辑顺序：
> `[Medium/Format] of[Main Architecture/Space], [Key Props & Set Dressing], [Textural & Weathering Details],[Atmospherics/Weather], [Lighting Direction], [Camera/Lens for Landscape], [Cinematic Style/Color Grading] [Parameters]`

---

## 二、 三大实战场景模板 (Production-Ready Templates)

### 1. 史诗级大远景 / 建置镜头 (Epic Establishing Shot)
**用途**：用于交代庞大的世界观、城市风貌、巨大的自然地貌或巨构建筑。极度强调空间感与比例尺（Scale）。
**模板**：
```prompt
Cinematic establishing shot, wide angle landscape photography,[调用architectural_styles.md中的建筑流派, 如: massive Brutalist concrete megastructures],[宏观环境细节, 如: endless neon-drenched slums below], [天气与空气介质, 如: heavy rain, rolling volumetric fog], [环境大光影, 如: illuminated by giant holographic billboards and lightning], tiny human silhouettes for scale, shot on 14mm ultra-wide lens, majestic and oppressive scale, directed by [导演或美术指导风格] --ar 2.39:1 --style raw --v 6.0
```
*示例：Cinematic establishing shot, wide angle landscape photography, massive Brutalist concrete megastructures, endless neon-drenched slums below, heavy rain, rolling volumetric fog, illuminated by giant holographic billboards and lightning, tiny human silhouettes for scale, shot on 14mm ultra-wide lens, majestic and oppressive scale, directed by Denis Villeneuve --ar 2.39:1 --style raw --v 6.0*

### 2. 沉浸式室内空间 / 房间概念图 (Intimate Interior Space)
**用途**：用于展现特定角色的私人空间或关键剧情发生地。极度强调环境叙事（Environmental Storytelling）和岁月痕迹。
**模板**：
```prompt
Cinematic concept art of an interior space, [描述空间属性, 如: an abandoned 1940s detective office],[调用architectural_styles.md中的室内风格],[调用environmental_storytelling.md中的叙事道具, 如: overturned chair, scattered classified files],[调用风化细节, 如: peeling damp wallpaper, heavily water-stained ceiling], [室内光影, 如: harsh street light bleeding through Venetian blinds, Chiaroscuro lighting], floating dust motes, shot on 35mm lens, gritty realism, deep focus --ar 16:9 --style raw --v 6.0
```
*示例：Cinematic concept art of an interior space, an abandoned 1940s detective office, Art Deco interior, overturned chair, scattered classified files, peeling damp wallpaper, heavily water-stained ceiling, harsh street light bleeding through Venetian blinds, Chiaroscuro lighting, floating dust motes, shot on 35mm lens, gritty realism, deep focus --ar 16:9 --style raw --v 6.0*

### 3. 微观细节 / 材质与叙事道具特写 (Macro Set Dressing & Props)
**用途**：用于生成线索道具、特殊材质或极具情绪感染力的局部特写（Insert Shot）。
**模板**：
```prompt
Extreme close-up macro photography of[核心道具, 如: a severely rusted cyberpunk terminal keyboard],[调用environmental_storytelling.md中的做旧细节, 如: covered in thick dust, dried blood splatters on the keys, chipped and flaking paint], resting on[背景承托物, 如: a scuffed metal workbench], [局部光影, 如: illuminated by a flickering single neon tube], shallow depth of field, extreme background bokeh, f/1.4 aperture, photorealistic textures, Unreal Engine 5 render style --ar 16:9 --style raw --v 6.0
```

---

## 三、 场景美术级渲染与质感强化词 (Render & Texture Enhancers)

为了让 Midjourney 彻底摒弃“网图感”，呈现出 3A 游戏或好莱坞数字绘景（Matte Painting）的极高规格，请在提示词末尾的 `[Cinematic Style]` 区域按需添加以下“魔法咒语”：

- **数字绘景质感**：`matte painting, conceptual environment art, ArtStation trending, intricate environmental details` (适合奇幻、科幻宏大场景)
- **极度写实建筑摄影**：`architectural photography, photogrammetry scanning, hyper-realistic textures, National Geographic style` (适合废墟探险、现代或纪实场景)
- **顶级渲染引擎质感**：`Unreal Engine 5 render, Octane Render, ray tracing, global illumination, path tracing` (能极大提升光线在复杂场景中的反弹和真实感)

## 四、 必备场景构建参数 (Environment Parameters)

1. **画面宽高比 (`--ar`)**:
   - 场景概念图极少使用竖屏。强制使用 `--ar 16:9`（标准宽屏） 或 `--ar 2.39:1`（电影变形宽银幕，最能展现宏大空间）。
2. **负面提示词 (`--no`)**:
   - 如果你需要一个绝对无人的空镜，请务必添加：`--no people, humans, characters, animals`。
   - 如果你想避免 AI 生成乱码文字（尤其是在赛博朋克或现代城市中），请添加：`--no text, letters, watermark, signature`。
3. **风格化参考 (`--sref`)**:
   - 场景美术极度依赖“色调”。提醒用户，如果他们有喜欢的电影截图，可以在提示词末尾加上 `--sref [截图URL]`，Midjourney 会完美复制该图的色彩分级（Color Grading）和光照质感到新场景中。
