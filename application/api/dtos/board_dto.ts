import { Task } from "../../../domain/task.ts";
import { PropertiesOnly } from "atoms";

export class BoardViewDto {
  public tasks: PropertiesOnly<Task>[];

  constructor(
    tasks: Task[],
  ) {
    this.tasks = tasks;
  }
}
