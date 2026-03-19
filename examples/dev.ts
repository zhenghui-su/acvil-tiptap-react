import { spawn } from "node:child_process";
import { Socket } from "node:net";

type ExampleTarget = "minimal" | "rich" | undefined;

const target = process.argv[2] as ExampleTarget;
const externalUrl = process.env.VITE_HOCUSPOCUS_URL?.trim();
const LOCAL_SERVER_HOST = "127.0.0.1";
const LOCAL_SERVER_PORT = 1234;
const hocuspocusUrl = externalUrl || `ws://${LOCAL_SERVER_HOST}:${LOCAL_SERVER_PORT}`;
const route = target ? `/#${target}` : "/";
const openArgs = target ? ["--open", route] : [];

let app: ReturnType<typeof spawn> | null = null;
let appStarted = false;
let server: ReturnType<typeof spawn> | null = null;

async function waitForTcpServer(host: string, port: number, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const isReady = await new Promise<boolean>((resolve) => {
      const socket = new Socket();

      const finish = (ready: boolean) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(ready);
      };

      socket.setTimeout(500);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
      socket.connect(port, host);
    });

    if (isReady) {
      return true;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  return false;
}

const startApp = () => {
  if (appStarted) {
    return;
  }

  appStarted = true;
  app = spawn("vp", ["dev", "--host", "127.0.0.1", "--port", "3000", ...openArgs], {
    env: {
      ...process.env,
      VITE_HOCUSPOCUS_URL: hocuspocusUrl,
    },
    stdio: "inherit",
  });

  console.log(`[example] websocket: ${hocuspocusUrl}`);
  console.log(`[example] app: http://127.0.0.1:3000${route}`);

  app.on("exit", (code) => {
    if (server && !server.killed) {
      server.kill("SIGTERM");
    }

    process.exit(code ?? 0);
  });
};

if (externalUrl) {
  startApp();
} else {
  server = spawn(
    "npx",
    ["-y", "@hocuspocus/cli", "--port", String(LOCAL_SERVER_PORT), "--sqlite"],
    {
      env: process.env,
      stdio: "inherit",
    },
  );

  const stopChildren = () => {
    if (server && !server.killed) {
      server.kill("SIGTERM");
    }

    if (app && !app.killed) {
      app.kill("SIGTERM");
    }
  };

  process.on("SIGINT", stopChildren);
  process.on("SIGTERM", stopChildren);

  void waitForTcpServer(LOCAL_SERVER_HOST, LOCAL_SERVER_PORT).then((ready) => {
    if (!ready) {
      console.error("[example] Hocuspocus server did not become ready in time.");

      if (server && !server.killed) {
        server.kill("SIGTERM");
      }

      process.exit(1);

      return;
    }

    startApp();
  });

  server.on("exit", (code) => {
    if (app && !app.killed) {
      app.kill("SIGTERM");
    }

    process.exit(code ?? 0);
  });
}
