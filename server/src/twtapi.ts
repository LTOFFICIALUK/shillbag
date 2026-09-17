import { TWTAPI_BASE, TWTAPI_KEY } from "./config";

export type TwtUser = {
  user_id: string;
  username: string;
  name?: string;
  description?: string;
  followers?: number;
  following?: number;
  protected?: boolean;
};

export type TwtTweet = {
  tweet_id: string;
  user_id: string;
  username: string;
  text: string;
  created_at: string;
  reply_count: number;
  retweet_count: number;
  quote_count: number;
  like_count: number;
  is_reply?: boolean;
  is_retweet?: boolean;
  is_quote?: boolean;
  urls?: string[];
};

type Json = Record<string, unknown>;

export const twtapiEnabled = () => Boolean(TWTAPI_KEY);

export class TrafficError extends Error {
  constructor() {
    super("The site is congested right now. Try again in a minute.");
    this.name = "TrafficError";
  }
}

const asRecord = (value: unknown): Json | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;

const walk = (value: unknown, visit: (node: Json) => void) => {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  const node = asRecord(value);
  if (!node) return;
  visit(node);
  for (const child of Object.values(node)) walk(child, visit);
};

const screenName = (user: Json | null) => {
  const core = asRecord(user?.core);
  return String(
    core?.screen_name ?? user?.screen_name ?? user?.username ?? "",
  );
};

const tweetFromNode = (node: Json): TwtTweet | null => {
  const result = asRecord(node.result) ?? node;
  const legacy = asRecord(result.legacy);
  if (!legacy) return null;
  const text = String(legacy.full_text ?? legacy.text ?? "");
  const tweetId = String(result.rest_id ?? legacy.id_str ?? "");
  if (!tweetId || !text) return null;
  const core = asRecord(result.core);
  const userResults = asRecord(core?.user_results);
  const user = asRecord(userResults?.result) ?? asRecord(result.user);
  const userId = String(
    user?.rest_id ?? legacy.user_id_str ?? result.user_id_str ?? "",
  );
  const entities = asRecord(legacy.entities);
  const urlNodes = Array.isArray(entities?.urls) ? entities.urls : [];
  const urls = urlNodes
    .map((item) => {
      const node = asRecord(item);
      return String(node?.expanded_url ?? node?.url ?? "");
    })
    .filter(Boolean);
  return {
    tweet_id: tweetId,
    user_id: userId,
    username: screenName(user),
    text,
    urls,
    created_at: String(legacy.created_at ?? ""),
    reply_count: Number(legacy.reply_count ?? 0),
    retweet_count: Number(legacy.retweet_count ?? 0),
    quote_count: Number(legacy.quote_count ?? 0),
    like_count: Number(legacy.favorite_count ?? 0),
    is_reply: Boolean(legacy.in_reply_to_status_id_str),
    is_retweet: Boolean(
      asRecord(legacy.retweeted_status_result) ||
        asRecord(result.retweeted_status_result) ||
        String(text).startsWith("RT @"),
    ),
    is_quote: Boolean(legacy.is_quote_status),
  };
};

const userFromNode = (node: Json): TwtUser | null => {
  const result = asRecord(node.result) ?? node;
  if (result.__typename && result.__typename !== "User") return null;
  const core = asRecord(result.core);
  const username = String(core?.screen_name ?? result.screen_name ?? "");
  const userId = String(result.rest_id ?? result.id_str ?? "");
  if (!userId || !username) return null;
  const bio = asRecord(result.profile_bio);
  const counts = asRecord(result.relationship_counts);
  const privacy = asRecord(result.privacy);
  return {
    user_id: userId,
    username,
    name: String(core?.name ?? result.name ?? username),
    description: String(bio?.description ?? result.description ?? ""),
    followers: Number(counts?.followers ?? result.followers ?? 0),
    following: Number(counts?.following ?? result.following ?? 0),
    protected: Boolean(privacy?.protected ?? result.protected),
  };
};

const extractTweets = (payload: unknown, onlyUserId?: string) => {
  const tweets: TwtTweet[] = [];
  const seen = new Set<string>();
  walk(payload, (node) => {
    if (node.__typename !== "Tweet" && !asRecord(node.legacy)) return;
    const tweet = tweetFromNode(node);
    if (!tweet || seen.has(tweet.tweet_id)) return;
    if (onlyUserId && tweet.user_id && tweet.user_id !== onlyUserId) return;
    seen.add(tweet.tweet_id);
    tweets.push(tweet);
  });
  return tweets;
};

const extractUsers = (payload: unknown) => {
  const users: TwtUser[] = [];
  const seen = new Set<string>();
  walk(payload, (node) => {
    if (node.__typename !== "User" && !asRecord(node.core)?.screen_name) return;
    const user = userFromNode(node);
    if (!user || seen.has(user.user_id)) return;
    seen.add(user.user_id);
    users.push(user);
  });
  return users;
};

const extractBottomCursor = (payload: unknown) => {
  let cursor: string | undefined;
  walk(payload, (node) => {
    if (node.cursor_type === "Bottom" && typeof node.value === "string") {
      cursor = node.value;
    }
  });
  return cursor;
};

const twtapiFetch = async (
  path: string,
  params: Record<string, string | number | undefined> = {},
) => {
  if (!TWTAPI_KEY) {
    throw new Error("TWTAPI_KEY is not configured");
  }

  const url = new URL(path, `${TWTAPI_BASE.replace(/\/$/, "")}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "X-API-Key": TWTAPI_KEY,
      Authorization: `Bearer ${TWTAPI_KEY}`,
    },
    cache: "no-store",
  }).catch(() => {
    throw new TrafficError();
  });

  const body = (await response.json().catch(() => ({}))) as Json & {
    code?: number;
    msg?: string;
    error?: string;
    retry_after?: number;
    data?: unknown;
  };

  if (
    response.status === 429 ||
    body.code === 429 ||
    response.status >= 500 ||
    !response.ok
  ) {
    throw new TrafficError();
  }

  if (typeof body.code === "number" && body.code !== 200) {
    throw new TrafficError();
  }

  return body;
};

export const resolveUser = async (username: string) => {
  const handle = username.replace(/^@/, "");
  const payload = await twtapiFetch("/api/v1/twitter/Search", {
    q: `from:${handle}`,
    type: "Latest",
    count: 5,
  });
  const fromTweet = extractTweets(payload).find(
    (tweet) => tweet.username.toLowerCase() === handle.toLowerCase(),
  );
  if (fromTweet) {
    return {
      user_id: fromTweet.user_id,
      username: fromTweet.username,
    } satisfies TwtUser;
  }
  const people = await twtapiFetch("/api/v1/twitter/Search", {
    q: handle,
    type: "People",
    count: 10,
  });
  const match = extractUsers(people).find(
    (user) => user.username.toLowerCase() === handle.toLowerCase(),
  );
  if (!match) throw new Error(`Could not resolve @${handle} on X.`);
  return match;
};

export const listUserTweets = async (userId: string, cursor?: string) => {
  const payload = await twtapiFetch("/api/v1/twitter/UserTweets", {
    user_id: userId,
    count: 40,
    cursor,
  });
  return {
    tweets: extractTweets(payload, userId),
    cursor_bottom: extractBottomCursor(payload),
  };
};

export const listFollowing = async (userId: string, cursor?: string) => {
  const payload = await twtapiFetch("/api/v1/twitter/Following", {
    user_id: userId,
    count: 200,
    cursor,
  });
  return {
    users: extractUsers(payload).map((user) => ({
      user_id: user.user_id,
      username: user.username,
      screen_name: user.username,
    })),
    cursor_bottom: extractBottomCursor(payload),
  };
};

export const userTweetsContain = async (
  userId: string,
  needle: string,
  pages = 1,
) => {
  let cursor: string | undefined;
  const lowered = needle.toLowerCase();
  for (let page = 0; page < pages; page += 1) {
    const result = await listUserTweets(userId, cursor);
    const hit = result.tweets.find((tweet) =>
      tweet.text.toLowerCase().includes(lowered),
    );
    if (hit) return hit;
    if (!result.cursor_bottom) break;
    cursor = result.cursor_bottom;
  }
  return null;
};
