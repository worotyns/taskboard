import { Task } from "../../../domain/task.ts";
import { PropertiesOnly } from "atoms";

interface BoardStats {
  total: number;
  completed: number;
  inprogress: number;
  archived: number;
}

export class BoardViewDto {
  public tasks: PropertiesOnly<Task>[];

  public stats: BoardStats = {
    total: 0,
    archived: 0,
    completed: 0,
    inprogress: 0,
  };

  constructor(
    tasks: Task[],
    archived: Task[],
  ) {
    this.tasks = tasks;
    this.stats.archived = archived.length;
    for (const task of tasks) {
      this.stats.total++;
      if (task.completed) {
        this.stats.completed++;
      } else if (task.assigned) {
        this.stats.inprogress++;
      }
    }
  }
}
