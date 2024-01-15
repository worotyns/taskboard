import { Context, Router } from "oak";
import { WhatToDoNext } from "../../domain/wtdn.ts";
import { BoardViewDto } from "./dtos/board_dto.ts";
import { Task } from "../../domain/task.ts";

export function createRouter(
  board: WhatToDoNext,
  healthCallback: () => [string, boolean],
  persistCallback: () => Promise<void>,
): Router {
  const router = new Router();

  router.get("/ping", (context) => {
    context.response.body = "pong";
    context.response.status = 200;
  });

  router.get("/health", (context) => {
    const [msg, ok] = healthCallback();
    context.response.body = msg;
    context.response.status = ok ? 200 : 500;
  });

  const assertIsNotAnonymous = (resolvedUser: string, context: Context) => {
    if (resolvedUser === "anonymous") {
      context.response.status = 403;
      context.response.body = "Cannot perform action as anonymous user.";
      throw new Error("Cannot perform action as anonymous user.");
    }
  };

  const resolveUserAndSetResponseHeader = async (context: Context) => {
    const cfHeader = await context.cookies.get("CF_Authorization");
    const [_alg, content, _sig] = cfHeader?.split(".") || [];

    let actAsUser = "anonymous";

    if (content) {
      const decoded = atob(content);
      if (decoded.startsWith("{")) {
        const parsed = JSON.parse(decoded);
        // Without any validation of signature, just a internal app..
        actAsUser = parsed.email || actAsUser;
      }
    }

    context.response.headers.set("X-User", actAsUser);
    return actAsUser;
  };

  router
    .get("/api/tasks", (context) => {
      resolveUserAndSetResponseHeader(context);
      context.response.body = new BoardViewDto(
        board.getTasks(),
        board.archive,
      );
      context.response.headers.set("Content-Type", "application/json");
      context.response.status = 200;
    })
    .post("/api/tasks", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);
      const body = await context.request.body({ type: "json" }).value;

      board.addTask(
        Task.create(body.description, user),
      );
      
      context.response.status = 200;
      await persistCallback();
    })
    .get("/api/tasks/assign", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      board.assignToFirstWithHighVotesUnassigned(user);
      context.response.status = 200;
      await persistCallback();
    })
    .delete("/api/tasks/:identity/unassign", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.unassign(user);
      context.response.status = 200;
      await persistCallback();
    })
    .delete("/api/tasks/:identity", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      board.archiveTask(board.getTask(context.params.identity));
      context.response.status = 200;
      await persistCallback();
    })
    .put("/api/tasks/:identity/complete", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.markAsCompleted(user);
      context.response.status = 200;
      await persistCallback();
    })
    .put("/api/tasks/:identity/vote", async (context) => {
      const user = await resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.vote(user);
      context.response.status = 200;
      await persistCallback();
    });

  return router;
}
