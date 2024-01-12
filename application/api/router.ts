import { Context, Router } from "oak";
import { Board } from "../../domain/board.ts";
import { BoardViewDto } from "./dtos/board_dto.ts";
import { Task } from "../../domain/task.ts";

export function createRouter(
  board: Board,
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

  const resolveUser = (context: Context) => {
    return context.request.headers.get("x-user") || "anonymous";
  };

  router
    .get("/api/tasks", (context) => {
      context.response.body = new BoardViewDto(
        board.getTasks(),
      );
      context.response.headers.set("Content-Type", "application/json");
      context.response.status = 200;
    })
    .post("/api/tasks", async (context) => {
      const user = resolveUser(context);
      const body = await context.request.body({ type: "json" }).value;

      board.addTask(
        Task.create(body.description, user),
      );

      context.response.status = 200;
    })
    .get("/api/tasks/assign", (context) => {
      const user = resolveUser(context);
      board.assignToFirstWithHighVotesUnassigned(user);
      context.response.status = 200;
    })
    .delete("/api/tasks/:identity", (context) => {
      board.archiveTask(board.getTask(context.params.identity));
      context.response.status = 200;
    })
    .put("/api/tasks/:identity/complete", (context) => {
      const task = board.getTask(context.params.identity);
      task.markAsCompleted(resolveUser(context));
      context.response.status = 200;
    })
    .put("/api/tasks/:identity/vote", (context) => {
      const task = board.getTask(context.params.identity);
      task.vote(resolveUser(context));
      context.response.status = 200;
    });

  return router;
}
