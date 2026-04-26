import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

type McpResponse = {
  jsonrpc: "2.0";
  id?: number;
  result?: unknown;
  error?: unknown;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function callMCP(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const serverPath = resolvePath(__dirname, "src", "server.js");
    const proc = spawn("node", [serverPath]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", data => {
      stdout += data.toString();
    });

    proc.stderr.on("data", data => {
      stderr += data.toString();
    });

    proc.on("error", error => {
      reject(error);
    });

    proc.on("close", () => {
      const lines = stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        try {
          const message = JSON.parse(line) as McpResponse;

          if (message.id === 2) {
            if (message.error) {
              reject(new Error(JSON.stringify(message.error, null, 2)));
              return;
            }

            resolve(message.result);
            return;
          }
        } catch {
          // Ignore non-JSON output.
        }
      }

      reject(
        new Error(
          `No MCP tool response found.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
        )
      );
    });

    proc.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "vulnerability-agent",
            version: "1.0.0",
          },
        },
      }) + "\n"
    );

    proc.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      }) + "\n"
    );

    proc.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: tool,
          arguments: args,
        },
      }) + "\n"
    );

    proc.stdin.end();
  });
}