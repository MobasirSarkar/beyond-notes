"use server";

import * as dal from "../dal/boards";
import { authedAction } from "../safe-action";
import {
  createBoardInput,
  createColumnInput,
  deleteBoardInput,
  deleteColumnInput,
  moveColumnInput,
  renameBoardInput,
  updateColumnInput,
} from "@/lib/validation";

export const createBoardAction = authedAction
  .metadata({ name: "createBoard" })
  .inputSchema(createBoardInput)
  .action(async ({ parsedInput, ctx }) => dal.createBoard(ctx.userId, parsedInput.name));

export const renameBoardAction = authedAction
  .metadata({ name: "renameBoard" })
  .inputSchema(renameBoardInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.renameBoard(ctx.userId, parsedInput.boardId, parsedInput.name);
    return { ok: true as const };
  });

export const deleteBoardAction = authedAction
  .metadata({ name: "deleteBoard" })
  .inputSchema(deleteBoardInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deleteBoard(ctx.userId, parsedInput.boardId);
    return { ok: true as const };
  });

export const createColumnAction = authedAction
  .metadata({ name: "createColumn" })
  .inputSchema(createColumnInput)
  .action(async ({ parsedInput, ctx }) =>
    dal.createColumn(ctx.userId, parsedInput.boardId, parsedInput.name),
  );

export const updateColumnAction = authedAction
  .metadata({ name: "updateColumn" })
  .inputSchema(updateColumnInput)
  .action(async ({ parsedInput: { columnId, ...patch }, ctx }) =>
    dal.updateColumn(ctx.userId, columnId, patch),
  );

export const moveColumnAction = authedAction
  .metadata({ name: "moveColumn" })
  .inputSchema(moveColumnInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.moveColumn(ctx.userId, parsedInput.columnId, parsedInput.direction);
    return { ok: true as const };
  });

export const deleteColumnAction = authedAction
  .metadata({ name: "deleteColumn" })
  .inputSchema(deleteColumnInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deleteColumn(ctx.userId, parsedInput.columnId);
    return { ok: true as const };
  });
