import readline from "node:readline";
import { callMCP } from "./mcp-client.js";

type ToolDecision = {
  tool: string;
  args: Record<string, unknown>;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

function selectToolByKeywords(input: string): ToolDecision {
  const lower = input.toLowerCase();

  if (lower.includes("cve")) {
    const match = input.match(/CVE-\d{4}-\d+/i);

    return {
      tool: "get_vulnerability_by_cve",
      args: { cveId: match ? match[0] : "" }
    };
  }

  if (lower.includes("severity")) {
    return { tool: "get_severity_stats", args: {} };
  }

  if (lower.includes("risk") && lower.includes("vendor")) {
    return { tool: "get_vendor_risk_score", args: {} };
  }

  if (
    lower.includes("dangerous") ||
    lower.includes("most") ||
    lower.includes("rank")
  ) {
    return { tool: "get_most_dangerous_vendors", args: {} };
  }

  if (lower.includes("search") || lower.includes("find")) {
    return { tool: "search_vulnerabilities", args: {} };
  }

  if (lower.includes("status") && lower.includes("open")) {
    return { tool: "get_vulnerabilities_by_status", args: { status: "open" } };
  }

  return { tool: "count_open_vulnerabilities", args: {} };
}

async function main() {

  while (true) {
    const input = await ask("You: ");

    if (input === "exit") {
      console.log("Goodbye.");
      break;
    }

    if (!input.trim()) {
      continue;
    }

    try {
      const decision = selectToolByKeywords(input);

      console.log(`Selected tool: ${decision.tool}`);

      const result = await callMCP(decision.tool, decision.args);

      console.log("\nResult:");
      console.log(JSON.stringify(result, null, 2));
      console.log();
    } catch (error: unknown) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  rl.close();
}

main();