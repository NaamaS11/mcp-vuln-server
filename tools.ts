export const tools = [
  {
    name: "count_open_vulnerabilities",
    description: "Return the total number of open vulnerabilities",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_most_dangerous_vendors",
    description: "Return vendors ranked by number of open vulnerabilities",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_vendor_risk_score",
    description: "Calculate a risk score per vendor based on vulnerability severity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_vulnerabilities_by_status",
    description: "Return vulnerabilities filtered by status (open or patched)",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "patched"],
        },
      },
      required: ["status"],
    },
  },
  {
    name: "get_vulnerability_by_cve",
    description: "Return a specific vulnerability by its CVE ID",
    parameters: {
      type: "object",
      properties: {
        cveId: {
          type: "string",
        },
      },
      required: ["cveId"],
    },
  },
  {
    name: "get_severity_stats",
    description: "Return count of vulnerabilities grouped by severity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_vendor_severity_matrix",
    description: "Return severity breakdown per vendor",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_vulnerabilities",
    description: "Search vulnerabilities using optional filters",
    parameters: {
      type: "object",
      properties: {
        cveId: { type: "string" },
        title: { type: "string" },
        vendorName: { type: "string" },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        status: {
          type: "string",
          enum: ["open", "patched"],
        },
      },
      required: [],
    },
  },
];