import { listBoards } from "@/server/dal/boards";
import { authedGet } from "@/server/api";

export const GET = authedGet(null, ({ userId }) => listBoards(userId));
