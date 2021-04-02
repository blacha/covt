import { ChunkSource, LogType } from '@cogeotiff/chunk';
import { TarIndex, TarIndexRecord } from './tar.index';
import { xyzToPath } from './tile.name';

const utf8Decoder = new TextDecoder('utf-8');

export class Covt {
  source: ChunkSource;
  sourceIndex: ChunkSource;

  index: Map<string, TarIndexRecord> = new Map();

  constructor(source: ChunkSource, sourceIndex: ChunkSource) {
    this.source = source;
    this.sourceIndex = sourceIndex;
  }

  protected async loadIndex(): Promise<Covt> {
    const bytes = await this.sourceIndex.read();
    console.time('LoadIndex:Parse');
    const index = JSON.parse(utf8Decoder.decode(bytes)) as TarIndex;
    console.timeEnd('LoadIndex:Parse');

    console.time('LoadIndex:Map');
    for (const r of index) this.index.set(r[0], r);
    console.timeEnd('LoadIndex:Map');

    return this;
  }

  static async create(source: ChunkSource, sourceIndex: ChunkSource): Promise<Covt> {
    return new Covt(source, sourceIndex).loadIndex();
  }

  async getTile(
    x: number,
    y: number,
    z: number,
    l?: LogType,
  ): Promise<null | { buffer: ArrayBuffer; contentType: 'application/gzip' }> {
    const tileName = xyzToPath(x, y, z);

    const index = this.index.get(tileName);
    if (index == null) return null;

    const [, offset, size] = index;
    await this.source.loadBytes(offset, size, l);
    const buffer = this.source.bytes(offset, size);

    return { buffer, contentType: 'application/gzip' };
  }
}
