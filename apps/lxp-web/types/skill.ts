export interface Skill {
  id: number
  name: string
  category: string
  target_level: number
  current_level: number | null
  description: string | null
  tags: string[] | null
}

export interface Category {
  category: string
  skill_count: string
}

export const LEVEL_LABELS: Record<number, string> = {
  0: "Not Started",
  1: "Awareness",
  2: "Basic",
  3: "Competent",
  4: "Advanced",
  5: "Expert",
}

export const LEVEL_COLORS: Record<number, string> = {
  0: "#CBD5E1",
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#14B8A6",
  5: "#002060",
}
