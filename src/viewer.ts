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

// Clean Academic CSS Theme
const academicCSS = `
/* Academic Research Paper Style */
* {
  box-sizing: border-box;
}

body {
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  line-height: 1.6;
  color: #586e75;
  background-color: #fdf6e3;
  margin: 0;
  padding: 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fdf6e3;
  min-height: 100vh;
}

.nav {
  background-color: #eee8d5;
  border-bottom: 1px solid #d3cbb7;
  padding: 1rem 0;
  margin: -2rem 0 2rem 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.nav a {
  color: #007bff;
  text-decoration: none;
  margin-right: 1.5rem;
  font-weight: 500;
}

.nav a:hover {
  color: #0056b3;
  text-decoration: underline;
}

.nav .title {
  float: right;
  color: #6c757d;
  font-weight: normal;
}

.header {
  border-bottom: 1px solid #d3cbb7;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.file-list {
  background-color: #eee8d5;
  border: 1px solid #d3cbb7;
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.file-item {
  display: block;
  color: #007bff;
  text-decoration: none;
  padding: 0.75rem;
  margin: 0.25rem 0;
  border-radius: 3px;
  transition: background-color 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.file-item:hover {
  background-color: #fdf6e3;
  text-decoration: none;
}

.file-item strong {
  font-weight: 600;
}

.file-item small {
  color: #6c757d;
  font-size: 13px;
}

h1, h2, h3, h4, h5, h6 {
  color: #212529;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
  line-height: 1.3;
}

h1 {
  font-size: 2rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.5rem;
  margin-top: 2.5rem;
}

h3 {
  font-size: 1.25rem;
}

h4 {
  font-size: 1.1rem;
}

p {
  margin-bottom: 1rem;
  text-align: justify;
}

a {
  color: #007bff;
  text-decoration: underline;
}

a:hover {
  color: #0056b3;
}

code {
  background-color: #eee8d5;
  color: #dc322f;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.9em;
  border: 1px solid #d3cbb7;
}

pre {
  background-color: #eee8d5;
  border: 1px solid #d3cbb7;
  border-radius: 4px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.4;
}

pre code {
  background: none;
  color: #586e75;
  padding: 0;
  border: none;
  border-radius: 0;
}

blockquote {
  border-left: 4px solid #268bd2;
  background-color: #eee8d5;
  margin: 1.5rem 0;
  padding: 1rem 1.5rem;
  font-style: italic;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 15px;
}

th, td {
  border: 1px solid #d3cbb7;
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
}

th {
  background-color: #eee8d5;
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #eee8d5;
}

ul, ol {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

li {
  margin-bottom: 0.3rem;
}

/* Code highlighting */
.hljs {
  background: #eee8d5 !important;
  color: #586e75 !important;
}

.hljs-keyword { color: #d73a49 !important; }
.hljs-string { color: #032f62 !important; }
.hljs-comment { color: #6a737d !important; font-style: italic; }
.hljs-number { color: #005cc5 !important; }
.hljs-function { color: #6f42c1 !important; }
.hljs-variable { color: #e36209 !important; }
.hljs-type { color: #d73a49 !important; }
.hljs-title { color: #6f42c1 !important; font-weight: bold; }
.hljs-attr { color: #005cc5 !important; }
.hljs-built_in { color: #005cc5 !important; }

.metadata {
  background-color: #eee8d5;
  border: 1px solid #d3cbb7;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 2rem;
  font-size: 14px;
  color: #657b83;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.metadata h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 16px;
  color: #495057;
}

.back-to-list {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
}

.back-to-list:hover {
  color: #0056b3;
  text-decoration: underline;
}

.no-files {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 3rem 2rem;
}

.no-files h3 {
  color: #495057;
  margin-bottom: 1rem;
}

/* Print styles for academic papers */
@media print {
  .nav, .back-to-list, .metadata {
    display: none;
  }
  
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
  
  .container {
    max-width: none;
    padding: 0;
  }
  
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  pre, blockquote {
    page-break-inside: avoid;
  }
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
      <div class="nav-content">
        <a href="/">Home</a>
        <a href="/list">All Notes</a>
        <span class="title">doodle, by <a href="https://x.com/ag_wnl" target="_blank">@agwnl</a></span>
      </div>
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
      <style>${academicCSS}</style>
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
        <h1>doodle</h1>
      </div>
      <div class="no-files">
        <h3>No research notes found</h3>
        <p>Run <code>npm start research "your topic"</code> to create your first research note.</p>
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
        <h1>Research Notes</h1>
      </div>
      <div class="no-files">
        <h3>No research notes found</h3>
        <p>Run <code>npm start research "your topic"</code> to create your first research note.</p>
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
        <small>Created: ${formattedDate}</small>
      </a>
    `;
    })
    .join("");

  const content = `
    <div class="header">
      <h1>Research Notes</h1>
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
        <h1>File Not Found</h1>
        <p>The file "${filename}" could not be found.</p>
        <a href="/list" class="back-to-list">Back to All Notes</a>
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
            <h4>Document Information</h4>
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
        <h1>Error Reading File</h1>
        <p>Could not read the file "${filename}": ${error}</p>
        <a href="/list" class="back-to-list">Back to All Notes</a>
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
        console.log(`\nMarkdown Viewer started!`);
        console.log(`View your research notes at: ${url}`);
        console.log(`Press Ctrl+C to stop the viewer\n`);

        if (autoOpen) {
          open(url).catch(() => {
            console.log(`Could not auto-open browser. Please visit: ${url}`);
          });
        }

        resolve();
      })
      .on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `\nPort ${PORT} is already in use. The viewer might already be running.`
          );
          console.log(`Try visiting: http://localhost:${PORT}\n`);
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
    console.log("Markdown Viewer stopped.");
  }
}
