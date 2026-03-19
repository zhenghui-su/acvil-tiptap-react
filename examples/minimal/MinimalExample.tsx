import { useMemo } from "react";
import { CollaborativeEditor } from "../../src";
import { MINIMAL_ROOM_NAME } from "../shared/constants";
import { getStableDemoUser } from "../shared/demoUsers";
import { useDemoCollaborationProvider } from "../shared/useDemoCollaborationProvider";

const initialContent =
  "<p>这个示例通过 Hocuspocus 在同一个房间内同步内容与光标。</p><p>在这里输入或选中文本，另一侧会立即更新，并显示远端光标名称。</p>";

function MinimalPeerCard({ storageKey }: { storageKey: string }) {
  const user = useMemo(() => getStableDemoUser(storageKey), [storageKey]);
  const { document, provider, status } = useDemoCollaborationProvider({
    content: initialContent,
    roomName: MINIMAL_ROOM_NAME,
    user,
  });

  return (
    <section className="example-card">
      <header className="example-card__header">
        <div className="example-card__identity">
          <span className="swatch" style={{ backgroundColor: user.color }} />
          <div>
            <p className="example-card__title">{user.name}</p>
            <p className="example-card__meta">连接状态：{status}</p>
          </div>
        </div>
      </header>
      <CollaborativeEditor
        collaboration={{
          document,
          field: "default",
          provider,
        }}
        collaborationCaret={{
          provider,
          user,
        }}
        containerProps={{
          className: "editor-shell",
        }}
        editorContentProps={{
          className: "editor-surface",
        }}
      />
    </section>
  );
}

export function MinimalExample() {
  return (
    <section className="panel">
      <div className="panel__copy">
        <p className="eyebrow">最小协同示例</p>
        <h2>两个编辑器连接同一个 Hocuspocus 房间</h2>
        <p>
          运行 <code>vp run example</code> 后，会同时启动本地 Hocuspocus server 和示例页面。
          你可以直接在左右两个编辑器里输入，或者再打开一个同地址窗口验证内容同步与远端光标。
        </p>
      </div>
      <div className="editor-grid">
        <MinimalPeerCard storageKey="acvil-minimal-left-user" />
        <MinimalPeerCard storageKey="acvil-minimal-right-user" />
      </div>
    </section>
  );
}
