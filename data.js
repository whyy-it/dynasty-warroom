// ============================================================
// app.js - App shell + simple hash-based router
// ============================================================
// This is the single entry point. It manages navigation between
// views (currently just Draft Board, but the structure supports
// adding Roster, Trade, Waivers, etc. later).

import * as draftBoard from './views/draft-board.js';
import { league } from './state.js';
import * as sleeper from './sleeper.js';

// All views register here. Add new views by adding to this map.
const VIEWS = {
  draft: { label: 'DRAFT', module: draftBoard, enabled: true },
  roster: { label: 'ROSTER', module: null, enabled: false },
  trade:  { label: 'TRADE', module: null, enabled: false },
  waiver: { label: 'WAIVERS', module: null, enabled: false },
  settings: { label: 'SETTINGS', module: settingsView(), enabled: true },
};

let currentView = null;

// ============================================================
// Boot
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  renderNav();
  attachNavEvents();
  await updateLeagueStatus();
  navigateTo(getHash() || 'draft');
  window.addEventListener('hashchange', () => navigateTo(getHash()));
});

function getHash() {
  return (location.hash || '').replace(/^#/, '');
}

function navigateTo(viewKey) {
  if (!VIEWS[viewKey] || !VIEWS[viewKey].enabled) {
    if (viewKey === 'roster' || viewKey === 'trade' || viewKey === 'waiver') {
      mountComingSoon(viewKey);
      setActiveNav(viewKey);
      return;
    }
    viewKey = 'draft';
  }

  // Teardown current view
  if (currentView && VIEWS[currentView] && VIEWS[currentView].module && VIEWS[currentView].module.teardown) {
    VIEWS[currentView].module.teardown();
  }

  currentView = viewKey;
  setActiveNav(viewKey);

  const container = document.getElementById('view-container');
  container.innerHTML = '';
  const view = VIEWS[viewKey];
  if (view.module && view.module.init) {
    view.module.init(container);
  }

  if (location.hash !== '#' + viewKey) location.hash = viewKey;
}

function mountComingSoon(viewKey) {
  const container = document.getElementById('view-container');
  const labels = { roster: 'Roster Analyzer', trade: 'Trade Analyzer', waiver: 'Waiver Wire Targets' };
  container.innerHTML = `
    <div class="coming-soon">
      <h2>${labels[viewKey] || 'COMING SOON'}</h2>
      <p>This tool is on the roadmap.<br>For now, focus on the draft board.</p>
    </div>
  `;
}

// ============================================================
// Nav
// ============================================================
function renderNav() {
  const nav = document.getElementById('app-nav');
  nav.innerHTML = `
    <div class="brand">DYNASTY <span class="accent">/</span> WAR ROOM</div>
    <button class="nav-tab" data-view="draft">DRAFT</button>
    <button class="nav-tab" data-view="roster">ROSTER</button>
    <button class="nav-tab" data-view="trade">TRADE</button>
    <button class="nav-tab" data-view="waiver">WAIVERS</button>
    <button class="nav-tab" data-view="settings">⚙</button>
    <div class="nav-status" id="nav-status">
      <span class="dot"></span>
      <span id="nav-status-text">no league</span>
    </div>
  `;
}

function attachNavEvents() {
  document.getElementById('app-nav').addEventListener('click', (e) => {
    const tab = e.target.closest('.nav-tab');
    if (!tab) return;
    navigateTo(tab.dataset.view);
  });
}

function setActiveNav(viewKey) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === viewKey);
  });
}

async function updateLeagueStatus() {
  const cfg = league.load();
  const dot = document.querySelector('#nav-status .dot');
  const txt = document.getElementById('nav-status-text');
  if (!cfg.leagueId) {
    dot.className = 'dot warn';
    txt.textContent = 'no league';
    return;
  }
  // Try to fetch league name
  try {
    const ctx = await sleeper.getLeague(cfg.leagueId);
    dot.className = 'dot live';
    txt.textContent = (ctx.name || 'league').substring(0, 24);
  } catch {
    dot.className = 'dot warn';
    txt.textContent = 'league error';
  }
}

// ============================================================
// Settings view (inline since it's small)
// ============================================================
function settingsView() {
  let container = null;

  function template(cfg) {
    return `
      <div style="padding:16px;">
        <h2 style="font-family:'Bebas Neue',sans-serif; letter-spacing:.06em; margin:8px 0 18px;">SETTINGS</h2>
        <div class="sources-pill">
          <h4>SLEEPER LEAGUE SYNC</h4>
          <div class="form-group">
            <label>League ID</label>
            <input id="cfg-league-id" class="form-input" value="${cfg.leagueId || ''}" placeholder="e.g. 1362230787730079744">
          </div>
          <div class="form-group">
            <label>Your roster ID in this league (optional, helps mark your picks)</label>
            <input id="cfg-roster-id" class="form-input" value="${cfg.rosterId || ''}" placeholder="e.g. 1, 2, 3…">
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="cfg-auto-sync" ${cfg.autoSync ? 'checked' : ''}>
              Auto-poll for picks during live draft (every 10s)
            </label>
          </div>
          <button class="modal-btn primary" id="cfg-save">SAVE</button>
          <button class="modal-btn" id="cfg-fetch-info" style="margin-top:8px;">FETCH LEAGUE INFO</button>
          <div id="cfg-result" style="margin-top:12px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-dim);"></div>
        </div>
        <div class="roster-pill">
          <h4>HOW TO FIND YOUR LEAGUE ID</h4>
          On sleeper.com, open your league. The URL looks like:<br>
          <code style="color:var(--accent);">sleeper.com/leagues/<b>1362230787730079744</b>/team</code><br>
          The bold number is your league ID.
        </div>
        <div class="roster-pill">
          <h4>STORAGE & PRIVACY</h4>
          All your settings and draft state live in your browser's localStorage. Nothing is sent to any server (besides public read-only Sleeper API calls). Clearing your browser data clears the app.
        </div>
      </div>
    `;
  }

  async function fetchInfo() {
    const cfg = league.load();
    const result = document.getElementById('cfg-result');
    if (!cfg.leagueId) {
      result.innerHTML = '<span style="color:var(--warn)">Save a league ID first.</span>';
      return;
    }
    result.textContent = 'Fetching…';
    try {
      const ctx = await sleeper.loadLeagueContext(cfg.leagueId);
      const lines = [];
      lines.push(`League: ${ctx.league.name}`);
      lines.push(`Season: ${ctx.league.season} · Status: ${ctx.league.status}`);
      lines.push(`Teams: ${ctx.users.length}`);
      lines.push('');
      lines.push('ROSTERS:');
      for (const r of ctx.rosters) {
        const owner = ctx.userMap[r.owner_id] || '—';
        lines.push(`  ${r.roster_id}: ${owner}`);
      }
      if (ctx.drafts && ctx.drafts.length) {
        lines.push('');
        lines.push('DRAFTS:');
        for (const d of ctx.drafts) {
          lines.push(`  ${d.draft_id} · ${d.status} · ${d.type}`);
        }
      }
      result.innerHTML = '<pre style="white-space:pre-wrap;">' + lines.map(l => l.replace(/</g, '&lt;')).join('\n') + '</pre>';
    } catch (e) {
      result.innerHTML = '<span style="color:var(--warn)">Error: ' + e.message + '</span>';
    }
  }

  return {
    init(c) {
      container = c;
      container.innerHTML = template(league.load());
      document.getElementById('cfg-save').addEventListener('click', () => {
        const cfg = league.load();
        cfg.leagueId = document.getElementById('cfg-league-id').value.trim() || null;
        cfg.rosterId = document.getElementById('cfg-roster-id').value.trim() || null;
        cfg.autoSync = document.getElementById('cfg-auto-sync').checked;
        league.save(cfg);
        document.getElementById('cfg-result').innerHTML = '<span style="color:var(--success)">Saved.</span>';
        updateLeagueStatus();
      });
      document.getElementById('cfg-fetch-info').addEventListener('click', fetchInfo);
    },
    teardown() { container = null; },
  };
}
