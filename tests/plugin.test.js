// memory.md — test suite. Run: node --test tests/*.test.js
// Uses real OS tools (grep/sed/which) against a fixture memory tree.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { getMemoryInstructions } = require('../hooks/memory-instructions');
const { createMemoryRecallTool, findMemoryRoot, parseGuide } = require('../hooks/memory-tool');
const { parseCommandFile } = require('../hooks/command-file');

// --- fixture tree -----------------------------------------------------------

function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-md-test-'));
  fs.mkdirSync(path.join(dir, '.memory', 'core'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.memory', 'context'), { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'MEMORY.md'),
    ['# Project Memory', '', '## Core Memory Index', '', '- [stack](.memory/core/stack.md) — Current stack: Postgres + Node'].join('\n') + '\n',
  );

  fs.writeFileSync(
    path.join(dir, '.memory', 'core', 'stack.md'),
    ['# Stack', '', 'type: core', 'tags: #stack #db', '', 'Stack: Node + Postgres 16.', '', 'Context reference: context/api-design.md#L41-L65'].join('\n') + '\n',
  );

  // line numbers must match the guide claims below
  const api = Array(70).fill('');
  api[0] = '<!-- @guide 2-15 -->';
  api[1] = '# API Design Context';
  api[3] = '## Guide';
  api[4] = '- Database layer: lines 16-40';
  api[5] = '- Endpoints: lines 41-65';
  api[15] = '## Database layer'; // line 16
  api[16] = 'Uses Postgres 16 as the primary store.'; // line 17
  api[40] = '## Endpoints'; // line 41
  api[41] = 'GET /users'; // line 42
  fs.writeFileSync(path.join(dir, '.memory', 'context', 'api-design.md'), api.join('\n') + '\n');
  return dir;
}

function toolFor(dir) {
  return createMemoryRecallTool();
}

// --- instructions vs AGENTS.md ----------------------------------------------

test('AGENTS.md matches getMemoryInstructions()', () => {
  const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8').trim();
  assert.strictEqual(getMemoryInstructions().trim(), agents);
});

// --- command files ----------------------------------------------------------

test('all command files parse to { description, template }', () => {
  const commandDir = path.join(ROOT, '.opencode', 'command');
  const files = fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length >= 3, 'expected at least 3 commands');
  for (const file of files) {
    const parsed = parseCommandFile(path.join(commandDir, file));
    assert.ok(parsed, `${file} must parse`);
    assert.ok(parsed.description, `${file} needs a description`);
    assert.ok(parsed.template.length > 20, `${file} needs a real template`);
  }
});

test('plugin module exports no functions besides default', async () => {
  // The legacy plugin loader calls every function export as a plugin instance;
  // a stray helper export (like the old parseCommandFile) throws and kills
  // all registration. Guard against it.
  const mod = await import('../.opencode/plugins/memory.md.mjs');
  for (const [name, value] of Object.entries(mod)) {
    if (name === 'default') continue;
    assert.ok(typeof value !== 'function', `named export "${name}" must not be a function`);
  }
});

test('config hook: without MEMORY.md only /memory is registered', async () => {
  const { default: plugin } = await import('../.opencode/plugins/memory.md.mjs');
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-md-bare-'));
  const config = {};
  await plugin({ directory: bare }).then((p) => p.config(config));
  assert.deepStrictEqual(Object.keys(config.command).sort(), ['memory']);
  assert.strictEqual(config.skills, undefined, 'no skills path without MEMORY.md');
  fs.rmSync(bare, { recursive: true, force: true });
});

test('config hook: with MEMORY.md the full suite is registered', async () => {
  const { default: plugin } = await import('../.opencode/plugins/memory.md.mjs');
  const dir = makeFixture();
  const config = {};
  await plugin({ directory: dir }).then((p) => p.config(config));
  assert.deepStrictEqual(Object.keys(config.command).sort(), ['memory', 'memory-help', 'memory-remember']);
  assert.ok(config.skills.paths.some((p) => p.endsWith('skills')), 'skills dir registered');
  fs.rmSync(dir, { recursive: true, force: true });
});

// --- memory_recall tool -----------------------------------------------------

test('search: index, core contents, context guide and hit windows', async () => {
  const dir = makeFixture();
  const out = await toolFor(dir).execute({ query: 'postgres' }, { directory: dir });

  assert.match(out, /# memory_recall: "postgres"/);
  assert.match(out, /## index \(MEMORY\.md\)/);
  assert.match(out, /\[stack\]\(\.memory\/core\/stack\.md\)/);
  assert.match(out, /## core matches \(read in full\)/);
  assert.match(out, /Stack: Node \+ Postgres 16\./);
  assert.match(out, /## context matches/);
  assert.match(out, /guide 2-15/);
  assert.match(out, /GUIDE:/);
  assert.match(out, /- Database layer: lines 16-40/);
  assert.match(out, /L14-L20:/);
  assert.match(out, /Uses Postgres 16 as the primary store\./);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('search with no hits still shows the index', async () => {
  const dir = makeFixture();
  const out = await toolFor(dir).execute({ query: 'zzzz-not-there' }, { directory: dir });
  assert.match(out, /## no matches anywhere/);
  assert.match(out, /## index \(MEMORY\.md\)/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('range fetch returns exactly the requested lines', async () => {
  const dir = makeFixture();
  const out = await toolFor(dir).execute({ query: 'api-design.md#L41-L42' }, { directory: dir });
  assert.match(out, /#L41-L42/);
  assert.match(out, /## Endpoints/);
  assert.match(out, /GET \/users/);
  assert.doesNotMatch(out, /Postgres 16 as the primary store/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('range fetch refuses paths that escape the memory dir', async () => {
  const dir = makeFixture();
  const out = await toolFor(dir).execute({ query: '../MEMORY.md#L1-L2' }, { directory: dir });
  assert.match(out, /refusing/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('no memory system: explains and points at /memory', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-md-noroot-'));
  const out = await toolFor(dir).execute({ query: 'postgres' }, { directory: dir });
  assert.match(out, /no memory system/);
  assert.match(out, /\/memory/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('findMemoryRoot walks up to MEMORY.md', () => {
  const dir = makeFixture();
  const nested = path.join(dir, 'src', 'deep', 'deeper');
  fs.mkdirSync(nested, { recursive: true });
  assert.strictEqual(findMemoryRoot(nested), dir);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('parseGuide reads the pointer on line 1', () => {
  assert.deepStrictEqual(parseGuide('<!-- @guide 2-15 -->'), { start: 2, end: 15 });
  assert.strictEqual(parseGuide('# no pointer here'), null);
});
