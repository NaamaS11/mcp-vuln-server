import http from "node:http";
import { decideTool, askGroq } from "./groq.js";
import { callMCP } from "./mcp-client.js";

const PORT = 3000;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Vulnerability Agent</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f7fb;
      margin: 0;
      padding: 40px;
      color: #1f2937;
    }

    .container {
      max-width: 800px;
      margin: auto;
      background: white;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    h1 {
      margin-top: 0;
      color: #111827;
    }

    textarea {
      width: 100%;
      height: 100px;
      padding: 14px;
      font-size: 16px;
      border-radius: 10px;
      border: 1px solid #d1d5db;
      resize: vertical;
    }

    button {
      margin-top: 16px;
      padding: 12px 20px;
      font-size: 16px;
      border: none;
      border-radius: 10px;
      background: #2563eb;
      color: white;
      cursor: pointer;
    }

    button:hover {
      background: #1d4ed8;
    }

    .answer {
      margin-top: 24px;
      padding: 18px;
      background: #f9fafb;
      border-left: 4px solid #2563eb;
      border-radius: 10px;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .meta {
      margin-top: 12px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vulnerability Analysis Agent</h1>
    <p>Ask a natural-language question about vendors, vulnerabilities, CVEs, severity, or risk.</p>

    <textarea id="question" placeholder="Example: Show severity statistics"></textarea>
    <button onclick="askAgent()">Ask</button>

    <div id="result" class="answer" style="display:none;"></div>
  </div>

  <script>
    async function askAgent() {
      const question = document.getElementById("question").value;
      const resultBox = document.getElementById("result");

      if (!question.trim()) return;

      resultBox.style.display = "block";
      resultBox.textContent = "Analyzing...";

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await res.json();

      if (data.error) {
        resultBox.textContent = "Error: " + data.error;
        return;
      }

      resultBox.textContent =
        "Selected tool: " + data.tool + "\\n\\n" + data.answer;
    }
  </script>
</body>
</html>
`;

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/api/ask") {
    try {
      const body = await readBody(req);
      const { question } = JSON.parse(body) as { question: string };

      const decision = await decideTool(question);

      if (!decision) {
        throw new Error("Could not select a matching tool");
      }

      const toolResult = await callMCP(decision.tool, decision.args);

      const answer = await askGroq(
        `You are a cybersecurity analyst.
Summarize the MCP tool result in plain English.
Do not explain JSON.
Focus only on the security insight.
Keep it concise.

User question:
${question}

Tool result:
${JSON.stringify(toolResult, null, 2)}`
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          tool: decision.tool,
          answer,
        })
      );
    } catch (error: unknown) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Web UI running at http://localhost:${PORT}`);
});