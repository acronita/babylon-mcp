// Babylon.js Editor (5.5) plugin: keeps the editor's own MCP server on while the project is open,
// so any agent on the machine (Claude Code in a terminal or a desktop app, Codex...) can drive the
// editor. The editor ships this server but starts it only while a session of its AI Assistant
// panel runs, on a random port with a random token.
//
// It starts the editor's server (build/src/mcp/mcp.js inside the editor's app.asar) on a fixed
// port, with a token kept in ~/.babylonjs-editor-mcp/connection.json (never in the project), and
// records where the editor's MCP stdio server lives. `babylon-mcp` (src/server.mjs) reads that file.
//
// Add it to project.bjseditor:  "plugins": [{ "nameOrPath": "babylon-mcp/editor" }]
// (installed in the project's node_modules), or with an absolute path to this folder.
// Port: BABYLON_MCP_PORT in the editor's environment, 3712 by default.
const { join } = require('path');
const { homedir } = require('os');
const { randomBytes } = require('crypto');
const fs = require('fs');

exports.title = 'Babylon MCP';
exports.description = "Keeps the editor's MCP server on, so agents outside the editor can drive it.";

const PORT = Number(process.env.BABYLON_MCP_PORT) || 3712;
const CONFIG_DIR = join(homedir(), '.babylonjs-editor-mcp');
const CONFIG_FILE = join(CONFIG_DIR, 'connection.json');

// One server per editor process, whichever copy of the plugin loads first.
const KEY = Symbol.for('babylon-mcp.server');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return null;
  }
}

exports.main = async function main(editor) {
  if (globalThis[KEY]) return;
  const asar = join(process.resourcesPath, 'app.asar');
  let startMcpServer;
  try {
    ({ startMcpServer } = require(join(asar, 'build', 'src', 'mcp', 'mcp.js')));
  } catch (e) {
    editor.layout.console.error(`Babylon MCP: this editor version has no MCP server (${e?.message ?? e}).`);
    return;
  }
  const token = readConfig()?.token ?? randomBytes(32).toString('hex');
  let server;
  try {
    server = await startMcpServer(editor, { port: PORT, token });
  } catch (e) {
    editor.layout.console.error(`Babylon MCP: port ${PORT} is taken (another editor window?): ${e?.message ?? e}`);
    return;
  }
  globalThis[KEY] = server;
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify(
      {
        url: `http://127.0.0.1:${server.port}`,
        token,
        executable: process.execPath,
        serverScript: join(process.resourcesPath, 'app.asar.unpacked', 'build', 'mcp', 'index.mjs'),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  editor.layout.console.log(`Babylon MCP: listening on port ${server.port}; agents can drive the editor.`);
};

exports.close = async function close() {
  const server = globalThis[KEY];
  globalThis[KEY] = null;
  await server?.close();
};
