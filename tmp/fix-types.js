const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/supabase/database.types.ts');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

const newLines = [];
let inUpdateBlock = false;
let updateIndentation = '';
let updateBraceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (!inUpdateBlock) {
    newLines.push(line); // push normally
    const match = line.match(/^(\s*)Update:\s*\{\s*$/);
    if (match) {
      inUpdateBlock = true;
      updateIndentation = match[1];
      updateBraceDepth = 1;
    }
  } else {
    // inside Update block
    newLines.push(line);
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    updateBraceDepth += openBraces - closeBraces;

    if (updateBraceDepth === 0) {
      inUpdateBlock = false; // exited
      
      // Inject Relationships safely!
      newLines.push(`${updateIndentation}Relationships: any[]`);
    }
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log("Injected Relationships: any[] using brace counting");
