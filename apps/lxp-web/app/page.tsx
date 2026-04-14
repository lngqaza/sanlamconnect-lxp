import { cacheTag } from "next/cache"
import { Skill } from "@/types/skill"
import SkillsDashboard from "@/app/components/SkillsDashboard"

async function getSkills(): Promise<Skill[]> {
  "use cache"
  cacheTag("skills")
  try {
    const res = await fetch(
      `${process.env.API_URL || "http://localhost:3001"}/skills`,
      { cache: "no-store" }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function Page() {
  const skills = await getSkills()
  return <SkillsDashboard skills={skills} />
}
