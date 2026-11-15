# babylon-mcp

Lets any agent on your machine drive the [Babylon.js Editor](https://editor.babylonjs.com) (5.5) through the editor's own MCP server: Claude Code in a terminal or a desktop app, Codex, anything that speaks MCP.

The editor ships an MCP server with tools for the scene, meshes, materials, lights, scripts, play-testing and screenshots, but it only starts it while a session of its AI Assistant panel runs, on a random port with a random token. This package keeps that same server on for as long as the project is open.

## How it works

1. **Editor plugin** (`babylon-mcp/editor`): when the project opens, it starts the editor's MCP server (`build/src/mcp/mcp.js` in the editor's `app.asar`) on a fixed port, 3712 by default. It writes the connection to `~/.babylonjs-editor-mcp/connection.json`: the URL, a token kept across restarts, and where the editor's stdio server lives. The token stays out of the project.
2. **Stdio server** (`babylon-mcp`): what your agent runs. It reads that file and starts the editor's own stdio server with the editor's executable (as Node.js), so the tools are exactly the ones the AI Assistant gets.

## Install

In the editor project, from a GitHub release, as a tarball over HTTPS:

```bash
npm install --save-dev https://github.com/acronita/babylon-mcp/archive/refs/tags/0.1.0.tar.gz
```

Add the plugin to `project.bjseditor`, or in the editor under the project's plugins:

```json
"plugins": [{ "nameOrPath": "babylon-mcp/editor" }]
```

Reopen the project. The editor's console says `Babylon MCP: listening on port 3712`.

Register the server with your agent. For Claude Code, in the project's `.mcp.json`:

```json
{
  "mcpServers": {
    "babylonjs-editor": { "type": "stdio", "command": "node", "args": ["node_modules/babylon-mcp/src/server.mjs"] }
  }
}
```

## Notes

- One editor window at a time: a second window finds the port taken and says so in its console. Set `BABYLON_MCP_PORT` in the editor's environment to use another port.
- The server only accepts requests from local processes that know the token, and rejects requests from web pages (the editor's own checks).
- It relies on editor internals (`build/src/mcp/mcp.js`, `build/mcp/index.mjs`). If an editor update moves them, the plugin says so in the console instead of failing silently.
- Tested with Babylon.js Editor 5.5 on Windows.

## License

MIT
