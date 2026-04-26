import fs from "node:fs";

type Row = Record<string, string>;

type TableMetadata = {
  fields: string[];
  version: string;
};

const db: Record<string, Row[]> = {};
const metadata: Record<string, TableMetadata> = {};

function parseFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const metadataLines = lines.filter(line =>
    line.trimStart().startsWith("#")
  );

  const dataLines = lines.filter(
    line => !line.trimStart().startsWith("#") && line.trim() !== ""
  );

  return { metadataLines, dataLines };
}

function parseMetadata(metadataLines: string[]): TableMetadata {
  const formatLine = metadataLines.find(line =>
    line.trim().startsWith("# FORMAT:")
  );

  const versionLine = metadataLines.find(line =>
    line.trim().startsWith("# VERSION:")
  );

  if (!formatLine) {
    throw new Error("Missing FORMAT metadata");
  }

  if (!versionLine) {
    throw new Error("Missing VERSION metadata");
  }

  const fields = formatLine.split(":")[1]!.trim().split("|");
  const version = versionLine.split(":")[1]!.trim();

  return { fields, version };
}

function parseData(lines: string[], fields: string[]): Row[] {
  return lines.map(line => {
    const values = line.split("|");

    if (values.length !== fields.length) {
      throw new Error(
        `Invalid row: expected ${fields.length} fields, got ${values.length}`
      );
    }

    const row: Row = {};

    for (let i = 0; i < fields.length; i++) {
      const fieldName = fields[i]!.trim();
      const value = values[i]!.trim();

      const normalizedField =
        fieldName === "cve_id" ? "cveId" : fieldName;

      row[normalizedField] = value;
    }

    return row;
  });
}

function loadTable(name: string, filePath: string) {
  const parsed = parseFile(filePath);
  const tableMetadata = parseMetadata(parsed.metadataLines);

  metadata[name] = tableMetadata;
  db[name] = parseData(parsed.dataLines, tableMetadata.fields);
}

loadTable("vendors", "vendors.db");
loadTable("vulnerabilities", "vulnerabilities.db");

if (!Array.isArray(db.vendors)) {
  throw new Error("Invalid vendors DB format");
}

if (!Array.isArray(db.vulnerabilities)) {
  throw new Error("Invalid vulnerabilities DB format");
}

export { db, metadata };