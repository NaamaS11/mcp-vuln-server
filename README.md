# Vulnerability Analysis MCP Server

## Overview

This project implements a Model Context Protocol (MCP) server in TypeScript for querying a legacy vulnerability database stored in custom pipe-delimited text files.

The system exposes structured tools that allow an AI agent (or any MCP-compatible client) to explore, filter, and analyze security vulnerabilities efficiently.

On top of the MCP server, an agent layer was added to enable natural-language queries using an LLM (Groq), along with both CLI and a simple web interface.

---

## Project Structure

* `src/index.ts` – Loads and parses the data files
* `src/server.ts` – MCP server implementation and tool handling
* `tools.ts` – Tool definitions exposed to the agent
* `mcp-client.ts` – Communication layer with the MCP server
* `groq.ts` – LLM integration (tool selection + summarization)
* `agent.ts` – CLI-based agent interface
* `agent-demo.ts` – Keyword-based demo mode (no LLM)
* `web.ts` – Simple browser-based interface
* `vendors.db`, `vulnerabilities.db` – Data sources

---

## Data Handling

The system loads two files at startup:

* `vendors.db`
* `vulnerabilities.db`

The format includes a metadata section describing column structure.
This metadata is parsed dynamically, allowing flexibility if the schema changes in the future.

All data is stored in memory after loading to ensure fast query performance.

---

## Available Tools

The MCP server exposes the following tools:

### 1. `count_open_vulnerabilities`

Returns the total number of vulnerabilities with status `open`.

---

### 2. `get_most_dangerous_vendors`

Ranks vendors by number of open vulnerabilities.

---

### 3. `get_vendor_risk_score`

Calculates a risk score per vendor based on severity levels of vulnerabilities.

---

### 4. `get_vulnerabilities_by_status`

Filters vulnerabilities by status (`open` or `patched`).

---

### 5. `get_vulnerability_by_cve`

Returns a specific vulnerability using its CVE ID.

---

### 6. `get_severity_stats`

Aggregates vulnerabilities by severity (low, medium, high, critical).

---

### 7. `get_vendor_severity_matrix`

Provides a breakdown of severity distribution per vendor.

---

### 8. `search_vulnerabilities`

Supports flexible filtering by:

* CVE ID
* Title keyword
* Vendor name
* Severity
* Status

---

## Running the Project

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

---

## Running Options

### 1. CLI Agent (with Groq)

```bash
npm run agent
```

Then type natural language queries such as:

* "How many open vulnerabilities?"
* "Show severity statistics"
* "Most dangerous vendors"

---

### 2. Demo Mode (no AI)

```bash
npm run demo
```

Uses keyword-based tool selection instead of an LLM.

---

### 3. Web Interface (Browser)

```bash
npm run web
```

Then open:

```
http://localhost:3000
```

This provides a simple UI for asking questions and viewing results in a more user-friendly way compared to the terminal.

---

## Design Decisions

* **Strong typing instead of `any`**
  The implementation initially used `any` for flexibility during early development, but was later refactored to use explicit types for better safety and maintainability.

* **Dynamic metadata parsing**
  The system does not assume a fixed schema and instead reads column definitions from the metadata block in each file.

* **In-memory data storage**
  Data is loaded once at startup to optimize query performance.

* **Switch from Gemini to Groq**
  The initial implementation used Google Gemini, but due to connection and environment-related issues, the integration was replaced with Groq for more stable and responsive tool usage.

* **Separation of concerns**
  The MCP server, agent logic, and UI are clearly separated, allowing easy replacement or extension of each layer.

---

## What I Would Improve With More Time

* **Multi-step tool orchestration**
  Currently, each query maps to a single tool.
  A more advanced agent would support combining multiple tool calls to answer complex questions.

* **More advanced analytical tools**
  For example:

  * Trend analysis of vulnerabilities over time
  * Detection of vendors with increasing risk patterns

* **Generic LLM integration layer**
  Instead of being tied to a specific provider (Groq), the system could support multiple LLM backends through a unified interface.

---

## Summary

This project transforms a legacy text-based vulnerability database into a structured, queryable system that can be accessed through natural language using an AI agent.

It demonstrates:

* MCP server design
* Data parsing and modeling
* Tool-based reasoning
* LLM integration
* Basic UI layer

---
