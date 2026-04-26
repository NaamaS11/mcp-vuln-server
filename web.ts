import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { decideTool, askGroq } from "./groq.js";
import { callMCP } from "./mcp-client.js";

const PORT = 3000;

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
  // 🔥 במקום string — קוראים קובץ
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(process.cwd(), "index.html");
    const html = fs.readFileSync(filePath, "utf-8");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/api/ask") {
    try {
      const body = await readBody(req);
      const { question } = JSON.parse(body);

      const decision = await decideTool(question);

      if (!decision) {
        throw new Error("Could not select a matching tool");
      }

      const toolResult = await callMCP(decision.tool, decision.args);

      const answer = await askGroq(`
Summarize the result in plain English.

Question:
${question}

Result:
${JSON.stringify(toolResult, null, 2)}
`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        tool: decision.tool,
        answer
      }));

    } catch (error: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: error.message
      }));
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT);