import * as fs from "fs";
import * as path from "path";

export function saveMarkdown(topic: string, content: string): Promise<string> {
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), "research-notes");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a clean filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const cleanTopic = topic
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const fileName = `${cleanTopic}-${timestamp}.md`;
  const filePath = path.join(outputDir, fileName);

  return new Promise((resolve, reject) => {
    // Add metadata header to the content
    const metadataHeader = `---
title: "${topic}"
created: ${new Date().toISOString()}
agent: doodle v0
---

`;

    const finalContent = metadataHeader + content;

    fs.writeFile(filePath, finalContent, "utf8", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}
