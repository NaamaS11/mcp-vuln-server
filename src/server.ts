

import { db } from "./index.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";


/* =========================
   types
========================= */

type Vendor = {
  id: string;
  name: string;
};

type Vulnerability = {
  id: string;
  cveId: string;
  title: string;
  vendor_id: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  status: "open" | "patched" | string;
  published?: string;
  affected_versions?: string;
};

type GetVulnerabilitiesByVendorArgs = {
  vendorName: string;
};

type GetVendorByNameArgs = {
  name: string;
};

type GetVulnerabilitiesByStatusArgs = {
  status: "open" | "patched";
};

type Severity = "low" | "medium" | "high" | "critical";

type SearchVulnerabilitiesArgs = {
  cveId?: string;
  title?: string;
  vendorName?: string;
   severity?: Severity;
  status?: "open" | "patched";
  publishedAfter?: string; 
  publishedBefore?: string;

  limit?: number;
  sortBy?: "severity" | "date";
};

type GetVulnerabilityByCveArgs = {
  cveId: string;
};

/* =========================
   SAFE DB ACCESS
========================= */

if (!db["vendors"] || !db["vulnerabilities"]) {

  throw new Error("DB failed to load");
}


const vendors = db["vendors"] as Vendor[];
const vulnerabilities = db["vulnerabilities"] as Vulnerability[];

/* =========================
   LOGIC
========================= */

function getOpenVulnerabilitiesCount() {
  return vulnerabilities.filter(v => v.status === "open").length;
}

function getVulnerabilitiesByVendor(vendorName: string) {
  const vendor = vendors.find(
    v => v.name.toLowerCase() === vendorName.toLowerCase()
  );

  if (!vendor) return [];

  return vulnerabilities.filter(v => v.vendor_id === vendor.id);
}

function getVendorByName(name: string) {
  return vendors.find(v => v.name === name) ?? null;
}

function getMostDangerousVendors() {
  const counts: Record<string, number> = {};

  for (const v of vulnerabilities) {
    if (v.status !== "open") continue;

    const id = v.vendor_id;
    counts[id] = (counts[id] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([id, count]) => {
      const vendor = vendors.find(v => v.id === id);
      return {
        vendor: vendor?.name ?? id,
        openVulns: count,
      };
    })
    .sort((a, b) => b.openVulns - a.openVulns);
}

const severityScore: Record<string, number> = {
  critical: 5,
  high: 3,
  medium: 2,
  low: 1,
};

function getVendorRiskScore() {
  const scoreMap: Record<string, number> = {};

  for (const v of vulnerabilities) {
    if (v.status !== "open") continue;

    const score = severityScore[v.severity] ?? 1;

    const id = v.vendor_id;
    scoreMap[id] = (scoreMap[id] || 0) + score;
  }

  return Object.entries(scoreMap)
    .map(([id, score]) => {
      const vendor = vendors.find(v => v.id === id);
      return {
        vendor: vendor?.name ?? id,
        riskScore: score,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

function searchVulnerabilities(args: SearchVulnerabilitiesArgs) {
  let results = vulnerabilities;

  if (args.cveId) {
    results = results.filter(v =>
      v.cveId.toLowerCase().includes(args.cveId!.toLowerCase())
    );
  }

  if (args.title) {
    results = results.filter(v =>
      v.title.toLowerCase().includes(args.title!.toLowerCase())
    );
  }

  if (args.severity) {
    results = results.filter(v => v.severity === args.severity);
  }

  if (args.status) {
    results = results.filter(v => v.status === args.status);
  }

  if (args.vendorName) {
    const vendor = vendors.find(v =>
      v.name.toLowerCase() === args.vendorName!.toLowerCase()
    );

    if (!vendor) return [];

    results = results.filter(v => v.vendor_id === vendor.id);
  }

 if (args.publishedAfter) {
    const after = new Date(args.publishedAfter);

    results = results.filter(v =>
      v.published ? new Date(v.published) >= after : false
    );
  }

  if (args.publishedBefore) {
    const before = new Date(args.publishedBefore);

    results = results.filter(v =>
      v.published ? new Date(v.published) <= before : false
    );
  }

  if (args.sortBy === "severity") {
    const order = { critical: 4, high: 3, medium: 2, low: 1 };

    results = results.sort(
      (a, b) => order[b.severity as keyof typeof order] -
                order[a.severity as keyof typeof order]
    );
  }

  if (args.sortBy === "date") {
    results = results.sort(
      (a, b) =>
        new Date(b.published ?? 0).getTime() -
        new Date(a.published ?? 0).getTime()
    );
  }

  if (args.limit) {
    results = results.slice(0, args.limit);
  }

  return results;
}

function validateSearchArgs(args: Partial<SearchVulnerabilitiesArgs>) {
  if (args?.status && args.status !== "open" && args.status !== "patched") {
    throw new Error("status must be 'open' or 'patched'");
  }

  if (args?.severity && !["low", "medium", "high", "critical"].includes(args.severity)) {
    throw new Error("invalid severity");
  }
}


function getVulnerabilityByCve(cveId: string) {
  return vulnerabilities.find(
    v => v.cveId.toLowerCase() === cveId.toLowerCase()
  ) ?? null;
}

function getSeverityStats() {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const v of vulnerabilities) {
    if (stats[v.severity as keyof typeof stats] !== undefined) {
      stats[v.severity as keyof typeof stats]++;
    }
  }

  return stats;
}

function getVendorSeverityMatrix() {
  const map: Record<
    string,
    { critical: number; high: number; medium: number; low: number }
  > = {};

  for (const v of vulnerabilities) {
    const vendorId = v.vendor_id;

    if (!map[vendorId]) {
      map[vendorId] = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    }

    const sev = v.severity as Severity;

    if (map[vendorId][sev] !== undefined) {
      map[vendorId][sev]++;
    }
  }

  return Object.entries(map).map(([vendorId, stats]) => {
    const vendor = vendors.find(v => v.id === vendorId);

    return {
      vendor: vendor?.name ?? vendorId,
      ...stats,
    };
  });
}

/* =========================
   MCP SERVER
========================= */

const server = new Server(
  {
    name: "vulnerability-server",
    version: "1.0.0",
  },
  {
    capabilities: { tools: {} },
  }
);

/* =========================
   TOOLS
========================= */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "count_open_vulnerabilities",
      description: "Count open vulnerabilities",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_vulnerabilities_by_vendor",
      description: "Get vulnerabilities by vendor name",
      inputSchema: {
        type: "object",
        properties: {
          vendorName: { type: "string" },
        },
        required: ["vendorName"],
      },
    },
    {
      name: "get_vendor_by_name",
      description: "Get vendor by name",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
    },
    {
      name: "get_most_dangerous_vendors",
      description: "Rank vendors by open vulnerabilities",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_vendor_risk_score",
      description: "Calculate vendor risk score",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_vulnerabilities_by_status",
      description: "Filter vulnerabilities by status (open/patched)",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string" }
        },
        required: ["status"]
      }
    },
    {
      name: "search_vulnerabilities",
      description: "Search vulnerabilities with multiple filters",
      inputSchema: {
        type: "object",
        properties: {
          cveId: { type: "string" },
          title: { type: "string" },
          vendorName: { type: "string" },

          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },

          status: {
            type: "string",
            enum: ["open", "patched"]
          },

          publishedAfter: {
            type: "string",
            description: "YYYY-MM-DD"
          },

          publishedBefore: {
            type: "string",
            description: "YYYY-MM-DD"
          },
        },
      },
    },
    {
      name: "get_vulnerability_by_cve",
      description: "Get a vulnerability by CVE ID",
      inputSchema: {
        type: "object",
        properties: {
          cveId: { type: "string" },
        },
        required: ["cveId"],
      },
    },
    {
      name: "get_severity_stats",
      description: "Get count of vulnerabilities by severity level",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_vendor_severity_matrix",
      description: "Get severity breakdown per vendor",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

/* =========================
   CALL TOOLS
========================= */

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === "count_open_vulnerabilities") {
    
    return {
      content: [
        {
          type: "text",
          text: String(getOpenVulnerabilitiesCount()),
        },
      ],
    };
  }

  if (name === "get_vulnerabilities_by_vendor") {
    const args = request.params.arguments as GetVulnerabilitiesByVendorArgs;

    if (!args || typeof args.vendorName !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "vendorName must be a string" }, null, 2),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            getVulnerabilitiesByVendor(args.vendorName),
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "get_vendor_by_name") {
    const args = request.params.arguments as GetVendorByNameArgs;

    if (!args || typeof args.name !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "name must be a string" }, null, 2),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getVendorByName(args.name), null, 2),
        },
      ],
    };
  }

  if (name === "get_most_dangerous_vendors") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getMostDangerousVendors(), null, 2),
        },
      ],
    };
  }

  if (name === "get_vendor_risk_score") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getVendorRiskScore(), null, 2),
        },
      ],
    };
  }

  if (name === "get_vulnerabilities_by_status") {
    const args = request.params.arguments as GetVulnerabilitiesByStatusArgs;

    if (!args || typeof args.status !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "status must be a string" }, null, 2),
          },
        ],
      };
    }

    if (args.status !== "open" && args.status !== "patched") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "status must be 'open' or 'patched'" },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            vulnerabilities.filter(v => v.status === args.status),
            null,
            2 
          )
        }
      ]
    };
  }

  if (name === "search_vulnerabilities") {
    const args: SearchVulnerabilitiesArgs = request.params.arguments ?? {};

      try {
        validateSearchArgs(args);
      } catch (e: unknown) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: e instanceof Error ? e.message : String(e) },
              null,
              2
            ),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            searchVulnerabilities(args),
            null,
            2
          ),  
        },
      ],
    };
  }

  if (name === "get_vulnerability_by_cve") {
    const args = request.params.arguments as GetVulnerabilityByCveArgs;

    if (!args || typeof args.cveId !== "string") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "cveId must be a string" }, null, 2),
          },
        ],
      };
    }

    const result = getVulnerabilityByCve(args.cveId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              cveId: args.cveId,
              result
            },
            null,
            2
          )
        },
      ],
    };
  }

  if (name === "get_severity_stats") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getSeverityStats(), null, 2),
        },
      ],
    };
  }

  if (name === "get_vendor_severity_matrix") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getVendorSeverityMatrix(), null, 2),
        },
      ],
    };
  }

  return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "`Tool not found` " }, null, 2),
        },
      ],
    };
});

/* =========================
   START SERVER
========================= */

const transport = new StdioServerTransport();
await server.connect(transport);

console.log("MCP Server running...");