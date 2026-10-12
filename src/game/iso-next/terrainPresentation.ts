/** Bounded, presentation-only decoding of the server's terrain projection.
 * The client never uses this data to decide collision, combat or travel.
 */
export type IsoTerrainPatch = Readonly<{
  version: 1;
  mapId: string;
  biome: string;
  originX: number;
  originY: number;
  rows: readonly string[];
}>;

export function parseIsoTerrainPatch(value: unknown, expectedMapId: string): IsoTerrainPatch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (p.version !== 1 || p.mapId !== expectedMapId || typeof p.biome !== 'string') return null;
  if (typeof p.originX !== 'number' || typeof p.originY !== 'number' || !Number.isInteger(p.originX) || !Number.isInteger(p.originY)) return null;
  if ((p.originX as number) < 0 || (p.originY as number) < 0) return null;
  if (!Array.isArray(p.rows) || p.rows.length < 1 || p.rows.length > 45) return null;
  const rows = p.rows as unknown[];
  const width = typeof rows[0] === 'string' ? rows[0].length : 0;
  if (width < 1 || width > 45 || !rows.every(row => typeof row === 'string' && row.length === width && /^[gfpwatrslboduh?]+$/.test(row))) return null;
  return {
    version: 1, mapId: expectedMapId, biome: p.biome,
    originX: p.originX as number, originY: p.originY as number,
    rows: rows as string[],
  };
}

const PALETTES: Record<string, Record<string, number>> = {
  plains: { g:0x477548, f:0x837666, p:0xa39373, w:0x615a60, a:0x295d7b, t:0x2b5b37, r:0x676b69, s:0xcedee1, l:0xae5630, b:0x896848, o:0x7e806f, d:0xb99f6d, u:0x35653c, h:0x987956 },
  snow: { g:0x9faeb9, f:0x9ca4aa, p:0xa0a3a6, w:0x617188, a:0x285a7c, t:0x426975, r:0x64778c, s:0xdde6ef, l:0xe17d45, b:0x78685c, o:0x8b9caa, d:0xadb2bb, u:0x6f8789, h:0x796a62 },
  swamp: { g:0x40543b, f:0x5e6748, p:0x676548, w:0x464940, a:0x294e4b, t:0x24452e, r:0x51584a, s:0xaeb7a2, l:0x9b5035, b:0x74644a, o:0x575f51, d:0x8a7f57, u:0x2f5236, h:0x645643 },
  desert: { g:0xa88d5f, f:0xbd9f78, p:0xcaab7d, w:0x705449, a:0x456e77, t:0x6b6845, r:0x81694f, s:0xdfd5bb, l:0xd6572c, b:0x805b3f, o:0x8b7150, d:0xd8b67e, u:0x88814a, h:0x916b4a },
  shadow: { g:0x312d3c, f:0x494257, p:0x62566d, w:0x262535, a:0x273449, t:0x302c47, r:0x454156, s:0x8c88a2, l:0x9c3c54, b:0x52485b, o:0x615b69, d:0x64596b, u:0x393450, h:0x4b4057 },
};
export function isoTileColor(code: string, biome: string): number {
  return (PALETTES[biome] || PALETTES.plains)[code] || 0x6b5870;
}
