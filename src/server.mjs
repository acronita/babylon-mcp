#!/usr/bin/env node
// MCP stdio server for agents: runs the Babylon.js Editor's own MCP server (the one its AI
// Assistant uses), connected to the editor window where the `babylon-mcp/editor` plugin runs.
// The connection is written by the plugin to ~/.babylonjs-editor-mcp/connection.json.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const file = join(homedir(), '.babylonjs-editor-mcp', 'connection.json');
let connection;
try {
  connection = JSON.parse(readFileSync(file, 'utf8'));
} catch {
  process.stderr.write(`babylon-mcp: ${file} not found. Open the project in the Babylon.js Editor with the "babylon-mcp/editor" plugin.\n`);
  process.exit(1);
}

// The editor's executable runs the server as plain Node.js, so no Node.js version matters here.
const child = spawn(connection.executable, [connection.serverScript], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    BABYLONJS_EDITOR_MCP_URL: connection.url,
    BABYLONJS_EDITOR_MCP_TOKEN: connection.token,
  },
});
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
