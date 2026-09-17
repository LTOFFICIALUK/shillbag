Railway hosts this Postgres. The API applies `schema.sql` on boot.

Local:

```bash
cd database
docker compose up -d
```

`DATABASE_URL=postgres://shillbag:shillbag@localhost:5433/shillbag`
