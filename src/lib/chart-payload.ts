export type ChartBarItem = { name: string; value: number };

export type ChartPayload = {
  data: Record<string, string | number>[];
  categories: string[];
  index: string;
};

/** Single-row category charts → horizontal bars (largest first). */
export function payloadToBarItems(payload: ChartPayload): ChartBarItem[] {
  const row = payload.data[0];
  if (!row) return [];

  return payload.categories
    .map((name) => ({ name, value: Number(row[name]) || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Multi-row charts (e.g. by month) — keep as Recharts rows. */
export function payloadToSeriesRows(payload: ChartPayload): Record<string, string | number>[] {
  return payload.data.map((row) => {
    const out: Record<string, string | number> = {
      [payload.index]: row[payload.index],
    };
    for (const cat of payload.categories) {
      out[cat] = Number(row[cat]) || 0;
    }
    return out;
  });
}
