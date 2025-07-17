import express from "express";
import { marked } from "marked";
import * as fs from "fs";
import * as path from "path";
import hljs from "highlight.js";
import open from "open";

const app = express();
const PORT = 3456;

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Function to highlight code blocks after markdown processing
function highlightCodeInHTML(html: string): string {
  return html
    .replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        try {
          const decodedCode = code
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
          const highlightedCode = hljs.highlight(decodedCode, {
            language: lang,
          }).value;
          return `<pre><code class="hljs language-${lang}">${highlightedCode}</code></pre>`;
        } catch (err) {
          return match;
        }
      }
    )
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      try {
        const decodedCode = code
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&");
        const highlightedCode = hljs.highlightAuto(decodedCode).value;
        return `<pre><code class="hljs">${highlightedCode}</code></pre>`;
      } catch (err) {
        return match;
      }
    });
}

// Solarized Light CSS Theme
const solarizedLightCSS = `
/* Solarized Light Theme */
:root {
  --base03: #002b36;
  --base02: #073642;
  --base01: #586e75;
  --base00: #657b83;
  --base0: #839496;
  --base1: #93a1a1;
  --base2: #eee8d5;
  --base3: #fdf6e3;
  --yellow: #b58900;
  --orange: #cb4b16;
  --red: #dc322f;
  --magenta: #d33682;
  --violet: #6c71c4;
  --blue: #268bd2;
  --cyan: #2aa198;
  --green: #859900;
}

body {
  font-family: 'Georgia', 'Times New Roman', serif;
  line-height: 1.6;
  color: var(--base01);
  background-color: var(--base3);
  margin: 0;
  padding: 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--base3);
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  min-height: 100vh;
}

.header {
  border-bottom: 2px solid var(--base2);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.nav {
  background-color: var(--base2);
  padding: 1rem;
  margin: -2rem -2rem 2rem -2rem;
  border-bottom: 1px solid var(--base1);
}

.nav a {
  color: var(--blue);
  text-decoration: none;
  margin-right: 1rem;
  font-weight: 500;
}

.nav a:hover {
  color: var(--cyan);
  text-decoration: underline;
}

.file-list {
  background-color: var(--base2);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.file-item {
  display: block;
  color: var(--blue);
  text-decoration: none;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background-color: var(--base3);
  color: var(--cyan);
  text-decoration: none;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--base02);
  margin-top: 2rem;
  margin-bottom: 1rem;
}

h1 {
  color: var(--blue);
  border-bottom: 3px solid var(--base2);
  padding-bottom: 0.5rem;
}

h2 {
  color: var(--green);
  border-bottom: 1px solid var(--base2);
  padding-bottom: 0.3rem;
}

h3 {
  color: var(--orange);
}

p {
  margin-bottom: 1rem;
}

a {
  color: var(--blue);
  text-decoration: underline;
}

a:hover {
  color: var(--cyan);
}

code {
  background-color: var(--base2);
  color: var(--red);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
}

pre {
  background-color: var(--base2);
  border: 1px solid var(--base1);
  border-radius: 8px;
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

pre code {
  background: none;
  color: var(--base01);
  padding: 0;
  border-radius: 0;
}

blockquote {
  border-left: 4px solid var(--blue);
  background-color: var(--base2);
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  font-style: italic;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

th, td {
  border: 1px solid var(--base1);
  padding: 0.8rem;
  text-align: left;
}

th {
  background-color: var(--base2);
  color: var(--base02);
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: var(--base2);
}

ul, ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.5rem;
}

/* Syntax highlighting for code blocks */
.hljs {
  background: var(--base2) !important;
  color: var(--base01) !important;
}

.hljs-keyword { color: var(--green) !important; }
.hljs-string { color: var(--cyan) !important; }
.hljs-comment { color: var(--base1) !important; font-style: italic; }
.hljs-number { color: var(--magenta) !important; }
.hljs-function { color: var(--blue) !important; }
.hljs-variable { color: var(--orange) !important; }
.hljs-type { color: var(--yellow) !important; }
.hljs-title { color: var(--blue) !important; font-weight: bold; }
.hljs-attr { color: var(--orange) !important; }
.hljs-built_in { color: var(--red) !important; }

.metadata {
  background-color: var(--base2);
  border: 1px solid var(--base1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  font-size: 0.9em;
  color: var(--base00);
}

.back-to-list {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--blue);
  text-decoration: none;
  font-weight: 500;
}

.back-to-list:hover {
  color: var(--cyan);
}

.no-files {
  text-align: center;
  color: var(--base00);
  font-style: italic;
  padding: 2rem;
}
`;

function getResearchFiles(): string[] {
  const researchDir = path.join(process.cwd(), "research-notes");
  if (!fs.existsSync(researchDir)) {
    return [];
  }

  return fs
    .readdirSync(researchDir)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => {
      // Sort by modification time, newest first
      const statsA = fs.statSync(path.join(researchDir, a));
      const statsB = fs.statSync(path.join(researchDir, b));
      return statsB.mtime.getTime() - statsA.mtime.getTime();
    });
}

function createHTMLTemplate(
  title: string,
  content: string,
  showNav: boolean = true
): string {
  const nav = showNav
    ? `
    <div class="nav">
      <a href="/">🏠 Home</a>
      <a href="/list">📚 All Notes</a>
      <span style="float: right; color: var(--base00);">📖 AI Research Agent Viewer</span>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Research Notes</title>
      <style>${solarizedLightCSS}</style>
    </head>
    <body>
      <div class="container">
        ${nav}
        ${content}
      </div>
    </body>
    </html>
  `;
}

// Routes
app.get("/", (req, res) => {
  const files = getResearchFiles();

  if (files.length === 0) {
    const content = `
      <div class="header">
        <h1>🔍 AI Research Agent Viewer</h1>
        <p>Welcome to your research notes viewer!</p>
      </div>
      <div class="no-files">
        <h3>No research notes found</h3>
        <p>Run <code>npm start research "your topic"</code> to create your first research note!</p>
      </div>
    `;
    res.send(createHTMLTemplate("Home", content, false));
    return;
  }

  // Show the latest file by default
  const latestFile = files[0];
  res.redirect(`/view/${encodeURIComponent(latestFile)}`);
});

app.get("/list", (req, res) => {
  const files = getResearchFiles();

  if (files.length === 0) {
    const content = `
      <div class="header">
        <h1>📚 Research Notes</h1>
      </div>
      <div class="no-files">
        <h3>No research notes found</h3>
        <p>Run <code>npm start research "your topic"</code> to create your first research note!</p>
      </div>
    `;
    res.send(createHTMLTemplate("All Notes", content));
    return;
  }

  const fileListHTML = files
    .map((file) => {
      const filePath = path.join(process.cwd(), "research-notes", file);
      const stats = fs.statSync(filePath);
      const displayName = file
        .replace(/\.md$/, "")
        .replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, "");
      const formattedDate =
        stats.mtime.toLocaleDateString() +
        " " +
        stats.mtime.toLocaleTimeString();

      return `
      <a href="/view/${encodeURIComponent(file)}" class="file-item">
        <strong>${displayName}</strong><br>
        <small style="color: var(--base00);">Created: ${formattedDate}</small>
      </a>
    `;
    })
    .join("");

  const content = `
    <div class="header">
      <h1>📚 All Research Notes</h1>
      <p>Select a research note to view:</p>
    </div>
    <div class="file-list">
      ${fileListHTML}
    </div>
  `;

  res.send(createHTMLTemplate("All Notes", content));
});

app.get("/view/:filename", async (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(process.cwd(), "research-notes", filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send(
      createHTMLTemplate(
        "File Not Found",
        `
      <div class="header">
        <h1>❌ File Not Found</h1>
        <p>The file "${filename}" could not be found.</p>
        <a href="/list" class="back-to-list">← Back to All Notes</a>
      </div>
    `
      )
    );
    return;
  }

  try {
    const markdownContent = fs.readFileSync(filePath, "utf8");

    // Extract metadata if present
    let content = markdownContent;
    let metadata = "";

    if (content.startsWith("---\n")) {
      const metadataEnd = content.indexOf("\n---\n", 4);
      if (metadataEnd !== -1) {
        const metadataText = content.slice(4, metadataEnd);
        content = content.slice(metadataEnd + 5);

        // Parse and display metadata nicely
        const metadataLines = metadataText
          .split("\n")
          .map((line) => {
            if (line.includes(":")) {
              const [key, ...values] = line.split(":");
              return `<strong>${key.trim()}:</strong> ${values
                .join(":")
                .trim()}`;
            }
            return line;
          })
          .join("<br>");

        metadata = `
          <div class="metadata">
            <h4>📋 Document Info</h4>
            ${metadataLines}
          </div>
        `;
      }
    }

    const rawHtml = await marked(content);
    const htmlContent = highlightCodeInHTML(rawHtml);
    const displayName = filename
      .replace(/\.md$/, "")
      .replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, "");

    const pageContent = `
      <a href="/list" class="back-to-list">← Back to All Notes</a>
      ${metadata}
      ${htmlContent}
    `;

    res.send(createHTMLTemplate(displayName, pageContent));
  } catch (error) {
    res.status(500).send(
      createHTMLTemplate(
        "Error",
        `
      <div class="header">
        <h1>❌ Error Reading File</h1>
        <p>Could not read the file "${filename}": ${error}</p>
        <a href="/list" class="back-to-list">← Back to All Notes</a>
      </div>
    `
      )
    );
  }
});

let server: any = null;

export async function startViewer(autoOpen: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    server = app
      .listen(PORT, () => {
        const url = `http://localhost:${PORT}`;
        console.log(`\n📖 Markdown Viewer started!`);
        console.log(`🌐 View your research notes at: ${url}`);
        console.log(`📱 Press Ctrl+C to stop the viewer\n`);

        if (autoOpen) {
          open(url).catch(() => {
            console.log(`💡 Could not auto-open browser. Please visit: ${url}`);
          });
        }

        resolve();
      })
      .on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `\n🔄 Port ${PORT} is already in use. The viewer might already be running.`
          );
          console.log(`🌐 Try visiting: http://localhost:${PORT}\n`);
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function stopViewer(): void {
  if (server) {
    server.close();
    console.log("📖 Markdown Viewer stopped.");
  }
}
