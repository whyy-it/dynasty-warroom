// ============================================================
// sleeper.js - Sleeper API client
// ============================================================
// Sleeper's API is free, no key required, generous rate limits.
// Docs: https://docs.sleeper.com/
//
// Public read-only endpoints work from the browser (CORS open).
// All functions throw on network failure; callers handle errors.

import { cache } from './state.js';

const BASE = 'https://api.sleeper.app/v1';
const PLAYER_DB_TTL = 24 * 60 * 60 * 1000; // 24h

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sleeper ${res.status}: ${url}`);
  return res.json();
}

// ============================================================
// League info
// ============================================================
export async function getLeague(leagueId) {
  return getJSON(`${BASE}/league/${leagueId}`);
}

export async function getLeagueUsers(leagueId) {
  return getJSON(`${BASE}/league/${leagueId}/users`);
}

export async function getLeagueRosters(leagueId) {
  return getJSON(`${BASE}/league/${leagueId}/rosters`);
}

export async function getLeagueDrafts(leagueId) {
  return getJSON(`${BASE}/league/${leagueId}/drafts`);
}

// ============================================================
// Draft info
// ============================================================
export async function getDraft(draftId) {
  return getJSON(`${BASE}/draft/${draftId}`);
}

export async function getDraftPicks(draftId) {
  return getJSON(`${BASE}/draft/${draftId}/picks`);
}

// ============================================================
// Player database (heavy ~5MB, cache 24h)
// ============================================================
export async function getPlayers() {
  const cached = cache.get('sleeper-players', PLAYER_DB_TTL);
  if (cached) return cached;
  const data = await getJSON(`${BASE}/players/nfl`);
  cache.set('sleeper-players', data);
  return data;
}

// ============================================================
// Build a name lookup from the Sleeper player DB
// Returns: { "normalized name|POS": sleeper_player_id }
// ============================================================
export function buildNameLookup(playersDB) {
  const lookup = {};
  for (const [id, p] of Object.entries(playersDB)) {
    if (!p.full_name && !p.first_name) continue;
    const name = (p.full_name || `${p.first_name} ${p.last_name}`).trim();
    const key = normalizeName(name) + '|' + (p.position || '');
    lookup[key] = id;
    // Also index by name alone for fallback
    if (!lookup[normalizeName(name)]) {
      lookup[normalizeName(name)] = id;
    }
  }
  return lookup;
}

// ============================================================
// Reverse lookup: sleeper_id -> player metadata
// ============================================================
export function getPlayerById(playersDB, id) {
  return playersDB[id] || null;
}

// ============================================================
// Resolve a board player to their Sleeper ID
// ============================================================
export function findSleeperId(lookup, name, pos) {
  const key = normalizeName(name) + '|' + pos;
  if (lookup[key]) return lookup[key];
  // Fallback: name only
  return lookup[normalizeName(name)] || null;
}

// ============================================================
// Normalize name for matching (handles apostrophes, suffixes, etc.)
// ============================================================
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(jr|sr|ii|iii|iv)\.?$/i, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Get the most relevant draft for a league
// (returns the most recent draft, or null if none)
// ============================================================
export async function getCurrentDraft(leagueId) {
  const drafts = await getLeagueDrafts(leagueId);
  if (!drafts || drafts.length === 0) return null;
  // Sort by start_time descending, return the first
  drafts.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
  return drafts[0];
}

// ============================================================
// High-level: full league context bundle
// ============================================================
export async function loadLeagueContext(leagueId) {
  const [league, users, rosters, drafts] = await Promise.all([
    getLeague(leagueId),
    getLeagueUsers(leagueId),
    getLeagueRosters(leagueId),
    getLeagueDrafts(leagueId),
  ]);

  // Build user_id -> username map
  const userMap = {};
  for (const u of users) {
    userMap[u.user_id] = u.display_name || u.username || u.user_id;
  }

  // Build roster_id -> owner username map
  const rosterMap = {};
  for (const r of rosters) {
    rosterMap[r.roster_id] = userMap[r.owner_id] || `Roster ${r.roster_id}`;
  }

  return { league, users, rosters, drafts, userMap, rosterMap };
}
