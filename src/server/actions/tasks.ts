"use server";

import * as dal from "../dal/tasks";
import { authedAction } from "../safe-action";
import {
  createSubtaskInput,
  createTaskInput,
  deleteSubtaskInput,
  deleteTaskInput,
  moveTaskInput,
  updateSubtaskInput,
  updateTaskInput,
} from "@/lib/schemas/input";

export const createTaskAction = authedAction
  .metadata({ name: "createTask" })
  .inputSchema(createTaskInput)
  .action(async ({ parsedInput, ctx }) => dal.createTask(ctx.userId, parsedInput));

export const updateTaskAction = authedAction
  .metadata({ name: "updateTask" })
  .inputSchema(updateTaskInput)
  .action(async ({ parsedInput, ctx }) => dal.updateTask(ctx.userId, parsedInput));

export const moveTaskAction = authedAction
  .metadata({ name: "moveTask" })
  .inputSchema(moveTaskInput)
  .action(async ({ parsedInput, ctx }) => dal.moveTask(ctx.userId, parsedInput));

export const deleteTaskAction = authedAction
  .metadata({ name: "deleteTask" })
  .inputSchema(deleteTaskInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deleteTask(ctx.userId, parsedInput.taskId);
    return { ok: true as const };
  });

export const createSubtaskAction = authedAction
  .metadata({ name: "createSubtask" })
  .inputSchema(createSubtaskInput)
  .action(async ({ parsedInput, ctx }) => dal.createSubtask(ctx.userId, parsedInput));

export const updateSubtaskAction = authedAction
  .metadata({ name: "updateSubtask" })
  .inputSchema(updateSubtaskInput)
  .action(async ({ parsedInput, ctx }) => dal.updateSubtask(ctx.userId, parsedInput));

export const deleteSubtaskAction = authedAction
  .metadata({ name: "deleteSubtask" })
  .inputSchema(deleteSubtaskInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deleteSubtask(ctx.userId, parsedInput.subtaskId);
    return { ok: true as const };
  });
