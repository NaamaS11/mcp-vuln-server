# Vulnerability Analysis MCP Server

## Overview

This project implements a Model Context Protocol (MCP) server in TypeScript that provides structured access to a legacy vulnerability database stored in custom pipe-delimited text files.

The system enables querying, filtering, and analyzing security vulnerabilities through well-defined tools that can be used by any MCP-compatible client, including LLM-based agents.

An additional agent layer enables natural language interaction via a CLI interface and a simple web interface.

---

## Project Structure

src/index.ts – Data loading and parsing  
src/server.ts – MCP server implementation and tool exposure  
tools.ts – Tool definitions  
mcp-client.ts – Communication layer between agent and MCP server  
groq.ts – LLM integration  
agent.ts – CLI-based agent interface  
agent-demo.ts – Demo mode without LLM  
web.ts – HTTP server for the web interface  
index.html – Web UI (separated from server logic)  
vendors.db – Vendor data source  
vulnerabilities.db – Vulnerability data source  

---

## Data Handling

The system loads two data files at startup:

- vendors.db  
- vulnerabilities.db  

Each file includes a metadata section describing its structure (column names and order).

This metadata is parsed dynamically, allowing the system to adapt to schema changes without requiring code changes.

After parsing, all data is stored in memory to ensure fast query performance.

---

## Data Processing Approach

- Files are parsed generically using metadata instead of hardcoded field positions  
- Each row is transformed into a structured object dynamically  
- Relationships between datasets (e.g., vendor_id → vendor) are resolved at query time  
- Data is normalized during parsing (trimming whitespace, consistent field naming)  

---

## Available Tools

count_open_vulnerabilities  
Returns the total number of vulnerabilities with status open  

get_most_dangerous_vendors  
Ranks vendors by number of open vulnerabilities  

get_vendor_risk_score  
Calculates a risk score per vendor based on severity levels  

get_vulnerabilities_by_status  
Filters vulnerabilities by status (open / patched)  

get_vulnerability_by_cve  
Retrieves a vulnerability by its CVE ID  

get_severity_stats  
Aggregates vulnerabilities by severity (low, medium, high, critical)  

get_vendor_severity_matrix  
Provides severity distribution per vendor  

search_vulnerabilities  
Supports filtering by:
- CVE ID  
- Title keyword  
- Vendor name  
- Severity  
- Status  

---

## Installation

npm install

---

## Build

npm run build

---

## Running the Project

CLI Agent:  
npm run agent  

Example queries:

How many open vulnerabilities?  
Show severity statistics  
Most dangerous vendors  
Find vulnerabilities related to Linux  

---

Demo Mode:  
npm run demo  

Uses keyword-based tool selection without an LLM.

---

Web Interface:  
npm run web  

Open in browser:  
http://localhost:3000  

---

## MCP Server

The MCP server exposes structured tools that allow external clients, including LLM-based agents, to query the vulnerability database.

The server communicates over stdio transport and follows the MCP protocol for tool discovery and execution.

---

## Design Decisions

Strong typing  
Explicit TypeScript types improve safety and maintainability  

Dynamic metadata parsing  
Schema is derived from metadata instead of being hardcoded  

In-memory storage  
Data is loaded once at startup for fast queries  

Separation of concerns  
Clear separation between data, logic, server, and interface layers  

---

## Future Improvements

Support multi-step tool orchestration  
Add advanced analytics (trend analysis, anomaly detection)  
Introduce abstraction for multiple LLM providers  
Improve search capabilities (fuzzy matching, ranking)  
Enhance UI with better visualization  

---

## Summary

This project transforms a legacy text-based vulnerability database into a structured, queryable system accessible through both programmatic tools and natural language queries.

It demonstrates:

MCP server design  
Dynamic data parsing  
Tool-based querying  
LLM integration  
Layered architecture  