import { describe, expect, it } from "vitest";
import { readCollectionDb, writeCollectionDb } from "./collection-db";
import type { CollectionDatabase } from "./types";

describe("collection.db round-trip", () => {
  it("writes then reads back an identical structure", () => {
    const db: CollectionDatabase = {
      version: 20240101,
      collections: [
        {
          name: "Favorites",
          beatmapChecksums: [
            "a".repeat(32),
            "b".repeat(32),
          ],
        },
        {
          name: "Empty collection",
          beatmapChecksums: [],
        },
        {
          name: "unicode ☆ collection 譜面",
          beatmapChecksums: ["c".repeat(32)],
        },
      ],
    };

    const buf = writeCollectionDb(db);
    const roundTripped = readCollectionDb(buf);

    expect(roundTripped).toEqual(db);
  });

  it("produces byte-identical output when re-serialized", () => {
    const db: CollectionDatabase = {
      version: 20240101,
      collections: [{ name: "Test", beatmapChecksums: ["d".repeat(32)] }],
    };

    const first = writeCollectionDb(db);
    const second = writeCollectionDb(readCollectionDb(first));

    expect(second.equals(first)).toBe(true);
  });
});
