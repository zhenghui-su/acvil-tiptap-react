# API Reference

This document describes the public API contract of `@acvil-tiptap/react`.

## `CollaborativeEditor`

React component wrapper around Tiptap `useEditor` + `EditorContent`.

### `CollaborativeEditorProps`

| Prop                 | Type                                                                                       | Default     | Notes                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------- |
| `starterKit`         | `true \| false \| Partial<StarterKitOptions>`                                              | `true`      | In collaboration mode, `undoRedo` is forced to `false`.                     |
| `collaboration`      | `boolean \| CollaborationConfig \| null`                                                   | `undefined` | Enables collaboration extension; supports auto Y.Doc creation when enabled. |
| `collaborationCaret` | `CollaborationCaretConfig \| null`                                                         | `undefined` | Requires both `provider` and `user` for remote caret rendering.             |
| `extensions`         | `Extensions`                                                                               | `[]`        | Extra extensions appended after StarterKit.                                 |
| `extendExtensions`   | `(context) => Extensions`                                                                  | `undefined` | Final override hook to return the resolved extension list.                  |
| `content`            | `UseEditorOptions["content"]`                                                              | `undefined` | Used only in non-collaboration mode. Ignored when collaboration is enabled. |
| `editorDependencies` | `DependencyList`                                                                           | `undefined` | Forwarded to `useEditor` dependency list.                                   |
| `containerProps`     | `HTMLAttributes<HTMLDivElement>`                                                           | `undefined` | Props for outer wrapper.                                                    |
| `editorContentProps` | `Omit<ComponentPropsWithoutRef<"div">, "children"> & Pick<EditorContentProps, "innerRef">` | `undefined` | Props for `<EditorContent />`.                                              |
| `slotBefore`         | `ReactNode`                                                                                | `undefined` | Rendered before editor content.                                             |
| `slotAfter`          | `ReactNode`                                                                                | `undefined` | Rendered after editor content.                                              |
| `onContentChange`    | `(payload: ContentChangeEvent) => void`                                                    | `undefined` | Emits stable `json/html/text` snapshots on updates.                         |
| `onEditorReady`      | `(editor: Editor) => void`                                                                 | `undefined` | Called when editor instance is ready.                                       |
| `onEditorDestroy`    | `(editor: Editor) => void`                                                                 | `undefined` | Called during teardown.                                                     |

All remaining props from `UseEditorOptions` (except `element` and `extensions`) are forwarded to `useEditor`.

## `buildEditorExtensions(options)`

Builds the final extension array used by the editor component.

### Extension assembly order

1. Optional StarterKit extension
2. `options.extensions`
3. Optional Collaboration extension
4. Optional CollaborationCaret extension
5. Optional `extendExtensions(context)` override return value

### Collaboration behavior

- Collaboration disabled: StarterKit options are used as-is.
- Collaboration enabled: StarterKit `undoRedo` is forced off to avoid history conflicts with collaborative state.
- If collaboration is `true` without a provided document/fragment, a private `Y.Doc` is auto-created.

## Types

### `CollaborationConfig`

Extends Tiptap Collaboration options and adds:

- `enabled?: boolean`
- `document?: Y.Doc | null`
- `fragment?: Y.XmlFragment | null`

### `CollaborationCaretConfig`

Requires:

- `provider`
- `user`

And supports all other optional caret configuration fields from the Tiptap extension.

### `ContentChangeEvent`

Stable payload contract:

- `json`
- `html`
- `text`
- `editor`
- `transaction`
- `appendedTransactions`

## Best Practice: Collaboration Initialization

Do not rely on editor `content` in collaboration mode.  
Initialize collaborative content in Yjs or perform a one-time initialization after first provider sync on an empty shared document.
