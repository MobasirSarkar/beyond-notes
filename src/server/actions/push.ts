"use server";

import { headers } from "next/headers";

import * as dal from "../dal/push";
import { ActionError } from "../errors";
import { pushEnabled } from "../push";
import { authedAction } from "../safe-action";
import { pushSubscriptionInput, unsubscribePushInput } from "@/lib/validation";

export const subscribePushAction = authedAction
  .metadata({ name: "subscribePush" })
  .inputSchema(pushSubscriptionInput)
  .action(async ({ parsedInput, ctx }) => {
    if (!pushEnabled)
      throw new ActionError("Push notifications are not configured on this server.");
    const ua = (await headers()).get("user-agent");
    await dal.savePushSubscription(ctx.userId, parsedInput, ua);
    return { ok: true as const };
  });

export const unsubscribePushAction = authedAction
  .metadata({ name: "unsubscribePush" })
  .inputSchema(unsubscribePushInput)
  .action(async ({ parsedInput, ctx }) => {
    await dal.deletePushSubscription(ctx.userId, parsedInput.endpoint);
    return { ok: true as const };
  });
