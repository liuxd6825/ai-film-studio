# 🔍 电影环境叙事与材质细节库 (Environmental Storytelling & Material Details)

本文件定义了电影美术中用于“不着一字，尽显风流”（Show, Don't Tell）的环境叙事法则。在编写 AI 场景提示词时，必须大量调用本文件中的材质磨损（Weathering）与叙事道具（Narrative Props）关键词，赋予空间极强的真实感与历史厚重感。

## 一、 岁月痕迹与材质风化 (Weathering & Aging Textures)
没有一个真实的电影场景是完美无瑕的。使用这些词汇打破 AI 生成的“塑料感”。

### 1. 潮湿与水渍 (Moisture & Water Damage)
- **适用场景**：赛博朋克、惊悚悬疑、底层贫民窟、废弃设施。
- **视觉暗示**：阴冷、腐败、抑郁、被时间侵蚀。
- **AI 提示词**：`water stains on the ceiling, peeling damp wallpaper, wet floor with neon reflections, leaky rusted pipes, condensation on the glass, damp moss growing in corners, black mold`

### 2. 灰尘与遗忘 (Dust & Neglect)
- **适用场景**：废土、古墓、被遗弃的豪宅、回忆场景。
- **视觉暗示**：时间静止、死亡、封存的秘密。
- **AI 提示词**：`thick layer of dust covering the furniture, intricate cobwebs, overgrown ivy breaking through the window, sunbeams revealing suspended dust particles, untouched for decades`

### 3. 氧化与剥落 (Oxidation & Decay)
- **适用场景**：重工业科幻、后末日、衰败的城市。
- **视觉暗示**：曾经的辉煌不再、危险、工业粗粝感。
- **AI 提示词**：`heavily rusted metal surfaces, chipped and flaking paint, oxidized copper green patina, corroded iron beams, scuffed concrete, weathered and worn textures`

### 4. 日常使用痕迹 (Wear & Tear)
- **适用场景**：主角的日常居所、老酒馆、警局办公室。
- **视觉暗示**：生活气息、真实感、角色的经济状况。
- **AI 提示词**：`scuffed hardwood floors, frayed carpet edges, worn-out leather armchair with cracks, grease stains on the workbench, scratched wooden desk, overflowing ashtray`

## 二、 隐喻道具与生命痕迹 (Narrative Props & Traces of Life)
通过散落的物品，暗示在镜头推入前，这里刚刚发生了什么，或者居住者是个什么样的人。

### 1. 匆忙的逃离 (Hasty Departure)
- **叙事目标**：制造紧张感，暗示角色刚刚离开或被抓走。
- **AI 提示词**：`an overturned wooden chair, a still-smoking cigarette in the ashtray, spilled coffee dripping from the desk, scattered documents on the floor, a half-eaten meal, an open door in the background`

### 2. 偏执与疯狂 (Obsession & Madness)
- **叙事目标**：展现连环杀手、疯狂科学家或绝望侦探的内心世界。
- **AI 提示词**：`wall completely covered in newspaper clippings connected by red string, frantic manic scribbles on the whiteboard, mountains of empty energy drink cans, flickering CRT monitors stacked on top of each other`

### 3. 隐藏的暴力 (Hidden Violence)
- **叙事目标**：无需尸体，只需展现暴力的余波。
- **AI 提示词**：`dried blood splatters on the pristine white tiles, a single bullet hole in the shattered mirror, broken glass crunching on the floor, makeshift barricade against the door, torn curtains`

### 4. 昔日荣光与没落 (Faded Glory)
- **叙事目标**：展现一个没落贵族、过气明星或崩溃帝国的悲凉。
- **AI 提示词**：`tarnished silver trophies covered in dust, a slashed aristocratic oil painting, a grand crystal chandelier fallen and shattered on the floor, faded velvet curtains, crumbling marble statues`

## 三、 空间介质与光线交互 (Atmospherics & Light Interaction)
高级的场景图不只是画“物体”，更是画“物体之间的空气”。

### 1. 浓郁的空气介质 (Thick Atmospherics)
- **作用**：增加空间的纵深感（Depth），让画面拥有史诗级的电影质感。
- **AI 提示词**：`thick cinematic smoke, volumetric fog rolling on the floor, dense morning mist, hazy atmosphere, floating dust motes illuminated by god rays`

### 2. 戏剧性光影切割 (Dramatic Light Blocking)
- **作用**：利用场景结构对光线进行切割，制造悬疑感。
- **AI 提示词**：`harsh light bleeding through Venetian blinds casting striped shadows, Chiaroscuro lighting, flickering fluorescent tube, a single shaft of light piercing the darkness, glowing neon sign reflecting in a puddle`

## 四、 顶级实战 Prompt 组装范例 (Masterclass Prompt Assembly)

当你要生成一张“落魄侦探的办公室”时，不要只写 "A detective's office"。请结合上述法则这样组装：

> **[Medium]**: Cinematic concept art, wide shot.
> **[Architecture/Style]**: 1940s Film Noir detective office, Art Deco interior.
> **[Weathering]**: Peeling damp wallpaper, scuffed hardwood floors, heavily water-stained ceiling.
> **[Narrative Props]**: An overturned chair, overflowing ashtray with a still-smoking cigarette, scattered classified files on the desk, half-empty bottle of cheap whiskey.
> **[Atmosphere & Lighting]**: Harsh street light bleeding through Venetian blinds casting striped shadows on the wall, thick cinematic smoke, floating dust motes.
> **[Parameters]**: --ar 16:9 --style raw --v 6.0