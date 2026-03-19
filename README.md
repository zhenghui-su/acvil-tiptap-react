# @acvil-tiptap/react

A release-ready React collaborative editor component built on top of Tiptap and Yjs.
It packages common editor lifecycle behavior while keeping extension composition and collaboration setup fully configurable in code.

- Chinese documentation: [README.zh-CN.md](./README.zh-CN.md)
- API reference: [docs/API.md](./docs/API.md)
- Release notes: [CHANGELOG.md](./CHANGELOG.md)

## Install

```bash
vp add @acvil-tiptap/react
vp add react react-dom
```

## Quick Start

```tsx
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { CollaborativeEditor } from "@acvil-tiptap/react";

const document = new Y.Doc();
const provider = new HocuspocusProvider({
  document,
  name: "example-document",
  url: "ws://127.0.0.1:1234",
});

export function Example() {
  return (
    <CollaborativeEditor
      collaboration={{
        document,
        field: "default",
        provider,
      }}
      collaborationCaret={{
        provider,
        user: {
          color: "#2563eb",
          name: "Alice",
        },
      }}
      onContentChange={({ json }) => {
        console.log("persist this JSON", json);
      }}
    />
  );
}
```

## Collaboration Setup

Use a collaboration provider (for example, Hocuspocus) and pass its `document` and `provider` into `collaboration`.

Important behavior:

- In collaboration mode, `content` is intentionally ignored by the component.
- Initialize collaboration content in Yjs (or after first provider sync) exactly once.
- For remote carets, pass both `provider` and `user` in `collaborationCaret`.

Minimal local server:

```bash
npx -y @hocuspocus/cli --port 1234 --sqlite
```

## API

Main exports:

- `CollaborativeEditor`
- `buildEditorExtensions`
- `BuildEditorExtensionsOptions`
- `CollaborationConfig`
- `CollaborationCaretConfig`
- `CollaborativeEditorProps`
- `ContentChangeEvent`
- `EditorContentSnapshot`
- `ExtensionBuilderContext`
- `ResolvedCollaborationConfig`

Detailed API table and behavior notes are in [docs/API.md](./docs/API.md).

## Examples

This repository includes two Vite examples:

- Minimal collaboration: sync + remote caret labels
- Rich example: extension config + collaboration + external save panel

Run all examples:

```bash
vp install
vp run example
```

Useful commands:

- `vp run example:minimal`
- `vp run example:rich`
- `vp run example:server`

Use your own collaboration server:

```bash
VITE_HOCUSPOCUS_URL=ws://127.0.0.1:1234 vp run example
```

## FAQ

**Why is `content` not applied in collaboration mode?**  
Because collaborative state comes from Yjs. Injecting `content` after mount can create duplicated initial content across peers.

**How should I persist data externally?**  
Use `onContentChange` and persist `json` (recommended) in your app or backend.

**Do I have to use Hocuspocus?**  
No. You can provide any compatible provider/document pair used by the Tiptap collaboration extensions.

## Troubleshooting

**No remote cursor appears**

- Ensure `collaborationCaret` includes both `provider` and `user`.
- Ensure peers connect to the same room name and server URL.

**No real-time sync**

- Verify server is reachable and room names are identical.
- Confirm collaboration extension is configured with the same Yjs field/fragment across peers.

**Initial content gets duplicated**

- Do not initialize via editor `content` in collaboration mode.
- Initialize once on an empty Yjs document after first sync.

## Development Workflow

This project uses Vite+ as the unified toolchain. Use `vp` commands for checks, tests, and builds:

```bash
vp check
vp test
vp pack
vp run release:check
```

Contributor guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
