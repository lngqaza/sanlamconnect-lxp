require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(255) NOT NULL,
      category  VARCHAR(255) NOT NULL,
      target_level  INT NOT NULL DEFAULT 3,
      current_level INT,
      description   TEXT,
      tags          TEXT[]
    )
  `);
  fastify.log.info("Migration complete");
}

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
fastify.listen({ port, host: "0.0.0.0" })
  .then(() => migrate())
  .then(() => fastify.log.info(`lxp-api listening on 0.0.0.0:${port}`))
  .catch(err => { fastify.log.error(err); process.exit(1); });

 
 
