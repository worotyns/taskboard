import { assertEquals, assertRejects, assertThrows } from "asserts";
import { WhatToDoNext } from "./wtdn.ts";
import { Task } from "./task.ts";
import { createMemory } from "atoms";

Deno.test("Board test", async function () {
  const { persist, restore, data } = createMemory();

  const board = new WhatToDoNext();

  const task1 = Task.create("Task 1", "Creator1");

  assertEquals(task1.description, "Task 1");
  assertEquals(task1.creator, "Creator1");

  task1.vote("Voter1");
  task1.vote("Voter2");

  assertEquals(task1.voters, ["Voter1", "Voter2"]);

  assertThrows(() => {
    task1.vote("Voter1"); // Duplicate vote
  });

  assertThrows(() => {
    task1.markAsCompleted("Creator2"); // Only the creator can mark as completed
  });

  board.addTask(task1);

  assertEquals(board.getTasks().length, 1);

  await persist(board);

  const restored = await restore(board.identity, WhatToDoNext);

  assertEquals(restored.getTasks().length, 1);
  assertEquals(restored.getTasks()[0].voters.length, 2);
  assertEquals(restored.getTasks()[0].description, "Task 1");
});
