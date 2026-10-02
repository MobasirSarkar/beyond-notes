import { searchQuery } from "@/lib/schemas/input";
import { authedGet } from "@/server/api";
import { searchEverything } from "@/server/dal/search";

export const GET = authedGet(searchQuery, ({ userId, query }) => searchEverything(userId, query.q));
