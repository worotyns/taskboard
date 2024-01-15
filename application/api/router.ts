import { Context, Router } from "oak";
import { WhatToDoNext } from "../../domain/wtdn.ts";
import { BoardViewDto } from "./dtos/board_dto.ts";
import { Task } from "../../domain/task.ts";

export function createRouter(
  board: WhatToDoNext,
  healthCallback: () => [string, boolean],
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

  const resolveUserAndSetResponseHeader = (context: Context) => {
    const cfHeader = context.request.headers.get("CF_Authorization");
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
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);
      const body = await context.request.body({ type: "json" }).value;

      board.addTask(
        Task.create(body.description, user),
      );

      context.response.status = 200;
    })
    .get("/api/tasks/assign", (context) => {
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      board.assignToFirstWithHighVotesUnassigned(user);
      context.response.status = 200;
    })
    .delete("/api/tasks/:identity/unassign", (context) => {
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.unassign(user);
      context.response.status = 200;
    })
    .delete("/api/tasks/:identity", (context) => {
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      board.archiveTask(board.getTask(context.params.identity));
      context.response.status = 200;
    })
    .put("/api/tasks/:identity/complete", (context) => {
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.markAsCompleted(user);
      context.response.status = 200;
    })
    .put("/api/tasks/:identity/vote", (context) => {
      const user = resolveUserAndSetResponseHeader(context);
      assertIsNotAnonymous(user, context);

      const task = board.getTask(context.params.identity);
      task.vote(user);
      context.response.status = 200;
    });

  return router;
}
