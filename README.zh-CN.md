# @acvil-tiptap/react

一个面向 npm 发布的 React 协同编辑器组件库，基于 Tiptap 和 Yjs。  
它封装了编辑器生命周期与协同接入，同时保留了扩展能力的代码级可配置性。

- 英文主文档: [README.md](./README.md)
- API 参考: [docs/API.md](./docs/API.md)
- 发布记录: [CHANGELOG.md](./CHANGELOG.md)

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

请将协同 provider（例如 Hocuspocus）提供的 `document` 与 `provider` 传入 `collaboration`。

关键语义：

- 协同模式下组件会忽略 `content`。
- 初始内容应写入 Yjs，或在 provider 首次同步后只初始化一次。
- 要显示远端光标，`collaborationCaret` 里必须同时提供 `provider` 和 `user`。

本地最小协同服务可直接运行：

```bash
npx -y @hocuspocus/cli --port 1234 --sqlite
```

## API

主要导出：

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

字段级 API 说明见 [docs/API.md](./docs/API.md)。

## Examples

仓库内置两个 Vite 示例：

- 最小协同：验证内容同步与远端光标
- 完整能力：扩展配置 + 协同 + 外部保存面板

一键启动：

```bash
vp install
vp run example
```

常用命令：

- `vp run example:minimal`
- `vp run example:rich`
- `vp run example:server`

连接外部服务：

```bash
VITE_HOCUSPOCUS_URL=ws://127.0.0.1:1234 vp run example
```

## FAQ

**为什么协同模式下 `content` 不生效？**  
协同文档状态由 Yjs 驱动。挂载后再注入 `content` 容易导致多端重复初始化。

**如何把内容保存到外部系统？**  
通过 `onContentChange` 获取 `json/html/text`，推荐以 `json` 作为持久化格式。

**必须使用 Hocuspocus 吗？**  
不是。只要是与 Tiptap 协同扩展兼容的 provider/document 组合即可。

## Troubleshooting

**看不到远端光标**

- 检查 `collaborationCaret` 是否包含 `provider` 与 `user`。
- 检查所有 peer 的房间名与服务地址是否一致。

**没有实时同步**

- 检查协同服务是否可达，房间名是否完全一致。
- 检查 `field/fragment` 在各 peer 是否保持一致。

**刷新后初始内容重复**

- 协同模式不要依赖编辑器 `content` 初始化。
- 在空文档首次同步后做一次性初始化。

## Development Workflow

本项目使用 Vite+ 统一工具链，开发和发布检查统一使用 `vp`：

```bash
vp check
vp test
vp pack
vp run release:check
```

贡献说明见 [CONTRIBUTING.md](./CONTRIBUTING.md)。
