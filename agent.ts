import readline from "node:readline";
import { decideTool, askGroq } from "./groq.js";
import { callMCP } from "./mcp-client.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string) {
  return new Promise<string>(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {

  while (true) {
    const input = await ask("You: ");

    if (input === "exit") {
      console.log("Goodbye!");
      break;
    }

    if (!input.trim()) {
      continue;
    }

    try {
      console.log("Analyzing your question...");
      const decision = await decideTool(input);

      if (!decision || !decision.tool) {
        console.log(
          "I could not map this question to a tool. Try asking about vulnerabilities, vendors, severity, or CVEs."
        );
        continue;
      }

      console.log(`Selected tool: ${decision.tool}`);

      let result: unknown;

      try {
        result = await callMCP(decision.tool, decision.args ?? {});
      } catch (mcpError: unknown) {
        console.error(
          `Error executing tool: ${
            mcpError instanceof Error ? mcpError.message : String(mcpError)
          }`
        );
        continue;
      }


      const final = await askGroq(
        `You are a cybersecurity analyst.
        Summarize the MCP tool result in plain English.
        Do not explain JSON.
        Focus only on the security insight.
        Keep it concise.

        User question:
        ${input}

        Tool result:${JSON.stringify(result, null, 2)}`
      );

      console.log("\nAnswer:", final, "\n");
    } 
    
    catch (err: unknown) {
      console.error(
        `\nUnexpected error: ${
          err instanceof Error ? err.message : String(err)
        }\n`
      );
    }
  }

  rl.close();
}

main();