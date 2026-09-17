import { TOKEN_SYMBOL } from "./config";
import type { TwtTweet } from "./twtapi";

export const demoTweets = (username: string, cutoff: number): TwtTweet[] => {
  const now = Date.now();
  const within = (hoursAgo: number) =>
    new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

  const tweets: TwtTweet[] = [
    {
      tweet_id: `demo-${username}-bonk`,
      user_id: "demo",
      username,
      text: `$BONK still printing. Dogs run this chain.`,
      created_at: within(1.5),
      reply_count: 31,
      retweet_count: 18,
      quote_count: 6,
      like_count: 214,
      is_retweet: false,
    },
    {
      tweet_id: `demo-${username}-wif`,
      user_id: "demo",
      username,
      text: `Hat stays on. $WIF is the only chart I respect.`,
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
      text: `Shilled $${TOKEN_SYMBOL} into the void. Catch the bag.`,
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
      text: `$PENGU was a vibe last week.`,
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
