const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'modules.json');

function mergeLines(content) {
  if (typeof content !== 'string') return content;
  // Split by line breaks and filter out empty lines
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) return content;
  
  let paragraphs = [];
  let currentParagraph = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!currentParagraph) {
      currentParagraph = line;
    } else {
      const lastChar = currentParagraph.slice(-1);
      const prevLine = lines[i - 1] || "";
      const isPrevLineShort = prevLine.length < 65;
      const endsWithSentencePunct = /[.!?:]/.test(lastChar);
      
      if (isPrevLineShort && endsWithSentencePunct) {
        paragraphs.push(currentParagraph);
        currentParagraph = line;
      } else {
        if (currentParagraph.endsWith('-')) {
          currentParagraph = currentParagraph.slice(0, -1) + line;
        } else {
          currentParagraph += " " + line;
        }
      }
    }
  }
  
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }
  
  return paragraphs.join('\n\n');
}

try {
  console.log("Reading modules.json...");
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log("Read modules.json successfully.");
  
  let updatedCount = 0;
  for (const mod of data) {
    for (const topic of mod.topics || []) {
      for (const mat of topic.materials || []) {
        if (mat.type === 'text') {
          const originalLength = mat.content.length;
          const originalContent = mat.content;
          mat.content = mergeLines(mat.content);
          if (mat.content !== originalContent) {
            updatedCount++;
          }
        }
      }
      for (const sub of topic.subtopics || []) {
        for (const mat of sub.materials || []) {
          if (mat.type === 'text') {
            const originalLength = mat.content.length;
            const originalContent = mat.content;
            mat.content = mergeLines(mat.content);
            if (mat.content !== originalContent) {
              updatedCount++;
            }
          }
        }
      }
    }
  }
  
  if (updatedCount > 0) {
    console.log(`Writing back to modules.json (${updatedCount} text materials updated)...`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Migration complete!");
  } else {
    console.log("No modules required migration.");
  }
} catch (err) {
  console.error("Migration failed:", err);
}
