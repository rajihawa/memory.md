// memory.md — command-file parsing for the /memory* commands.
//
// Lives outside the plugin module on purpose: opencode's legacy plugin loader
// treats every function export of a plugin module as a plugin instance, so any
// named helper export breaks loading. Only the plugin's default export may be
// a function.

const fs = require('node:fs');

function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

module.exports = { parseCommandFile };
