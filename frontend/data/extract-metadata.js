const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'modules.json');
const outputPath = path.join(__dirname, 'modules_meta.json');

try {
  console.log("Reading modules.json...");
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const modules = JSON.parse(rawData);
  console.log(`Parsed ${modules.length} modules. Extracting metadata...`);

  const meta = modules.map(mod => ({
    id: mod.id,
    title: mod.title,
    topics: (mod.topics || []).map(topic => ({
      id: topic.id,
      title: topic.title
    }))
  }));

  console.log("Writing modules_meta.json...");
  fs.writeFileSync(outputPath, JSON.stringify(meta, null, 2));
  console.log("Success! Extracted metadata saved.");
} catch (err) {
  console.error("Failed to extract metadata:", err);
  process.exit(1);
}
