import Groq from "groq-sdk";
import "dotenv/config";
import { tools } from "./tools.js";

const MODEL = "llama-3.1-8b-instant";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

const groq = new Groq({ apiKey });

export async function askGroq(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function decideTool(userInput: string): Promise<{ tool: string; args: Record<string, unknown> } | null> {
  const lower = userInput.toLowerCase();

  if (lower.includes("cve")) {
    const match = userInput.match(/CVE-\d{4}-\d+/i);

    return {
      tool: "get_vulnerability_by_cve",
      args: {
        cveId: match ? match[0] : ""
      }
    };
  }
  const prompt = `You are selecting a tool for a vulnerability analysis agent.

  Choose the best tool for the user's request.
  Return only valid JSON. Do not include markdown or explanations.

  Available tools:
  ${JSON.stringify(tools, null, 2)}

  User request:
  ${userInput}

  Expected JSON format:
  {
    "tool": "tool_name",
    "args": {}
  }`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as {
      tool: string;
      args: Record<string, unknown>;
    };
  } catch {
    return null;
  }
}