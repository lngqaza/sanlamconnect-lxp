"use server"

import { revalidatePath } from "next/cache"
import { Skill } from "@/types/skill"

const API_URL = process.env.API_URL || "http://localhost:3001"

export async function updateSkillLevel(
  id: number,
  currentLevel: number
): Promise<{ skill?: Skill; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/skills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_level: currentLevel }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: body.error || "Failed to update skill" }
    }
    const skill: Skill = await res.json()
    revalidatePath("/")
    return { skill }
  } catch (err) {
    return { error: "Network error — could not reach backend" }
  }
}
