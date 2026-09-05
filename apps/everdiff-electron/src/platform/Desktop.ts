import path from "node:path";
import { app, BrowserWindow, session } from "electron";
import { Context, Effect, Layer, Queue, Schema } from "effect";

export class DesktopError extends Schema.TaggedError<DesktopError>()("DesktopError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

type DesktopEvent = "activate" | "windows-closed" | "quit";

export class Desktop extends Context.Service<
  Desktop,
  {
    readonly run: Effect.Effect<void, DesktopError>;
  }
>()("@everdiff/electron/platform/Desktop") {
  static readonly layer = Layer.effect(
    Desktop,
    Effect.gen(function* () {
      const events = yield* Queue.make<DesktopEvent>();
      let window: BrowserWindow | undefined;

      yield* Effect.acquireRelease(
        Effect.sync(() => {
          const activate = () => {
            Queue.offerUnsafe(events, "activate");
          };
          const closed = () => {
            Queue.offerUnsafe(events, "windows-closed");
          };
          const quit = (event: Electron.Event) => {
            event.preventDefault();
            Queue.offerUnsafe(events, "quit");
          };
          app.on("activate", activate);
          app.on("window-all-closed", closed);
          app.on("before-quit", quit);
          return { activate, closed, quit };
        }),
        ({ activate, closed, quit }) =>
          Effect.sync(() => {
            app.removeListener("activate", activate);
            app.removeListener("window-all-closed", closed);
            app.removeListener("before-quit", quit);
            if (window && !window.isDestroyed()) window.destroy();
          }),
      );

      const openWindow = Effect.fn("Desktop.openWindow")(function* () {
        if (window && !window.isDestroyed()) {
          yield* Effect.sync(() => window?.focus());
          return;
        }
        const created = yield* Effect.try({
          try: () =>
            new BrowserWindow({
              title: "Everdiff",
              width: 1100,
              height: 760,
              minWidth: 480,
              minHeight: 320,
              show: false,
              backgroundColor: "#111113",
              autoHideMenuBar: true,
              webPreferences: {
                sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true,
              },
            }),
          catch: (cause) => new DesktopError({ operation: "create-window", cause }),
        });
        window = created;
        created.once("ready-to-show", () => {
          if (!created.isDestroyed()) created.show();
        });
        created.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
        created.webContents.on("will-navigate", (event) => event.preventDefault());
        created.webContents.on("will-attach-webview", (event) => event.preventDefault());

        yield* Effect.tryPromise({
          try: () => {
            const devUrl = !app.isPackaged ? process.env.EVERDIFF_RENDERER_URL : undefined;
            return devUrl
              ? created.loadURL(devUrl)
              : created.loadFile(path.join(app.getAppPath(), "dist/renderer/index.html"));
          },
          catch: (cause) => new DesktopError({ operation: "load-renderer", cause }),
        });
      });

      const run = Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () => app.whenReady(),
          catch: (cause) => new DesktopError({ operation: "ready", cause }),
        });
        yield* Effect.sync(() => {
          session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
            callback(false),
          );
          session.defaultSession.setPermissionCheckHandler(() => false);
          session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const policy = app.isPackaged
              ? "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://127.0.0.1:5173; object-src 'none'; base-uri 'none'; frame-src 'none'";
            callback({
              responseHeaders: { ...details.responseHeaders, "Content-Security-Policy": [policy] },
            });
          });
        });
        yield* openWindow();
        while (true) {
          const event = yield* Queue.take(events);
          if (event === "quit" || (event === "windows-closed" && process.platform !== "darwin"))
            return;
          if (event === "activate") yield* openWindow();
        }
      });

      return Desktop.of({ run });
    }),
  );
}
