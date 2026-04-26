import fs from "node:fs";


function parseFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");

  const lines = raw.split(/\r?\n/);

  const metadataLines = lines.filter(l => l.trimStart().startsWith("#"));
  const dataLines = lines.filter(
    l => !l.trimStart().startsWith("#") && l.trim() !== ""
  );

  return { metadataLines, dataLines };
}



function parseMetadata(metadataLines: string[]) {
  const formatLine = metadataLines.find(l =>
    l.trim().startsWith("# FORMAT:")
  );

  const versionLine = metadataLines.find(l =>
    l.trim().startsWith("# VERSION:")
  );

  if (!formatLine) throw new Error("Missing FORMAT");
  if (!versionLine) throw new Error("Missing VERSION");

  const fields = formatLine.split(":")[1]!.trim().split("|");
  const version = versionLine.split(":")[1]!.trim();

  return { fields, version };
}



function parseData(lines: string[], fields: string[]) {
  return lines.map(line => {
    const values = line.split("|");

    if (values.length !== fields.length) {
      throw new Error(
        `Invalid row: expected ${fields.length} fields, got ${values.length}`
      );
    }

    const obj: Record<string, string> = {};

    for (let i = 0; i < fields.length; i++) {
      obj[fields[i]!.trim()] = values[i]!.trim();
    }

    return obj;
  });
}



type Row = Record<string, string>;

const db: Record<string, Row[]> = {};

function loadTable(name: string, file: string) {
  const parsed = parseFile(file);

  const { fields, version } = parseMetadata(parsed.metadataLines);

  db[name] = parseData(parsed.dataLines, fields);

  console.log(`Loaded ${name} (version ${version})`);
}



loadTable("vendors", "vendors.db");
loadTable("vulnerabilities", "vulnerabilities.db");

if (!Array.isArray(db["vendors"])) {
  throw new Error("Invalid vendors DB format");
}

if (!Array.isArray(db["vulnerabilities"])) {
  throw new Error("Invalid vulnerabilities DB format");
}

export { db };