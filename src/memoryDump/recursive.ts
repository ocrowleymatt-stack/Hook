import { MemoryDumpFile } from "./schema.js";
import { ArchiveManifest, buildArchiveManifest } from "./archive.js";

export type RecursiveArchiveNode = {
  file: MemoryDumpFile;
  depth: number;
  parentArchivePath?: string;
  manifest?: ArchiveManifest;
  children: RecursiveArchiveNode[];
  warnings: string[];
};

export type RecursiveIngestionPlan = {
  root: RecursiveArchiveNode;
  maxDepth: number;
  totalArchives: number;
  quarantinedPaths: string[];
  duplicateHashes: string[];
  warnings: string[];
};

const ARCHIVE_EXTENSIONS = [".zip", ".tar", ".gz", ".tgz", ".7z"];

export function isArchivePath(path: string): boolean {
  const lower = path.toLowerCase();
  return ARCHIVE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function shouldDescend(depth: number, maxDepth: number): boolean {
  return depth < maxDepth;
}

export function buildRecursivePlan(params: {
  rootArchive: MemoryDumpFile;
  internalArchiveListings: Record<string, Array<{ path: string; sizeBytes?: number; modifiedAt?: string; contentHash?: string }>>;
  maxDepth?: number;
}): RecursiveIngestionPlan {
  const maxDepth = params.maxDepth ?? 5;
  const seenHashes = new Set<string>();
  const duplicateHashes: string[] = [];
  const quarantinedPaths: string[] = [];
  const warnings: string[] = [];
  let totalArchives = 0;

  function buildNode(file: MemoryDumpFile, depth: number, parentArchivePath?: string): RecursiveArchiveNode {
    totalArchives += 1;
    const listing = params.internalArchiveListings[file.path] || [];
    const manifest = buildArchiveManifest(file, listing);
    const nodeWarnings = [...manifest.warnings];

    const children: RecursiveArchiveNode[] = [];

    for (const entry of manifest.entries) {
      if (entry.ingestPriority === "quarantine") quarantinedPaths.push(entry.internalPath);
      const listed = listing.find(item => item.path === entry.internalPath);
      if (listed?.contentHash) {
        if (seenHashes.has(listed.contentHash)) duplicateHashes.push(listed.contentHash);
        seenHashes.add(listed.contentHash);
      }

      if (isArchivePath(entry.internalPath) && shouldDescend(depth, maxDepth)) {
        const childFile: MemoryDumpFile = {
          id: `${file.id}:${entry.internalPath}`,
          provider: file.provider,
          path: `${file.path}!/${entry.internalPath}`,
          name: entry.fileName,
          sizeBytes: entry.sizeBytes,
          modifiedAt: entry.modifiedAt,
          contentHash: listed?.contentHash
        };
        children.push(buildNode(childFile, depth + 1, file.path));
      }
    }

    if (depth >= maxDepth && listing.some(item => isArchivePath(item.path))) {
      nodeWarnings.push(`Max archive recursion depth reached at ${file.path}`);
    }

    return { file, depth, parentArchivePath, manifest, children, warnings: nodeWarnings };
  }

  const root = buildNode(params.rootArchive, 0);
  if (duplicateHashes.length) warnings.push("Duplicate content hashes detected");
  if (quarantinedPaths.length) warnings.push("Some entries quarantined");

  return { root, maxDepth, totalArchives, quarantinedPaths, duplicateHashes, warnings };
}
