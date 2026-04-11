import { Skill } from "@/packages/shared-types/skill"

async function getSkills(): Promise<Skill[]> {
  const res = await fetch(`${process.env.API_URL || "http://localhost:3001"}/skills`, {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("Failed to fetch skills")
  }

  return res.json()
}

export default async function Page() {
  const skills = await getSkills()

  return (
    <main>
      <h1>Sanlam LXP</h1>

      {skills.length === 0 ? (
        <p>No skills found</p>
      ) : (
        <ul>
          {skills.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> — {s.category}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
} 
