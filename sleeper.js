// ============================================================
// data.js - Load rankings data from JSON
// ============================================================
// The rankings file lives at data/rankings-2026.json and is the
// single source of truth for player data. To update rankings,
// edit that file and reload — no code changes needed.

let _cached = null;

export async function loadRankings() {
  if (_cached) return _cached;
  const res = await fetch('data/rankings-2026.json');
  if (!res.ok) throw new Error(`Failed to load rankings: ${res.status}`);
  _cached = await res.json();
  return _cached;
}

export async function getPlayers() {
  const data = await loadRankings();
  return data.players;
}

export async function getSourceMeta() {
  const data = await loadRankings();
  return data.sources;
}

export async function getVersion() {
  const data = await loadRankings();
  return { version: data.version, updated: data.updated, format: data.format };
}
