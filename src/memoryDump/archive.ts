import { MemoryDumpFile } from "./schema.js";

export type ArchiveManifestEntry = {
  archivePath: string;
  internalPath: string;
  fileName: string;
  extension: string;
  sizeBytes?: number;
  modifiedAt?: string;
  isMetadata: boolean;
  ingestPriority: "high" | "medium" | "low" | "quarantine";
};

export type ArchiveManifest = {
  archiveFile: MemoryDumpFile;
  entries: ArchiveManifestEntry[];
  warnings: string[];
};

const METADATA_NAMES = new Set([
  "metadata.json",
  "manifest.json",
  "takeout.json",
  "index.json",
  "records.json",
  "subscriptions.json",
  "browser-history.json",
  "watch-history.json",
  "search-history.json"
]);

const HIGH_VALUE_EXTENSIONS = new Set([".json", ".html", ".txt", ".md", ".csv", ".eml", ".mbox"]);
const LOW_VALUE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".heic", ".webp"]);

export function classifyArchiveEntry(archivePath: string, internalPath: string, sizeBytes?: number): ArchiveManifestEntry {
  const fileName = internalPath.split("/").pop() || internalPath;
  const lower = fileName.toLowerCase();
  const extension = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  const isMetadata = METADATA_NAMES.has(lower) || lower.includes("metadata") || lower.includes("manifest");

  let ingestPriority: ArchiveManifestEntry["ingestPriority"] = "medium";

  if (isMetadata) ingestPriority = "high";
  else if (HIGH_VALUE_EXTENSIONS.has(extension)) ingestPriority = "high";
  else if (LOW_VALUE_EXTENSIONS.has(extension)) ingestPriority = "low";
  else if (sizeBytes && sizeBytes > 50_000_000) ingestPriority = "quarantine";

  return { archivePath, internalPath, fileName, extension, sizeBytes, isMetadata, ingestPriority };
}

export function buildArchiveManifest(archiveFile: MemoryDumpFile, internalPaths: Array<{ path: string; sizeBytes?: number; modifiedAt?: string }>): ArchiveManifest {
  const entries = internalPaths.map(item => ({
    ...classifyArchiveEntry(archiveFile.path, item.path, item.sizeBytes),
    modifiedAt: item.modifiedAt
  }));

  const warnings: string[] = [];
  if (!entries.some(e => e.isMetadata)) warnings.push("No obvious metadata or manifest file found in archive");
  if (entries.some(e => e.ingestPriority === "quarantine")) warnings.push("Some archive entries were quarantined due to size or unsupported type");

  return { archiveFile, entries, warnings };
}
