import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extensions } from "@tiptap/core";
import type { StarterKitOptions } from "@tiptap/starter-kit";
import { useEffect, useMemo, useState } from "react";
import type { DemoUser } from "./demoUsers";
import {
  createDemoHocuspocusProvider,
  initializeDemoCollaborationDocument,
} from "./demoCollaboration";
import { HOCUSPOCUS_URL } from "./constants";

export interface UseDemoCollaborationProviderOptions {
  content?: string;
  extensions?: Extensions;
  field?: string;
  roomName: string;
  serverUrl?: string;
  starterKit?: boolean | Partial<StarterKitOptions>;
  user: DemoUser;
}

function formatStatus(connectionStatus: string, synced: boolean) {
  if (connectionStatus === "connected") {
    return synced ? "已同步" : "同步中";
  }

  if (connectionStatus === "disconnected") {
    return "已断开";
  }

  return "连接中";
}

export function useDemoCollaborationProvider({
  content,
  extensions,
  field = "default",
  roomName,
  serverUrl = HOCUSPOCUS_URL,
  starterKit = true,
  user,
}: UseDemoCollaborationProviderOptions) {
  const provider = useMemo(
    () =>
      createDemoHocuspocusProvider({
        roomName,
        serverUrl,
      }),
    [roomName, serverUrl],
  );
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [synced, setSynced] = useState(provider.synced);

  useEffect(() => {
    const websocketProvider = provider.configuration.websocketProvider;

    const handleStatus = ({ status }: { status: string }) => {
      setConnectionStatus(status);
    };
    const handleSynced = ({ state }: { state: boolean }) => {
      setSynced(state);
    };

    provider.on("status", handleStatus);
    provider.on("synced", handleSynced);
    // Current provider API expects explicit provider attach/detach and
    // websocket-level connect/disconnect in this custom websocket mode.
    provider.attach();
    void websocketProvider.connect();

    if (provider.synced) {
      handleSynced({ state: true });
    }

    return () => {
      provider.off("status", handleStatus);
      provider.off("synced", handleSynced);
      provider.detach();
      websocketProvider.disconnect();
      provider.destroy();
    };
  }, [provider]);

  useEffect(() => {
    provider.setAwarenessField("user", user);
  }, [provider, user]);

  useEffect(() => {
    if (!synced) {
      return;
    }

    initializeDemoCollaborationDocument({
      content,
      document: provider.document,
      extensions,
      field,
      starterKit,
    });
  }, [content, extensions, field, provider, starterKit, synced]);

  return {
    document: provider.document,
    provider: provider as HocuspocusProvider,
    status: formatStatus(connectionStatus, synced),
    synced,
  } as const;
}
