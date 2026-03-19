import { generateJSON, getSchema } from "@tiptap/core";
import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/core";
import { act, render, waitFor } from "@testing-library/react";
import { prosemirrorJSONToYXmlFragment, yDocToProsemirrorJSON } from "@tiptap/y-tiptap";
import { beforeEach, expect, test, vi } from "vite-plus/test";
import * as Y from "yjs";
import {
  createDemoHocuspocusProvider,
  hasDemoDocumentInitialized,
  initializeDemoCollaborationDocument,
} from "../examples/shared/demoCollaboration";
import { buildEditorExtensions, CollaborativeEditor, type ContentChangeEvent } from "../src";

function createTestProvider(doc = new Y.Doc()) {
  return {
    awareness: {
      doc,
    },
  };
}

function seedDocument(document: Y.Doc, content: string) {
  const extensions = buildEditorExtensions({
    collaboration: false,
  });
  const schema = getSchema(extensions);
  const json = generateJSON(content, extensions);

  prosemirrorJSONToYXmlFragment(schema, json, document.getXmlFragment("default"));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test("buildEditorExtensions includes collaboration and disables undoRedo in StarterKit", () => {
  const extensions = buildEditorExtensions({
    collaboration: {
      document: new Y.Doc(),
      provider: {
        awareness: {},
      },
    },
    starterKit: {
      heading: {
        levels: [1, 2],
      },
      undoRedo: {
        depth: 50,
      },
    },
  });

  expect(extensions.map((extension) => extension.name)).toEqual(["starterKit", "collaboration"]);
});

test("buildEditorExtensions lets callers replace the final extension list", () => {
  const extensions = buildEditorExtensions({
    collaboration: {
      document: new Y.Doc(),
    },
    extendExtensions: ({ collaborationExtension, starterKitExtension }) => [
      collaborationExtension!,
      starterKitExtension!,
    ],
  });

  expect(extensions.map((extension) => extension.name)).toEqual(["collaboration", "starterKit"]);
});

test("buildEditorExtensions includes collaboration caret when configured", () => {
  const doc = new Y.Doc();
  const extensions = buildEditorExtensions({
    collaboration: {
      document: doc,
    },
    collaborationCaret: {
      provider: createTestProvider(doc),
      user: {
        color: "#2563eb",
        name: "Alice",
      },
    },
  });

  expect(extensions.map((extension) => extension.name)).toEqual([
    "starterKit",
    "collaboration",
    "collaborationCaret",
  ]);
});

test("CollaborativeEditor renders content and exposes the editor lifecycle", async () => {
  const ready = vi.fn<(editor: Editor) => void>();
  const destroyed = vi.fn<(editor: Editor) => void>();

  const { container, unmount } = render(
    <CollaborativeEditor
      content="<p>Hello collaborative world</p>"
      onEditorDestroy={destroyed}
      onEditorReady={ready}
    />,
  );

  await waitFor(() => {
    expect(ready).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".ProseMirror")?.textContent).toContain(
      "Hello collaborative world",
    );
  });

  unmount();

  expect(destroyed).toHaveBeenCalledTimes(1);
});

test("CollaborativeEditor emits content snapshots for regular editors", async () => {
  const handleContentChange = vi.fn<(payload: ContentChangeEvent) => void>();
  let currentEditor: Editor | null = null;

  render(
    <CollaborativeEditor
      onContentChange={handleContentChange}
      onEditorReady={(editor) => {
        currentEditor = editor;
      }}
    />,
  );

  await waitFor(() => {
    expect(currentEditor).not.toBeNull();
  });

  act(() => {
    currentEditor!.commands.setContent("<p>Persist me</p>");
  });

  await waitFor(() => {
    expect(handleContentChange).toHaveBeenCalledTimes(1);
  });

  expect(handleContentChange.mock.calls[0]?.[0].json.content?.[0]?.content?.[0]?.text).toBe(
    "Persist me",
  );
  expect(handleContentChange.mock.calls[0]?.[0].html).toContain("Persist me");
  expect(handleContentChange.mock.calls[0]?.[0].text).toContain("Persist me");
});

test("CollaborativeEditor emits content snapshots for collaboration editors", async () => {
  const doc = new Y.Doc();
  const handleContentChange = vi.fn<(payload: ContentChangeEvent) => void>();
  let currentEditor: Editor | null = null;

  render(
    <CollaborativeEditor
      collaboration={{
        document: doc,
        provider: createTestProvider(doc),
      }}
      onContentChange={handleContentChange}
      onEditorReady={(editor) => {
        currentEditor = editor;
      }}
    />,
  );

  await waitFor(() => {
    expect(currentEditor).not.toBeNull();
  });

  act(() => {
    currentEditor!.commands.insertContent("Shared");
  });

  await waitFor(() => {
    expect(handleContentChange).toHaveBeenCalledTimes(1);
  });

  expect(handleContentChange.mock.calls[0]?.[0].text).toContain("Shared");
});

test("CollaborativeEditor ignores content prop when collaboration is enabled", async () => {
  const doc = new Y.Doc();
  let currentEditor: Editor | null = null;

  render(
    <CollaborativeEditor
      collaboration={{
        document: doc,
        provider: createTestProvider(doc),
      }}
      content="<p>Should not be injected</p>"
      onEditorReady={(editor) => {
        currentEditor = editor;
      }}
    />,
  );

  await waitFor(() => {
    expect(currentEditor).not.toBeNull();
  });

  expect(currentEditor).not.toBeNull();
  expect(currentEditor!.getText()).toBe("");
});

test("initializeDemoCollaborationDocument seeds an empty Y.Doc only once", () => {
  const document = new Y.Doc();

  expect(
    initializeDemoCollaborationDocument({
      content: "<p>First room state</p>",
      document,
    }),
  ).toBe(true);
  expect(
    initializeDemoCollaborationDocument({
      content: "<p>Second room state</p>",
      document,
    }),
  ).toBe(false);
  expect(hasDemoDocumentInitialized(document)).toBe(true);
  expect(yDocToProsemirrorJSON(document, "default")?.content?.[0]?.content?.[0]?.text).toBe(
    "First room state",
  );
});

test("initializeDemoCollaborationDocument does not overwrite an existing document", () => {
  const document = new Y.Doc();

  seedDocument(document, "<p>Existing room state</p>");

  expect(
    initializeDemoCollaborationDocument({
      content: "<p>New room state</p>",
      document,
    }),
  ).toBe(false);
  expect(hasDemoDocumentInitialized(document)).toBe(true);
  expect(yDocToProsemirrorJSON(document, "default")?.content?.[0]?.content?.[0]?.text).toBe(
    "Existing room state",
  );
});

test("createDemoHocuspocusProvider creates a provider without connecting", () => {
  const provider = createDemoHocuspocusProvider({
    connect: false,
    roomName: "provider-smoke",
  });

  expect(provider).toBeInstanceOf(HocuspocusProvider);
  expect(provider.document).toBeInstanceOf(Y.Doc);
  expect(provider.awareness).not.toBeNull();

  provider.destroy();
});
