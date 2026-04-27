import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'open-film-service/web/src/features/storyboard/components/MainContent.tsx');
let content = fs.readFileSync(file, 'utf-8');

// 1. Update imports
content = content.replace(
  `import { 
  mockScenes, 
  mockStoryPages, 
  mockShots as initialShots, 
  mockKeyframes as initialKeyframes, 
  mockCharacters,
  mockPrompts,
  mockProps
} from './mockData';`,
  `import { 
  mockScenes, 
  mockCharacters,
  mockPrompts,
  mockProps
} from '../mockData';
import { useStoryboardStore } from '../store';`
);

content = content.replace(
  `import { 
  Scene, 
  StoryPage, 
  Shot, 
  Keyframe, 
  Character,
  Prop,
  Prompt,
  CameraShotType,
  CameraAngle,
  CameraMovement,
  StoryPageState,
  ShotState
} from './types';`,
  `import { 
  Scene, 
  StoryPage, 
  Shot, 
  Keyframe, 
  Character,
  Prop,
  Prompt,
  CameraShotType,
  CameraAngle,
  CameraMovement,
  StoryPageState,
  ShotState
} from '../types';`
);

content = content.replace(
  /import { Badge } from '\.\/components\/ui\/badge';/,
  `import { Badge } from './ui';`
);
content = content.replace(
  /import { Button } from '\.\/components\/ui\/button';/,
  `import { Button } from './ui';`
);
content = content.replace(
  /import { Textarea } from '\.\/components\/ui\/textarea';/,
  `import { Textarea } from './ui';`
);
content = content.replace(
  /import { Input } from '\.\/components\/ui\/input';/,
  `import { Input } from './ui';`
);
content = content.replace(
  /import { MultiSelect } from '\.\/components\/ui\/multi-select';/,
  `import { Select } from 'antd';`
);
content = content.replace(
  /import { CameraMovementOverlay } from '\.\/components\/CameraMovementOverlay';/,
  `import { CameraMovementOverlay } from './CameraMovementOverlay';`
);

// We need to change the App component to MainContent
content = content.replace(/export default function App\(\) \{/, 'export const MainContent: React.FC = () => {');

// Replace state hooks with zustand
const stateHooks = `
  const {
    storyPages,
    shots,
    setShots,
    keyframes,
    setKeyframes,
    selectedStoryPageId,
    activePromptId,
    setActivePromptId,
    activeVideoPromptId,
    setActiveVideoPromptId,
    viewMode,
    setViewMode,
    showShotNav,
    setShowShotNav,
    shotNavPage,
    setShotNavPage,
    editingKeyframe,
    setEditingKeyframe,
    editingShot,
    setEditingShot,
    inputMedia,
    setInputMedia,
    savedMedia,
    setSavedMedia,
    updateKeyframe
  } = useStoryboardStore();
`;
content = content.replace(
  /const \[selectedStoryPageId, setSelectedStoryPageId\] = useState<string \| null>\(mockStoryPages\[0\]\?\.id \|\| null\);\n  const \[activePromptId, setActivePromptId\] = useState<string \| null>\(null\);\n  const \[activeVideoPromptId, setActiveVideoPromptId\] = useState<string \| null>\(null\);\n  const \[keyframes, setKeyframes\] = useState<Keyframe\[\]>\(initialKeyframes\);\n  const \[shots, setShots\] = useState<Shot\[\]>\(initialShots\);\n  const \[viewMode, setViewMode\] = useState<'edit' \| 'browse'>\('edit'\);\n  const \[showShotNav, setShowShotNav\] = useState\(true\);\n  const \[shotNavPage, setShotNavPage\] = useState\(0\);\n  const \[editingKeyframe, setEditingKeyframe\] = useState<Keyframe \| null>\(null\);\n  const \[editingShot, setEditingShot\] = useState<Shot \| null>\(null\);\n  const \[inputMedia, setInputMedia\] = useState<string\[\]>\(\[\]\);\n  const \[savedMedia, setSavedMedia\] = useState<string\[\]>\(\[\]\);/,
  stateHooks
);

// Replace setSelectedStoryPageId usages since it's not exported to MainContent, actually wait, handleNavigate uses it, but handleNavigate was in Sidebar. We need to remove Sidebar from MainContent.
const sidebarRegex = /{\/\* Sidebar \*\/}[\s\S]*?{\/\* Main Content \*\/}/m;
content = content.replace(sidebarRegex, '{/* Main Content */}');

// Remove <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 overflow-hidden font-sans"> wrap
content = content.replace(
  /<div className="flex h-screen w-full bg-zinc-50 text-zinc-900 overflow-hidden font-sans">\s*{\/\* Main Content \*\/}\s*<div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50\/50">/m,
  '<div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50">'
);
content = content.replace(/<\/div>\n    <\/div>\n  \);\n}/, '</div>\n  );\n}');

// Let's replace mockStoryPages with storyPages
content = content.replace(/mockStoryPages/g, 'storyPages');

// Find all usages of <MultiSelect ... /> and replace them with <Select mode="multiple" style={{ width: '100%' }} ... />
// We need to adjust props from MultiSelect to Select
content = content.replace(
  /<MultiSelect\s+options={mockCharacters\.map\(c => \({ value: c\.id, label: c\.name }\)\)}\s+selected={editingShot\.characterIds}\s+onChange={\(selected\) => setEditingShot\({ \.\.\.editingShot, characterIds: selected }\)}\s+placeholder="选择角色\.\.\."\s+\/>/g,
  '<Select mode="multiple" style={{ width: "100%" }} options={mockCharacters.map(c => ({ value: c.id, label: c.name }))} value={editingShot.characterIds} onChange={(selected) => setEditingShot({ ...editingShot, characterIds: selected })} placeholder="选择角色..." />'
);
content = content.replace(
  /<MultiSelect\s+options={mockProps\.map\(p => \({ value: p\.id, label: p\.name }\)\)}\s+selected={editingShot\.propIds \|\| \[\]}\s+onChange={\(selected\) => setEditingShot\({ \.\.\.editingShot, propIds: selected }\)}\s+placeholder="选择道具\.\.\."\s+\/>/g,
  '<Select mode="multiple" style={{ width: "100%" }} options={mockProps.map(p => ({ value: p.id, label: p.name }))} value={editingShot.propIds || []} onChange={(selected) => setEditingShot({ ...editingShot, propIds: selected })} placeholder="选择道具..." />'
);
content = content.replace(
  /<MultiSelect\s+options={mockScenes\.map\(s => \({ value: s\.id, label: s\.name }\)\)}\s+selected={editingShot\.sceneIds \|\| \[\]}\s+onChange={\(selected\) => setEditingShot\({ \.\.\.editingShot, sceneIds: selected }\)}\s+placeholder="选择场景\.\.\."\s+\/>/g,
  '<Select mode="multiple" style={{ width: "100%" }} options={mockScenes.map(s => ({ value: s.id, label: s.name }))} value={editingShot.sceneIds || []} onChange={(selected) => setEditingShot({ ...editingShot, sceneIds: selected })} placeholder="选择场景..." />'
);

// We need to make sure the file is written.
fs.writeFileSync(file, content);
console.log('MainContent.tsx modified');
