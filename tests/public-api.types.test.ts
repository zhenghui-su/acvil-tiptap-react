import type { Editor, Extensions } from "@tiptap/core";
import { expect, expectTypeOf, test } from "vite-plus/test";
import * as Y from "yjs";
import { buildEditorExtensions } from "../src";
import type {
  BuildEditorExtensionsOptions,
  CollaborationCaretConfig,
  CollaborationConfig,
  CollaborativeEditorProps,
  ContentChangeEvent,
  EditorContentSnapshot,
} from "../src";

function createTypeTestProvider(doc = new Y.Doc()) {
  return {
    awareness: {
      doc,
    },
  };
}

test("public API contracts remain type-safe for consumers", () => {
  const document = new Y.Doc();
  const provider = createTypeTestProvider(document);

  const collaboration: CollaborationConfig = {
    document,
    field: "default",
    provider,
  };

  const caret: CollaborationCaretConfig = {
    provider,
    user: {
      color: "#2563eb",
      name: "Type Tester",
    },
  };

  const options: BuildEditorExtensionsOptions = {
    collaboration,
    collaborationCaret: caret,
    starterKit: true,
  };

  const extensions = buildEditorExtensions(options);

  const props: CollaborativeEditorProps = {
    collaboration,
    collaborationCaret: caret,
    onContentChange(payload) {
      const snapshot: EditorContentSnapshot = {
        html: payload.html,
        json: payload.json,
        text: payload.text,
      };
      const event: ContentChangeEvent = payload;
      const editor: Editor = payload.editor;

      void snapshot;
      void event;
      void editor;
    },
  };

  expect(Array.isArray(extensions)).toBe(true);
  expectTypeOf(extensions).toMatchTypeOf<Extensions>();
  expectTypeOf(props).toMatchTypeOf<CollaborativeEditorProps>();
});

// @ts-expect-error collaboration caret requires user metadata for identity.
const invalidCaretConfig: CollaborationCaretConfig = {
  provider: createTypeTestProvider(),
};

void invalidCaretConfig;
