require("dotenv").config();

const fastify = require("fastify")({ logger: true });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

fastify.get("/health", async () => ({ status: "ok" }));
fastify.get("/", async () => ({ service: "lxp-api", status: "running" }));

fastify.get("/skills", async (request, reply) => {
  try {
    const result = await pool.query("SELECT * FROM skills");
    return result.rows;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: "Failed to fetch skills" });
  }
});

const port = Number(process.env.PORT || 3001);
const host = "0.0.0.0";

fastify
  .listen({ port, host })
  .then(() => fastify.log.info(`✅ lxp-api listening on http://${host}:${port}`))
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
