// memory.md — OpenCode plugin.
//
// Per-project activation, like AGENTS.md: the protocol injection, the
// remember/info/help commands, the memory skill, and the save-session nudge
// only exist where a MEMORY.md is found walking up from the project directory.
// /memory-init stays available everywhere so a fresh project can bootstrap the
// system; memory_recall self-guards with an init pointer when absent.
//
// IMPORTANT: this module must export ONLY the default export (a function).
// opencode's legacy plugin loader calls every function export as a plugin
// instance, and any named helper export throws and kills registration.
//
// Add to your opencode.json:
//   { "plugin": ["git+https://github.com/rajihawa/memory.md"] }

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const { createMemoryRecallTool, findMemoryRoot } = require('../../hooks/memory-tool');
const { getMemoryInstructions } = require('../../hooks/memory-instructions');
const { parseCommandFile } = require('../../hooks/command-file');
const { version } = require('../../package.json');

export default async ({ client, directory } = {}) => {
  const hasMemory = !!findMemoryRoot(directory || process.cwd());
  const log = (level, message) => {
    try {
      client && client.app && client.app.log({ body: { service: 'memory.md', level, message } });
    } catch (e) {}
  };
  log('info', hasMemory ? 'plugin loaded (memory active)' : 'plugin loaded (no MEMORY.md — /memory-init to init)');

  return {
    // The browse tool: search cores, dig into context guides and line ranges.
    // Always registered; without MEMORY.md it replies with an init pointer.
    tool: {
      memory_recall: createMemoryRecallTool(),
    },

    // Register slash commands + the skills directory. /memory-init always
    // (that is how a project bootstraps); remember/info/help and the skill
    // only with memory.
    config: async (config) => {
      if (!config.command) config.command = {};
      const commandDir = path.join(__dirname, '..', 'command');
      try {
        for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'))) {
          if (!hasMemory && file !== 'memory-init.md') continue;
          const name = path.basename(file, '.md');
          const parsed = parseCommandFile(path.join(commandDir, file));
          if (parsed) {
            config.command[name] = {
              description: parsed.description,
              template: file === 'memory-info.md' ? parsed.template.replaceAll('{{version}}', version) : parsed.template,
            };
          }
        }
      } catch (e) {}

      if (hasMemory) {
        config.skills = config.skills || {};
        config.skills.paths = config.skills.paths || [];
        const skillsDir = path.resolve(__dirname, '../../skills');
        if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
      }
    },

    // Inject the protocol every turn, but only in projects that have memory.
    'experimental.chat.system.transform': async (_input, output) => {
      if (findMemoryRoot(directory || process.cwd())) {
        output.system.push(getMemoryInstructions());
      }
    },

    // Automatic ask: when the session goes idle, pre-fill the prompt with the
    // save offer so the user can accept with one Enter (or ignore it).
    // ponytail: agent-driven ask (see protocol) is the primary mechanism; this
    // is a UI backup for when the model skips it.
    event: async ({ event }) => {
      if (event.type !== 'session.idle' || !hasMemory) return;
      try {
        await client.tui.appendPrompt({ body: { text: '/memory-remember — save this session?' } });
      } catch (e) {}
    },
  };
};
