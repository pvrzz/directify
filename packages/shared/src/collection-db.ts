import type { Collection, CollectionDatabase } from "./types";

/**
 * Reader/writer for osu!stable's `collection.db`.
 *
 * Format (little-endian):
 *   int32   version
 *   int32   collection count
 *   for each collection:
 *     string  name
 *     int32   beatmap count
 *     for each beatmap:
 *       string  beatmap (.osu) MD5 checksum
 *
 * osu!-strings are a single marker byte (0x00 = null, 0x0b = present)
 * followed, when present, by a ULEB128-encoded byte length and the UTF-8 bytes.
 */

const STRING_NULL = 0x00;
const STRING_PRESENT = 0x0b;

class ByteReader {
  private offset = 0;
  constructor(private readonly buf: Buffer) {}

  get bytesRemaining(): number {
    return this.buf.length - this.offset;
  }

  readInt32(): number {
    const value = this.buf.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readByte(): number {
    const value = this.buf.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  private readUleb128(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.readByte();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return result;
  }

  readString(): string | null {
    const marker = this.readByte();
    if (marker === STRING_NULL) return null;
    if (marker !== STRING_PRESENT) {
      throw new Error(`Unexpected osu!-string marker byte 0x${marker.toString(16)}`);
    }
    const length = this.readUleb128();
    const value = this.buf.toString("utf8", this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
}

class ByteWriter {
  private chunks: Buffer[] = [];

  writeInt32(value: number): this {
    const b = Buffer.alloc(4);
    b.writeInt32LE(value, 0);
    this.chunks.push(b);
    return this;
  }

  writeByte(value: number): this {
    this.chunks.push(Buffer.from([value]));
    return this;
  }

  private writeUleb128(value: number): this {
    const bytes: number[] = [];
    let v = value;
    do {
      let byte = v & 0x7f;
      v >>>= 7;
      if (v !== 0) byte |= 0x80;
      bytes.push(byte);
    } while (v !== 0);
    this.chunks.push(Buffer.from(bytes));
    return this;
  }

  writeString(value: string | null | undefined): this {
    if (value === null || value === undefined) {
      return this.writeByte(STRING_NULL);
    }
    this.writeByte(STRING_PRESENT);
    const utf8 = Buffer.from(value, "utf8");
    this.writeUleb128(utf8.length);
    this.chunks.push(utf8);
    return this;
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

export function readCollectionDb(buf: Buffer): CollectionDatabase {
  const reader = new ByteReader(buf);
  const version = reader.readInt32();
  const collectionCount = reader.readInt32();

  const collections: Collection[] = [];
  for (let i = 0; i < collectionCount; i++) {
    const name = reader.readString() ?? "";
    const beatmapCount = reader.readInt32();
    const beatmapChecksums: string[] = [];
    for (let j = 0; j < beatmapCount; j++) {
      const checksum = reader.readString();
      if (checksum) beatmapChecksums.push(checksum);
    }
    collections.push({ name, beatmapChecksums });
  }

  return { version, collections };
}

export function writeCollectionDb(db: CollectionDatabase): Buffer {
  const writer = new ByteWriter();
  writer.writeInt32(db.version);
  writer.writeInt32(db.collections.length);

  for (const collection of db.collections) {
    writer.writeString(collection.name);
    writer.writeInt32(collection.beatmapChecksums.length);
    for (const checksum of collection.beatmapChecksums) {
      writer.writeString(checksum);
    }
  }

  return writer.toBuffer();
}
