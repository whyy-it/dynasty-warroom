// ============================================================
// state.js - Persistent state management via localStorage
// ============================================================
// All app state lives here. Views read from it and write to it
// through the exported API. Anything saved here survives page
// reloads and is per-browser (not synced across devices).

const NAMESPACE = 'dynasty-warroom';
const VERSION = '1';

function key(name) {
  return `${NAMESPACE}:${VERSION}:${name}`;
}

function read(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`state.read(${name}) failed:`, e);
    return fallback;
  }
}

function write(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`state.write(${name}) failed:`, e);
    return false;
  }
}

// ============================================================
// Board state: which players are marked drafted/mine
// ============================================================
export const board = {
  load() {
    return read('board', {
      drafted: {},   // { rank: true } - drafted by someone else
      mine: {},      // { rank: true } - your pick
      draftedBy: {}, // { rank: "username" } - who drafted them (from Sleeper)
    });
  },
  save(state) {
    return write('board', state);
  },
  markMine(state, rank) {
    state.mine[rank] = true;
    delete state.drafted[rank];
    delete state.draftedBy[rank];
    this.save(state);
  },
  markDrafted(state, rank, byUser = null) {
    state.drafted[rank] = true;
    delete state.mine[rank];
    if (byUser) state.draftedBy[rank] = byUser;
    this.save(state);
  },
  restore(state, rank) {
    delete state.drafted[rank];
    delete state.mine[rank];
    delete state.draftedBy[rank];
    this.save(state);
  },
  reset() {
    return write('board', { drafted: {}, mine: {}, draftedBy: {} });
  },
};

// ============================================================
// League config: Sleeper league ID, your user ID, settings
// ============================================================
export const league = {
  load() {
    return read('league', {
      leagueId: null,
      userId: null,        // your Sleeper user_id
      username: null,
      rosterId: null,      // your roster_id in this league
      lastSynced: null,
      autoSync: false,     // poll the draft for picks?
    });
  },
  save(config) {
    return write('league', config);
  },
  clear() {
    return write('league', {
      leagueId: null, userId: null, username: null,
      rosterId: null, lastSynced: null, autoSync: false,
    });
  },
};

// ============================================================
// Cache: Sleeper player DB and other heavy fetches
// ============================================================
export const cache = {
  get(name, maxAgeMs) {
    const entry = read(`cache:${name}`, null);
    if (!entry) return null;
    if (maxAgeMs && Date.now() - entry.ts > maxAgeMs) return null;
    return entry.data;
  },
  set(name, data) {
    return write(`cache:${name}`, { ts: Date.now(), data });
  },
  clear(name) {
    localStorage.removeItem(key(`cache:${name}`));
  },
};

// ============================================================
// UI prefs: filter state, search, last tab, etc.
// ============================================================
export const ui = {
  load() {
    return read('ui', { filter: 'ALL', search: '', tab: 'draft' });
  },
  save(s) {
    return write('ui', s);
  },
};
