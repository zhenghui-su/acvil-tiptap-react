import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { generateJSON, getSchema, type Extensions } from "@tiptap/core";
import type { StarterKitOptions } from "@tiptap/starter-kit";
import { prosemirrorJSONToYXmlFragment } from "@tiptap/y-tiptap";
import * as Y from "yjs";
import { buildEditorExtensions } from "../../src";
import { HOCUSPOCUS_URL } from "./constants";

const DEMO_META_MAP = "config";
const INITIAL_CONTENT_KEY = "initialContentLoaded";
const DEMO_INIT_ORIGIN = "acvil-demo-initial-content";

export interface CreateDemoHocuspocusProviderOptions {
  connect?: boolean;
  roomName: string;
  serverUrl?: string;
}

export interface DemoDocumentInitializationOptions {
  content?: string;
  document: Y.Doc;
  extensions?: Extensions;
  field?: string;
  starterKit?: boolean | Partial<StarterKitOptions>;
}

function buildInitializationExtensions(
  extensions?: Extensions,
  starterKit?: boolean | Partial<StarterKitOptions>,
) {
  return buildEditorExtensions({
    collaboration: false,
    extensions,
    starterKit,
  });
}

export function createDemoHocuspocusProvider({
  connect = true,
  roomName,
  serverUrl = HOCUSPOCUS_URL,
}: CreateDemoHocuspocusProviderOptions) {
  const document = new Y.Doc();
  const websocketProvider = new HocuspocusProviderWebsocket({
    autoConnect: connect,
    url: serverUrl,
  });

  return new HocuspocusProvider({
    document,
    name: roomName,
    websocketProvider,
  });
}

export function hasDemoDocumentInitialized(document: Y.Doc) {
  return document.getMap<boolean>(DEMO_META_MAP).get(INITIAL_CONTENT_KEY) === true;
}

export function initializeDemoCollaborationDocument({
  content,
  document,
  extensions,
  field = "default",
  starterKit = true,
}: DemoDocumentInitializationOptions) {
  if (!content || hasDemoDocumentInitialized(document)) {
    return false;
  }

  const fragment = document.getXmlFragment(field);
  const meta = document.getMap<boolean>(DEMO_META_MAP);
  let didInitialize = false;

  document.transact(() => {
    if (meta.get(INITIAL_CONTENT_KEY) === true) {
      return;
    }

    if (fragment.toArray().length > 0) {
      meta.set(INITIAL_CONTENT_KEY, true);

      return;
    }

    const editorExtensions = buildInitializationExtensions(extensions, starterKit);
    const schema = getSchema(editorExtensions);
    const json = generateJSON(content, editorExtensions);

    prosemirrorJSONToYXmlFragment(schema, json, fragment);
    meta.set(INITIAL_CONTENT_KEY, true);
    didInitialize = true;
  }, DEMO_INIT_ORIGIN);

  return didInitialize;
}
