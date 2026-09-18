# SHILLBAG

Shill the ticker. Catch the bag.

Tag a Solana memecoin on X. Raid your profile. Get paid in that coin.

| Piece | Host | What it is |
| --- | --- | --- |
| `frontend/` | Vercel | Next.js site. Browser talks to `/api/*`. |
| `server/` | Railway | Hono API: Phantom session, holdings, twtapi, raids, SPL payouts. |
| `database/` | Railway Postgres | Sessions, X links, claims, raid ledger. Schema applied on API boot. |

Live site: [https://shillbag-ivory.vercel.app](https://shillbag-ivory.vercel.app)  
Live API: [https://api-production-db6e88.up.railway.app/health](https://api-production-db6e88.up.railway.app/health)  
Railway: [railway.com/project/146ddba6-55ff-4a52-a255-9547a7b03c8c](https://railway.com/project/146ddba6-55ff-4a52-a255-9547a7b03c8c)

Shillers: Reply Guy → Quote Shill → Alpha Shill → Head Shill → Cult Leader.

Payouts are SPL transfers from the treasury (`7iC34S8Can9gosLceBYc5YT5FmLDxbVVfoygGLvFB7pX`). Fund that wallet with SOL (fees) and the memecoins you want to pay. Add `X_OAUTH_CLIENT_ID` / `X_OAUTH_CLIENT_SECRET` on Railway, and set the X callback to `https://shillbag-ivory.vercel.app/api/x/oauth/callback`. Add `TOKEN_ADDRESS` when `$BAG` has a mint.
