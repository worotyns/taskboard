import { load } from "dotenv";
import { createApiApplication } from "./application/api/api_application.ts";
import { ProcessManager } from "./application/process_manager.ts";
import { createLogger } from "./application/logger.ts";
import { createFs } from "atoms";
import { WhatToDoNext } from "./domain/wtdn.ts";

const logger = createLogger();
await load({ export: true, allowEmptyValues: true });

const entrypoint: string = Deno.env.get("ATOMS_ENTRYPOINT") || "wtdn_prod";
const path: string = Deno.env.get("ATOMS_PATH")!;

logger.info(`Entrypoint is: ${entrypoint}, path: ${path}`);

const { persist, restore } = createFs(path);

let wtdn: WhatToDoNext;

try {
  wtdn = await restore(entrypoint, WhatToDoNext);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    wtdn = WhatToDoNext.createWithIdentity(entrypoint);
    logger.info("File not found, start fresh instance: " + entrypoint);
  } else {
    logger.error(error);
    Deno.exit(1);
  }
}

const app = createApiApplication(
  wtdn, 
  () => ["Hello!", true],
  () => persist(wtdn)
);

const persistInterval = ~~(Deno.env.get("ATOMS_PERSIST_INTERVAL") || "300_000");

setInterval(async () => {
  await persist(wtdn);
}, persistInterval);

const abortController = new AbortController();

const serverPromise = app.listen({
  hostname: Deno.env.get("API_SERVER_BIND_ADDR") || "0.0.0.0",
  port: ~~(Deno.env.get("API_SERVER_PORT") || "8000"),
  signal: abortController.signal,
});

ProcessManager.create(
  [
    async () => {
      logger.log("Stopping server");
      await serverPromise;
    },
    async () => {
      logger.log("Persisting data");
      await persist(wtdn);
    },
  ],
  abortController,
  logger,
);
