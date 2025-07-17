import * as fs from 'fs';
import * as path from 'path';

export function saveMarkdown(topic: string, content: string): Promise<string> {
  const fileName = `${topic.replace(/\s+/g, '-').toLowerCase()}.md`;
  const filePath = path.join(process.cwd(), fileName);

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}
