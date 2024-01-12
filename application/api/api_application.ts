import { Application, send } from "oak";
import { Board } from "../../domain/board.ts";
import { createRouter } from "./router.ts";

export function createApiApplication(
  board: Board,
  healthCallback: () => [string, boolean],
): Application {
  const app = new Application();
  const router = createRouter(board, healthCallback);
  const ROOT_DIR = "./frontend";

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch(error) {
      ctx.response.headers.set("Content-Type", "text/plain");
      ctx.response.status = 500;
      ctx.response.body = error.message;
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/api")) {
      return next();
    }

    if (ctx.request.url.pathname.split("/").filter((i) => i).length > 1) {
      ctx.response.status = 404;
      ctx.response.body = "Not found - cannot get static file of directory";
      return next();
    }

    const filePath = ctx.request.url.pathname.replace("/", "");
    await send(ctx, filePath || "index.html", {
      root: ROOT_DIR,
      extensions: ["html", "js", "css", "json"],
    });
  });

  return app;
}
