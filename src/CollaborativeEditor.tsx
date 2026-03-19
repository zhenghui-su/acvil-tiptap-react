import Collaboration, { type CollaborationOptions } from "@tiptap/extension-collaboration";
import CollaborationCaret, {
  type CollaborationCaretOptions,
} from "@tiptap/extension-collaboration-caret";
import type { AnyExtension, Editor, EditorEvents, Extensions, JSONContent } from "@tiptap/core";
import {
  EditorContent,
  useEditor,
  type EditorContentProps,
  type UseEditorOptions,
} from "@tiptap/react";
import StarterKit, { type StarterKitOptions } from "@tiptap/starter-kit";
import {
  type ComponentPropsWithoutRef,
  type DependencyList,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
} from "react";
import * as Y from "yjs";

/**
 * Collaboration configuration accepted by this library.
 *
 * `enabled` is a convenience flag for conditional composition.
 * When collaboration is enabled and no `document`/`fragment` is provided,
 * the component creates an internal `Y.Doc`.
 */
export interface CollaborationConfig extends Omit<CollaborationOptions, "document" | "fragment"> {
  document?: Y.Doc | null;
  enabled?: boolean;
  fragment?: Y.XmlFragment | null;
}

/**
 * Collaboration configuration after `enabled` has been resolved.
 */
export interface ResolvedCollaborationConfig extends Omit<CollaborationConfig, "enabled"> {}

/**
 * Collaboration caret configuration.
 *
 * `provider` and `user` are required to render remote caret identity reliably.
 */
export type CollaborationCaretConfig = Pick<CollaborationCaretOptions, "provider" | "user"> &
  Partial<Omit<CollaborationCaretOptions, "provider" | "user">>;

/**
 * Stable snapshot emitted by the editor.
 */
export interface EditorContentSnapshot {
  html: string;
  json: JSONContent;
  text: string;
}

/**
 * Full update payload emitted via `onContentChange`.
 */
export interface ContentChangeEvent extends EditorContentSnapshot {
  appendedTransactions: EditorEvents["update"]["appendedTransactions"];
  editor: Editor;
  transaction: EditorEvents["update"]["transaction"];
}

/**
 * Extension builder context exposed to `extendExtensions`.
 */
export interface ExtensionBuilderContext {
  baseExtensions: Extensions;
  collaboration: ResolvedCollaborationConfig | null;
  collaborationCaret: CollaborationCaretConfig | null;
  collaborationCaretExtension: AnyExtension | null;
  collaborationExtension: AnyExtension | null;
  customExtensions: Extensions;
  starterKitExtension: AnyExtension | null;
}

/**
 * Options used by `buildEditorExtensions`.
 */
export interface BuildEditorExtensionsOptions {
  collaboration?: CollaborationConfig | boolean | null;
  collaborationCaret?: CollaborationCaretConfig | null;
  extensions?: Extensions;
  extendExtensions?: (context: ExtensionBuilderContext) => Extensions;
  starterKit?: boolean | Partial<StarterKitOptions>;
}

/**
 * Public component props for `CollaborativeEditor`.
 *
 * In collaboration mode, `content` is intentionally ignored.
 * Shared state should be initialized from Yjs/provider lifecycle instead.
 */
export interface CollaborativeEditorProps extends Omit<UseEditorOptions, "element" | "extensions"> {
  collaboration?: CollaborationConfig | boolean | null;
  collaborationCaret?: CollaborationCaretConfig | null;
  containerProps?: HTMLAttributes<HTMLDivElement>;
  editorContentProps?: Omit<ComponentPropsWithoutRef<"div">, "children"> &
    Pick<EditorContentProps, "innerRef">;
  editorDependencies?: DependencyList;
  extensions?: Extensions;
  extendExtensions?: (context: ExtensionBuilderContext) => Extensions;
  onContentChange?: (payload: ContentChangeEvent) => void;
  onEditorDestroy?: (editor: Editor) => void;
  onEditorReady?: (editor: Editor) => void;
  slotAfter?: ReactNode;
  slotBefore?: ReactNode;
  starterKit?: boolean | Partial<StarterKitOptions>;
}

interface InternalCollaborationState {
  config: ResolvedCollaborationConfig | null;
  ownsDocument: boolean;
}

function createEditorContentSnapshot(editor: Editor): EditorContentSnapshot {
  return {
    html: editor.getHTML(),
    json: editor.getJSON(),
    text: editor.getText(),
  };
}

function resolveStarterKitOptions(
  starterKit: BuildEditorExtensionsOptions["starterKit"],
  collaborationEnabled: boolean,
): Partial<StarterKitOptions> | false {
  if (starterKit === false) {
    return false;
  }

  const starterKitOptions = starterKit && typeof starterKit === "object" ? starterKit : {};

  if (!collaborationEnabled) {
    return starterKitOptions;
  }

  // Collaboration extensions provide their own history model, so undo/redo
  // from StarterKit must be disabled to avoid conflicting history behavior.
  return {
    ...starterKitOptions,
    undoRedo: false,
  };
}

function resolveCollaborationState(
  collaboration: BuildEditorExtensionsOptions["collaboration"],
): InternalCollaborationState {
  if (
    collaboration === false ||
    collaboration == null ||
    (typeof collaboration === "object" && collaboration.enabled === false)
  ) {
    return {
      config: null,
      ownsDocument: false,
    };
  }

  if (collaboration === true) {
    return {
      config: {
        document: new Y.Doc(),
      },
      ownsDocument: true,
    };
  }

  const { enabled: _enabled, ...rest } = collaboration;

  if (rest.document || rest.fragment) {
    return {
      config: rest,
      ownsDocument: false,
    };
  }

  return {
    config: {
      ...rest,
      document: new Y.Doc(),
    },
    ownsDocument: true,
  };
}

/**
 * Builds the final extension list used by the editor.
 *
 * Assembly order:
 * 1) StarterKit (optional)
 * 2) user `extensions`
 * 3) Collaboration extension (optional)
 * 4) CollaborationCaret extension (optional)
 * 5) `extendExtensions` return value (if provided)
 */
export function buildEditorExtensions({
  collaboration,
  collaborationCaret,
  extensions = [],
  extendExtensions,
  starterKit = true,
}: BuildEditorExtensionsOptions): Extensions {
  const collaborationState = resolveCollaborationState(collaboration);
  const collaborationConfig = collaborationState.config;
  const collaborationEnabled = collaborationConfig !== null;
  const starterKitOptions = resolveStarterKitOptions(starterKit, collaborationEnabled);
  const starterKitExtension =
    starterKitOptions === false ? null : StarterKit.configure(starterKitOptions);
  const collaborationExtension = collaborationConfig
    ? Collaboration.configure(collaborationConfig)
    : null;
  const collaborationCaretExtension = collaborationCaret
    ? CollaborationCaret.configure(collaborationCaret)
    : null;

  const baseExtensions = [
    ...(starterKitExtension ? [starterKitExtension] : []),
    ...extensions,
    ...(collaborationExtension ? [collaborationExtension] : []),
    ...(collaborationCaretExtension ? [collaborationCaretExtension] : []),
  ];

  if (!extendExtensions) {
    return baseExtensions;
  }

  return extendExtensions({
    baseExtensions,
    collaboration: collaborationConfig,
    collaborationCaret: collaborationCaret ?? null,
    collaborationCaretExtension,
    collaborationExtension,
    customExtensions: extensions,
    starterKitExtension,
  });
}

/**
 * Configurable React editor component with optional collaboration support.
 *
 * It wraps `useEditor` and handles extension assembly, collaboration defaults,
 * editor lifecycle callbacks, and stable content snapshots.
 */
export function CollaborativeEditor({
  collaboration,
  collaborationCaret,
  content,
  containerProps,
  editorContentProps,
  editorDependencies,
  extensions,
  extendExtensions,
  immediatelyRender = true,
  onContentChange,
  onEditorDestroy,
  onEditorReady,
  slotAfter,
  slotBefore,
  starterKit = true,
  ...editorOptions
}: CollaborativeEditorProps) {
  const collaborationState = useMemo(
    () => resolveCollaborationState(collaboration),
    [collaboration],
  );

  useEffect(() => {
    return () => {
      // Destroy only internal documents created by this component.
      if (collaborationState.ownsDocument) {
        collaborationState.config?.document?.destroy();
      }
    };
  }, [collaborationState]);

  const resolvedExtensions = useMemo(
    () =>
      buildEditorExtensions({
        collaboration: collaborationState.config,
        collaborationCaret,
        extensions,
        extendExtensions,
        starterKit,
      }),
    [collaborationCaret, collaborationState.config, extensions, extendExtensions, starterKit],
  );

  const editor = useEditor(
    {
      ...editorOptions,
      // Collaborative state must come from Yjs, not local `content`.
      content: collaborationState.config ? undefined : content,
      extensions: resolvedExtensions,
      immediatelyRender,
    },
    editorDependencies,
  );

  useEffect(() => {
    if (!editor || !onContentChange) {
      return;
    }

    const handleUpdate = ({
      appendedTransactions,
      editor: currentEditor,
      transaction,
    }: EditorEvents["update"]) => {
      onContentChange({
        ...createEditorContentSnapshot(currentEditor),
        appendedTransactions,
        editor: currentEditor,
        transaction,
      });
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, onContentChange]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    onEditorReady?.(editor);

    return () => {
      onEditorDestroy?.(editor);
    };
  }, [editor, onEditorDestroy, onEditorReady]);

  return (
    <div {...containerProps}>
      {slotBefore}
      <EditorContent editor={editor} {...editorContentProps} />
      {slotAfter}
    </div>
  );
}
