"use server";

import * as dal from "../dal/focus";
import { authedAction } from "../safe-action";
import { logFocusInput } from "@/lib/schemas/input";

export const logFocusAction = authedAction
  .metadata({ name: "logFocus" })
  .inputSchema(logFocusInput)
  .action(async ({ parsedInput, ctx }) => dal.logFocusSession(ctx.userId, parsedInput));
