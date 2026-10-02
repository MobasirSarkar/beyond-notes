"use server";

import * as dal from "../dal/notes";
import { authedAction } from "../safe-action";
import { createNoteInput, deleteNoteInput, updateNoteInput } from "@/lib/schemas/input";

export const createNoteAction = authedAction
  .metadata({ name: "createNote" })
  .inputSchema(createNoteInput)
  .action(async ({ parsedInput, ctx }) => dal.createNote(ctx.userId, parsedInput));

export const updateNoteAction = authedAction
  .metadata({ name: "updateNote" })
  .inputSchema(updateNoteInput)
  .action(async ({ parsedInput, ctx }) => dal.updateNote(ctx.userId, parsedInput));

export const deleteNoteAction = authedAction
  .metadata({ name: "deleteNote" })
  .inputSchema(deleteNoteInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deleteNote(ctx.userId, parsedInput.noteId);
    return { ok: true as const };
  });
