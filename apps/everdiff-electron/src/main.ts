import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import { app } from "electron";
import { Cause, Effect, Exit } from "effect";
import { Desktop } from "./platform/Desktop";

const program = Effect.gen(function* () {
  const desktop = yield* Desktop;
  yield* desktop.run;
}).pipe(Effect.provide(Desktop.layer));

NodeRuntime.runMain(program, {
  // Electron exits only after Effect has released windows and event listeners.
  teardown: (exit) =>
    app.exit(Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause) ? 1 : 0),
});
