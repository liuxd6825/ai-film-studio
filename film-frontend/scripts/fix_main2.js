import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'open-film-service/web/src/features/storyboard/components/MainContent.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Fix types import path
content = content.replace(/from '\.\/types'/g, "from '../types'");

// Replace remaining MultiSelect usages. The previous regex probably didn't match line breaks.
// Let's just find <MultiSelect and replace it entirely using string manipulation.
const selectLines = content.split('\n');
for (let i = 0; i < selectLines.length; i++) {
  if (selectLines[i].includes('<MultiSelect')) {
    // This is a bit tricky, let's just use regex for <MultiSelect ... /> across multiple lines
  }
}

content = content.replace(/<MultiSelect[\s\S]*?\/>/g, (match) => {
  // Extract options, selected, onChange, placeholder
  const optionsMatch = match.match(/options=\{([^}]+)\}/);
  const selectedMatch = match.match(/selected=\{([^}]+)\}/);
  let onChangeMatch = match.match(/onChange=\{\(selected\)\s*=>\s*([^}]+)\}/);
  if (!onChangeMatch) {
     onChangeMatch = match.match(/onChange=\{\([^)]+\)\s*=>\s*([^}]+)\}/);
  }
  const placeholderMatch = match.match(/placeholder="([^"]+)"/);
  
  if (optionsMatch && selectedMatch && onChangeMatch && placeholderMatch) {
    const options = optionsMatch[1];
    const selected = selectedMatch[1];
    const onChange = onChangeMatch[1];
    const placeholder = placeholderMatch[1];
    
    return `<Select mode="multiple" style={{ width: "100%" }} options={${options}} value={${selected}} onChange={(v: string[]) => { const selected = v; ${onChange} }} placeholder="${placeholder}" />`;
  }
  return match;
});

// Remove local updateKeyframe definition since it's from store now
content = content.replace(/const updateKeyframe = \(id: string, updates: Partial<Keyframe>\) => \{\n\s*setKeyframes\(prev => prev.map\(kf => kf.id === id \? \{ \.\.\.kf, \.\.\.updates \} : kf\)\);\n\s*\};/g, '');
// Wait, in prototype it was:
content = content.replace(/const updateKeyframe = \(id: string, updates: Partial<Keyframe>\) => \{\n\s*setKeyframes\(prev => prev.map\(kf => kf.id === id \? \{ \.\.\.kf, \.\.\.updates \} : kf\)\);\n\s*\};/g, '');

content = content.replace(/const updateKeyframe = \([\s\S]*?\};/m, '');

// Also, setSelectedStoryPageId error in MainContent
content = content.replace(/setSelectedStoryPageId/g, 'useStoryboardStore.getState().setSelectedStoryPageId');

// Map array map items without key or type errors: Type 'unknown' is not assignable to type 'ReactNode'
// In Select options map: c => ({ value: c.id, label: c.name }) -> c.name is string, so this is fine. The error was probably from the previous broken regex replace.

// Let's add Select to imports from antd
if (!content.includes("import { Select } from 'antd';")) {
  content = content.replace(/import { Input } from '\.\/ui';/, "import { Input } from './ui';\nimport { Select } from 'antd';");
}

fs.writeFileSync(file, content);
console.log('MainContent fixed');
