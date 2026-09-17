import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app";
import { migrate } from "./db";

const port = Number(process.env.PORT ?? 4000);

const start = async () => {
  await migrate();
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
    console.log(`SHILLBAG API on :${info.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
