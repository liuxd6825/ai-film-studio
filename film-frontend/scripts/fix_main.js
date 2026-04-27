import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'open-film-service/web/src/features/storyboard/components/MainContent.tsx');
let content = fs.readFileSync(file, 'utf-8');

// The main return statement is right after the hooks and handlers. Let's find "return ("
content = content.replace(
  /return \(\n\s*<div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50\/50">/,
  'return (\n    <>\n      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50">'
);

content = content.replace(
  /    <\/div>\n  \);\n}/,
  '    </>\n  );\n}'
);

fs.writeFileSync(file, content);
console.log('MainContent.tsx fixed root element');
