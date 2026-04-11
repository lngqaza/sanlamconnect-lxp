require("dotenv").config();

const fastify = require("fastify")({ logger: true });

fastify.get("/health", async () => ({ status: "ok" }));
fastify.get("/", async () => ({ service: "lxp-api", status: "running" }));

const port = Number(process.env.PORT || 3001);
const host = "0.0.0.0";

fastify
  .listen({ port, host })
  .then(() => fastify.log.info(`✅ lxp-api listening on http://${host}:${port}`))
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });