// memory.md — the memory_recall tool implementation (Linux only).
//
// Browses the project memory with OS default tools: ripgrep when found,
// else grep -rn; sed for line ranges; no shell involved (execFile with arg
// arrays, so queries and paths can never inject). OpenCode plugins run under
// bun, which implements node:child_process, so this works in both worlds.

const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileP = promisify(execFile);
const CORE_LIMIT = 200; // a core file is read to this many lines max
const WINDOW = 3; // lines of context pulled around a grep hit
const RANGE_RE = /^(.+)#L(\d+)-L(\d+)$/;

function findMemoryRoot(dir) {
  let d = path.resolve(dir || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(d, 'MEMORY.md'))) return d;
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
}

async function defaultRun(file, args, opts = {}) {
  try {
    const { stdout } = await execFileP(file, args, { maxBuffer: 8 * 1024 * 1024, ...opts });
    return { code: 0, stdout };
  } catch (e) {
    return { code: typeof e.code === 'number' ? e.code : 1, stdout: e.stdout || '' };
  }
}

async function hasBin(run, bin) {
  const r = await run('which', [bin]);
  return r.code === 0 && r.stdout.trim() !== '';
}

function parseGuide(stdout) {
  const m = stdout.match(/<!--\s*@guide\s+(\d+)-(\d+)\s*-->/);
  return m ? { start: +m[1], end: +m[2] } : null;
}

function within(dir, file) {
  const resolved = path.resolve(dir, file);
  return resolved.startsWith(dir + path.sep) ? resolved : null;
}

function createMemoryRecallTool({ run = defaultRun } = {}) {
  return {
    description:
      "Browse this project's memory.md system: search MEMORY.md, core memories, and context files; show context guides; fetch exact line ranges from context files. Start here for anything that may already be remembered. Pass a topic, or a precise range like api-design.md#L41-L65 to fetch only those lines. Linux only.",
    args: {
      query: {
        type: 'string',
        description:
          'Topic to search for, or an exact range fetch: context-file.md#Lstart-Lend (e.g. api-design.md#L41-L65).',
      },
    },
    async execute(args, context) {
      if (process.platform !== 'linux') {
        return '# memory_recall: Linux only (for now).';
      }

      const root = findMemoryRoot(context && context.directory);
      if (!root) {
        return (
          '# memory_recall: no memory system in this project (no MEMORY.md found walking up from ' +
          (context && context.directory ? context.directory : process.cwd()) +
          ').\n' +
          'Run /memory-init to create one (scans the project and builds the core memories).'
        );
      }

      const query = String((args && args.query) || '').trim();
      if (RANGE_RE.test(query)) return rangeFetch(root, query, run);
      return search(root, query, run);
    },
  };
}

// --- exact range fetch: context-file.md#L41-L65 ---

async function rangeFetch(root, query, run) {
  const [, file, s, e] = query.match(RANGE_RE);
  const start = +s;
  const end = +e;
  const target = within(path.join(root, '.memory', 'context'), file) || within(path.join(root, '.memory', 'core'), file);
  if (!target) return `# memory_recall: refusing "${file}" — path escapes the memory directory.`;
  if (start < 1 || start > end) return `# memory_recall: invalid range ${start}-${end}.`;

  const r = await run('sed', ['-n', `${start},${end}p`, target]);
  return (
    `# memory_recall: ${path.relative(root, target)}#L${start}-L${end}\n\n` +
    (r.stdout.trim() || `(lines ${start}-${end} are empty or out of bounds)`)
  );
}

// --- topic search: index + cores + context guides/hit windows ---

async function search(root, query, run) {
  const memory = path.join(root, '.memory');
  const coreDir = path.join(memory, 'core');
  const contextDir = path.join(memory, 'context');

  const out = [`# memory_recall: "${query}"`, `Root: ${root}`, ''];

  // 1. The index first: MEMORY.md is the map of all core memories.
  const index = await run('sed', ['-n', '1,100p', path.join(root, 'MEMORY.md')]);
  out.push('## index (MEMORY.md)');
  out.push(index.stdout.trim() || '(empty)');
  out.push('');

  if (!fs.existsSync(memory)) return out.join('\n') + '# .memory/ is missing — run /memory-init.';

  // 2. Pick the grep engine. Relative paths + cwd: root so hits parse cleanly.
  const engine = (await hasBin(run, 'rg')) ? 'rg' : 'grep';
  const dirs = [coreDir, contextDir].filter((d) => fs.existsSync(d)).map((d) => path.relative(root, d));
  const args =
    engine === 'rg'
      ? ['-n', '-i', '-F', '--no-heading', '--', query, 'MEMORY.md', ...dirs]
      : ['-rn', '-i', '-F', '--', query, 'MEMORY.md', ...dirs];
  const hits = await run(engine, args, { cwd: root });

  // 3. Group hits by file.
  const byFile = {};
  if (hits.code === 0 && hits.stdout.trim()) {
    for (const line of hits.stdout.split('\n')) {
      const m = line.match(/^([^:]+):(\d+):(.*)$/);
      if (!m) continue;
      const rel = m[1];
      const num = +m[2];
      (byFile[rel] = byFile[rel] || []).push(num);
    }
  }

  // 4. Cores: read matching ones entirely.
  const coreHits = Object.keys(byFile).filter((f) => f.startsWith('.memory/core/'));
  if (coreHits.length) {
    out.push('## core matches (read in full)');
    for (const rel of coreHits) {
      const r = await run('sed', ['-n', `1,${CORE_LIMIT}p`, path.join(root, rel)]);
      out.push(`### ${rel}`);
      out.push(r.stdout.trim() || '(empty)');
      out.push('');
    }
  }

  // 5. Context: guide + window around each hit.
  const contextHits = Object.keys(byFile).filter((f) => f.startsWith('.memory/context/'));
  if (contextHits.length) {
    out.push('## context matches (guide + windows around hits)');
    for (const rel of contextHits) {
      const abs = path.join(root, rel);
      const line1 = await run('sed', ['-n', '1p', abs]);
      const guide = parseGuide(line1.stdout);
      out.push(`### ${rel}${guide ? ` (guide ${guide.start}-${guide.end})` : ''}`);
      if (guide) {
        const g = await run('sed', ['-n', `${guide.start},${guide.end}p`, abs]);
        out.push('GUIDE:');
        out.push(g.stdout.trim() || '(empty guide)');
      }
      const nums = [...byFile[rel]].sort((a, b) => a - b);
      if (nums[nums.length - 1] - nums[0] > 40) {
        // hits far apart: one window per hit, not one giant range
        for (const n of nums) {
          const w = await run('sed', ['-n', `${Math.max(1, n - WINDOW)},${n + WINDOW}p`, abs]);
          out.push(`around L${n}:`);
          out.push(w.stdout.trim() || '');
          out.push('');
        }
      } else {
        const w = await run('sed', ['-n', `${Math.max(1, nums[0] - WINDOW)},${nums[nums.length - 1] + WINDOW}p`, abs]);
        out.push(`L${Math.max(1, nums[0] - WINDOW)}-L${nums[nums.length - 1] + WINDOW}:`);
        out.push(w.stdout.trim() || '');
        out.push('');
      }
    }
  }

  // 6. Everything else that did not match.
  if (!coreHits.length && !contextHits.length) {
    out.push('## no matches anywhere');
  }

  return out.join('\n');
}

module.exports = { createMemoryRecallTool, findMemoryRoot, parseGuide, defaultRun };
