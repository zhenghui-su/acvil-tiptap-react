import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/core";
import { useMemo, useState } from "react";
import { CollaborativeEditor } from "../../src";
import type { ContentChangeEvent } from "../../src";
import { RICH_ROOM_NAME } from "../shared/constants";
import { getStableDemoUser } from "../shared/demoUsers";
import { useDemoCollaborationProvider } from "../shared/useDemoCollaborationProvider";

function ToolbarButton({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`toolbar__button${active ? " toolbar__button--active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function RichToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        粗体
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        斜体
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        下划线
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        无序列表
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        有序列表
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        引用
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        代码块
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={() => {
          const href = window.prompt("输入链接地址", "https://");

          if (!href) {
            return;
          }

          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }}
      >
        链接
      </ToolbarButton>
    </div>
  );
}

export function RichExample() {
  const user = useMemo(() => getStableDemoUser("acvil-rich-demo-user"), []);
  const initialContent =
    "<h2>团队协作文档</h2><p>这个示例用于展示组件库在真实业务中的目标形态。</p><p>每次内容变化都会把 JSON、HTML 和纯文本暴露给宿主，方便外部按自己的节奏保存。</p>";
  const extensions = useMemo(
    () => [
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "给文档起一个标题" : "写点有价值的内容……",
      }),
      CharacterCount.configure({
        limit: 2000,
      }),
    ],
    [],
  );
  const { document, provider, status } = useDemoCollaborationProvider({
    content: initialContent,
    extensions,
    roomName: RICH_ROOM_NAME,
    user,
  });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<ContentChangeEvent | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<ContentChangeEvent | null>(null);
  const currentText = latestSnapshot?.text ?? editor?.getText() ?? "";
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section className="panel">
      <div className="panel__copy">
        <p className="eyebrow">完整能力示例</p>
        <h2>可配置扩展、协同光标，以及向外部保存内容</h2>
        <p>
          这个示例加入了占位符、字符统计、基础工具栏和外部保存面板，并通过{" "}
          <code>onContentChange</code> 把 JSON、HTML、纯文本暴露给宿主。你可以再打开一个同地址窗口，
          验证协同内容与光标。
        </p>
      </div>
      <div className="stack">
        <section className="example-card">
          <header className="example-card__header example-card__header--split">
            <div className="example-card__identity">
              <span className="swatch" style={{ backgroundColor: user.color }} />
              <div>
                <p className="example-card__title">{user.name}</p>
                <p className="example-card__meta">连接状态：{status}</p>
              </div>
            </div>
            <div className="metric-row">
              <span>字符数：{currentText.length}</span>
              <span>词数：{wordCount}</span>
            </div>
          </header>
          <RichToolbar editor={editor} />
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
              className: "editor-shell editor-shell--rich",
            }}
            editorContentProps={{
              className: "editor-surface editor-surface--rich",
            }}
            extensions={extensions}
            onContentChange={(payload) => {
              setLatestSnapshot(payload);
            }}
            onEditorReady={(currentEditor) => {
              setEditor(currentEditor);
              setLatestSnapshot((previousSnapshot) => {
                if (previousSnapshot) {
                  return previousSnapshot;
                }

                return {
                  appendedTransactions: [],
                  editor: currentEditor,
                  html: currentEditor.getHTML(),
                  json: currentEditor.getJSON(),
                  text: currentEditor.getText(),
                  transaction: currentEditor.state.tr,
                };
              });
            }}
          />
        </section>
        <section className="save-panel">
          <div className="save-panel__header">
            <div>
              <p className="save-panel__title">外部保存演示</p>
              <p className="save-panel__meta">
                宿主应用会通过回调拿到 JSON、HTML 和纯文本，并自行决定什么时候持久化。
              </p>
            </div>
            <button
              className="save-button"
              disabled={!latestSnapshot}
              onClick={() => {
                if (latestSnapshot) {
                  setSavedSnapshot(latestSnapshot);
                }
              }}
              type="button"
            >
              保存当前 JSON
            </button>
          </div>
          <div className="save-grid">
            <article className="save-block">
              <p className="save-block__label">最新 JSON</p>
              <pre>{JSON.stringify(latestSnapshot?.json ?? {}, null, 2)}</pre>
            </article>
            <article className="save-block">
              <p className="save-block__label">已保存快照</p>
              <pre>{JSON.stringify(savedSnapshot?.json ?? {}, null, 2)}</pre>
            </article>
            <article className="save-block">
              <p className="save-block__label">最新 HTML</p>
              <pre>{latestSnapshot?.html ?? ""}</pre>
            </article>
            <article className="save-block">
              <p className="save-block__label">最新纯文本</p>
              <pre>{latestSnapshot?.text ?? ""}</pre>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
