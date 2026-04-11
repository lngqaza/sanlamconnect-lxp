require("dotenv").config();
const fastify = require("fastify")({ logger: true });

fastify.get("/health", async () => ({ status: "ok" }));
fastify.get("/", async () => ({ service: "lxp-api", status: "running" }));

const port = Number(process.env.PORT || 3001);
fastify.listen({ port, host: "0.0.0.0" })
  .then(() => fastify.log.info(`✅ lxp-api listening on 0.0.0.0:${port}`))
  .catch(err => { fastify.log.error(err); process.exit(1); });