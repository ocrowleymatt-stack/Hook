export type StorageProvider = "dropbox" | "local" | "s3" | "google_drive";

export type DumpKind = "chatgpt_export" | "google_takeout" | "mixed_archive" | "manual_files";

export type MemoryDumpConfig = {
  id: string;
  provider: StorageProvider;
  dumpKind: DumpKind;
  rootPath: string;
  includePatterns: string[];
  excludePatterns: string[];
  redactSensitive: boolean;
  chunkSizeChars: number;
  indexName: string;
};

export type MemoryDumpFile = {
  id: string;
  provider: StorageProvider;
  path: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  modifiedAt?: string;
  contentHash?: string;
};

export type MemoryChunk = {
  id: string;
  fileId: string;
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
  sourcePath: string;
  createdAt: string;
  tags: string[];
};

export type MemoryIndexRecord = {
  id: string;
  chunkId: string;
  sourcePath: string;
  summary: string;
  entities: string[];
  topics: string[];
  sensitivity: "low" | "medium" | "high" | "restricted";
  searchableText: string;
};

export type MemoryIngestionReport = {
  id: string;
  status: "complete" | "partial" | "failed";
  filesSeen: number;
  filesIndexed: number;
  chunksCreated: number;
  warnings: string[];
  errors: string[];
};
