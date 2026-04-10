import Fastify from "fastify"
import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const app = Fastify()
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

app.get("/health", async () => ({ status: "ok" }))

app.get("/skills", async () => {
  const res = await pool.query("SELECT * FROM skills")
  return res.rows
})

app.listen({ port: 3001 }, () =>
  console.log("API running on http://localhost:3001")
)