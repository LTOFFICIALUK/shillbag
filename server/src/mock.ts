import { TOKEN_SYMBOL } from "./config";
import type { TwtTweet } from "./twtapi";

export const demoTweets = (username: string, cutoff: number): TwtTweet[] => {
  const now = Date.now();
  const within = (hoursAgo: number) =>
    new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

  const tweets: TwtTweet[] = [
    {
      tweet_id: `demo-${username}-solcat`,
      user_id: "demo",
      username,
      text: `now lets see what happens with solana:9U1f18idDeySFnYrurxqT1f5n5nE4g4Uk5LLzP69bh1`,
      created_at: within(1.5),
      reply_count: 31,
      retweet_count: 18,
      quote_count: 6,
      like_count: 214,
      is_retweet: false,
    },
    {
      tweet_id: `demo-${username}-pump`,
      user_id: "demo",
      username,
      text: `cooked https://pump.fun/coin/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump`,
      urls: [
        "https://pump.fun/coin/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
      ],
      created_at: within(3),
      reply_count: 12,
      retweet_count: 9,
      quote_count: 2,
      like_count: 88,
      is_retweet: false,
    },
    {
      tweet_id: `demo-${username}-token`,
      user_id: "demo",
      username,
      text: `Shilled $${TOKEN_SYMBOL} into the void.`,
      created_at: within(5),
      reply_count: 7,
      retweet_count: 22,
      quote_count: 4,
      like_count: 101,
      is_retweet: false,
    },
    {
      tweet_id: `demo-${username}-old`,
      user_id: "demo",
      username,
      text: `that ticker was a vibe last week.`,
      created_at: within(40),
      reply_count: 4,
      retweet_count: 2,
      quote_count: 1,
      like_count: 19,
      is_retweet: false,
    },
  ];

  return tweets.filter((tweet) => Date.parse(tweet.created_at) >= cutoff);
};
