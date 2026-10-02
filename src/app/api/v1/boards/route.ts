import { listBoards } from "@/server/dal/boards";
import { authedGet, noQuery } from "@/server/api";

export const GET = authedGet(noQuery, ({ userId }) => listBoards(userId));
