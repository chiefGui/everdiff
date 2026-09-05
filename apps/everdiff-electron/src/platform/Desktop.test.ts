import { Effect, Exit, Fiber } from "effect";
import { app, BrowserWindow } from "electron";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Desktop } from "./Desktop";

vi.mock("electron", async () => {
  const { EventEmitter } = await import("node:events");
  class Window extends EventEmitter {
    static instances: Window[] = [];
    static getAllWindows = () => Window.instances;
    destroyed = false;
    webContents = Object.assign(new EventEmitter(), { setWindowOpenHandler: vi.fn() });
    loadFile = vi.fn().mockResolvedValue(undefined);
    loadURL = vi.fn().mockResolvedValue(undefined);
    focus = vi.fn();
    show = vi.fn();
    destroy = vi.fn(() => {
      this.destroyed = true;
    });
    isDestroyed = () => this.destroyed;
    constructor() {
      super();
      Window.instances.push(this);
    }
  }
  return {
    BrowserWindow: Window,
    app: Object.assign(new EventEmitter(), {
      whenReady: vi.fn().mockResolvedValue(undefined),
      getAppPath: () => "/everdiff",
      isPackaged: true,
    }),
    session: {
      defaultSession: {
        setPermissionRequestHandler: vi.fn(),
        setPermissionCheckHandler: vi.fn(),
        webRequest: { onHeadersReceived: vi.fn() },
      },
    },
  };
});

const program = Effect.gen(function* () {
  const desktop = yield* Desktop;
  yield* desktop.run;
}).pipe(Effect.provide(Desktop.layer));

let fiber: Fiber.Fiber<void, unknown> | undefined;

afterEach(async () => {
  if (fiber) await Effect.runPromise(Fiber.interrupt(fiber));
  fiber = undefined;
  BrowserWindow.getAllWindows().splice(0);
  vi.clearAllMocks();
});

describe("Desktop lifetime", () => {
  it("reuses the window on activation and releases resources before quitting", async () => {
    fiber = Effect.runFork(program);
    await vi.waitFor(() => expect(BrowserWindow.getAllWindows()).toHaveLength(1));
    const window = BrowserWindow.getAllWindows()[0]!;
    app.emit("activate");
    await vi.waitFor(() => expect(window.focus).toHaveBeenCalledOnce());
    expect(BrowserWindow.getAllWindows()).toHaveLength(1);

    const preventDefault = vi.fn();
    app.emit("before-quit", { preventDefault });
    await Effect.runPromise(Fiber.join(fiber));
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(window.destroy).toHaveBeenCalledOnce();
    for (const event of ["activate", "before-quit", "window-all-closed"]) {
      expect(app.listenerCount(event)).toBe(0);
    }
  });

  it("recreates a closed window on activation and cleans up on interruption", async () => {
    fiber = Effect.runFork(program);
    await vi.waitFor(() => expect(BrowserWindow.getAllWindows()).toHaveLength(1));
    BrowserWindow.getAllWindows()[0]!.destroy();
    app.emit("activate");
    await vi.waitFor(() => expect(BrowserWindow.getAllWindows()).toHaveLength(2));
    const reopened = BrowserWindow.getAllWindows()[1]!;
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(reopened.destroy).toHaveBeenCalledOnce();
    expect(app.listenerCount("before-quit")).toBe(0);
  });

  it("releases listeners when Electron readiness fails", async () => {
    vi.mocked(app.whenReady).mockRejectedValueOnce(new Error("startup failure"));
    const result = await Effect.runPromiseExit(program);
    expect(Exit.isFailure(result)).toBe(true);
    expect(BrowserWindow.getAllWindows()).toHaveLength(0);
    expect(app.listenerCount("activate")).toBe(0);
    expect(app.listenerCount("before-quit")).toBe(0);
  });
});
