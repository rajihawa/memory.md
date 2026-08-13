// memory.md — OpenCode plugin.
//
// Registers the memory_recall tool, the /memory* commands, and the memory
// skill directory so they work when the package is installed from npm; injects
// the memory protocol into the system prompt whenever the project has a
// MEMORY.md; and nudges the user to save the session when it goes idle.
//
// Add to your opencode.json:
//   { "plugin": ["@rajihawa/memory.md"] }

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const { createMemoryRecallTool, findMemoryRoot } = require('../../hooks/memory-tool');
const { getMemoryInstructions } = require('../../hooks/memory-instructions');

export function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

export default async ({ client, directory } = {}) => {
  return {
    // The browse tool: search cores, dig into context guides and line ranges.
    tool: {
      memory_recall: createMemoryRecallTool(),
    },

    // Register slash commands + the skills directory.
    config: async (config) => {
      if (!config.command) config.command = {};
      const commandDir = path.join(__dirname, '..', 'command');
      try {
        for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'))) {
          const name = path.basename(file, '.md');
          const parsed = parseCommandFile(path.join(commandDir, file));
          if (parsed) config.command[name] = parsed;
        }
      } catch (e) {}

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      const skillsDir = path.resolve(__dirname, '../../skills');
      if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
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
      if (event.type !== 'session.idle') return;
      try {
        await client.tui.appendPrompt({ body: { text: '/memory-remember — save this session?' } });
      } catch (e) {}
    },
  };
};
