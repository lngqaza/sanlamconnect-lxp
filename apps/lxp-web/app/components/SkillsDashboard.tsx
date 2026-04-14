"use client"

import { useState, useTransition, useCallback } from "react"
import { Skill, LEVEL_LABELS, LEVEL_COLORS } from "@/types/skill"
import { updateSkillLevel } from "@/app/actions"

interface Props {
  skills: Skill[]
}

interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip({ skills }: { skills: Skill[] }) {
  const total = skills.length
  const withLevel = skills.filter((s) => s.current_level !== null && s.current_level > 0)
  const atTarget = skills.filter(
    (s) => s.current_level !== null && s.current_level >= s.target_level
  )
  const avgProgress =
    withLevel.length === 0
      ? 0
      : Math.round(
          withLevel.reduce((sum, s) => sum + (s.current_level! / s.target_level) * 100, 0) /
            withLevel.length
        )

  const categoryCount = new Set(skills.map((s) => s.category)).size

  return (
    <div className="stats-strip">
      <div className="stat-card">
        <div className="stat-card-value">{total}</div>
        <div className="stat-card-label">Total Skills</div>
        <div className="stat-card-bar">
          <div className="stat-card-bar-fill" style={{ width: "100%" }} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card-value">{categoryCount}</div>
        <div className="stat-card-label">Categories</div>
        <div className="stat-card-bar">
          <div className="stat-card-bar-fill" style={{ width: "100%" }} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card-value" style={{ color: "var(--teal)" }}>
          {atTarget.length}
        </div>
        <div className="stat-card-label">At Target Level</div>
        <div className="stat-card-bar">
          <div
            className="stat-card-bar-fill"
            style={{ width: `${total === 0 ? 0 : (atTarget.length / total) * 100}%` }}
          />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-card-value" style={{ color: avgProgress >= 80 ? "var(--teal)" : "var(--gold-dark)" }}>
          {avgProgress}%
        </div>
        <div className="stat-card-label">Avg Progress</div>
        <div className="stat-card-bar">
          <div className="stat-card-bar-fill" style={{ width: `${avgProgress}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Skill Card ───────────────────────────────────────────────────────────────

interface SkillCardProps {
  skill: Skill
  onLevelChange: (id: number, level: number) => Promise<void>
  isSaving: boolean
}

function SkillCard({ skill, onLevelChange, isSaving }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false)

  const currentLvl = skill.current_level ?? 0
  const targetLvl = skill.target_level
  const progressPct = targetLvl === 0 ? 0 : Math.min(100, (currentLvl / targetLvl) * 100)
  const targetPct = Math.min(100, (targetLvl / 5) * 100)

  const levelColor = LEVEL_COLORS[currentLvl] ?? LEVEL_COLORS[0]
  const levelLabel = LEVEL_LABELS[currentLvl] ?? "Unknown"
  const isAtTarget = currentLvl >= targetLvl

  // Accent colour on left border changes with progress
  const accentColor = isAtTarget ? "var(--teal)" : currentLvl === 0 ? "var(--border)" : "var(--gold)"

  return (
    <div
      className={`skill-card${expanded ? " expanded" : ""}`}
      style={{ "--card-accent": accentColor } as React.CSSProperties}
    >
      <div onClick={() => setExpanded(!expanded)}>
        <div className="skill-card-header">
          <div>
            <div className="skill-card-name">{skill.name}</div>
            <div className="skill-card-category">{skill.category}</div>
          </div>
          <span
            className="skill-card-level-badge"
            style={{ background: levelColor }}
          >
            {levelLabel}
          </span>
        </div>

        {/* Progress bar */}
        <div className="skill-progress">
          <div className="skill-progress-labels">
            <span className="skill-progress-label">Level {currentLvl} of {targetLvl} target</span>
            <span className="skill-progress-label" style={{ color: isAtTarget ? "var(--teal)" : undefined }}>
              {isAtTarget ? "✓ On target" : `${Math.round(progressPct)}%`}
            </span>
          </div>
          <div className="skill-progress-track">
            <div
              className="skill-progress-fill"
              style={{
                width: `${progressPct}%`,
                background: isAtTarget ? "var(--teal)" : "linear-gradient(90deg, var(--gold), var(--teal))",
              }}
            />
            <div
              className="skill-progress-target"
              style={{ left: `calc(${targetPct}% - 1px)` }}
            />
          </div>
        </div>

        {/* Dot row */}
        <div className="skill-progress-dots">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div
              key={lvl}
              className={`skill-dot${lvl <= currentLvl ? " filled" : ""}${lvl === targetLvl ? " target" : ""}`}
              style={
                lvl <= currentLvl
                  ? { background: LEVEL_COLORS[currentLvl] }
                  : lvl === targetLvl
                  ? { background: "var(--navy)", opacity: 0.3 }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="skill-expand">
          {skill.description ? (
            <p className="skill-description">{skill.description}</p>
          ) : null}

          {skill.tags && skill.tags.length > 0 ? (
            <div className="skill-tags">
              {skill.tags.map((tag) => (
                <span key={tag} className="skill-tag">#{tag}</span>
              ))}
            </div>
          ) : null}

          {/* Level selector */}
          <div className="level-selector">
            <div className="level-selector-label">Update your current level</div>
            <div className="level-buttons">
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  className={`level-btn${currentLvl === lvl ? " current" : ""}${targetLvl === lvl ? " target-marker" : ""}${isSaving ? " saving" : ""}`}
                  disabled={isSaving}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isSaving && lvl !== currentLvl) onLevelChange(skill.id, lvl)
                  }}
                  title={LEVEL_LABELS[lvl]}
                  style={
                    currentLvl === lvl
                      ? { background: LEVEL_COLORS[lvl], borderColor: LEVEL_COLORS[lvl] }
                      : undefined
                  }
                >
                  <span className="lvl-num">{lvl}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
              Navy outline = target level · Click a number to update
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function SkillsDashboard({ skills: initialSkills }: Props) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [search, setSearch] = useState("")
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [, startTransition] = useTransition()

  const categories = ["All", ...Array.from(new Set(skills.map((s) => s.category))).sort()]

  const filtered = skills.filter((s) => {
    const matchCat = activeCategory === "All" || s.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch =
      q === "" ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.tags ?? []).some((t) => t.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  const handleLevelChange = useCallback(
    async (id: number, level: number) => {
      setSavingIds((prev) => new Set(prev).add(id))
      startTransition(async () => {
        const result = await updateSkillLevel(id, level)
        setSavingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        if (result.error) {
          addToast(`Error: ${result.error}`, "error")
        } else if (result.skill) {
          setSkills((prev) => prev.map((s) => (s.id === id ? result.skill! : s)))
          addToast(`${result.skill.name} updated to Level ${level}`, "success")
        }
      })
    },
    [addToast]
  )

  return (
    <>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-brand">
          <div className="app-header-logo">S</div>
          <div>
            <div className="app-header-title">Sanlam LXP</div>
            <div className="app-header-subtitle">Intermediary Skills Dashboard</div>
          </div>
        </div>
        <span className="app-header-badge">
          {skills.filter((s) => s.current_level !== null && s.current_level > 0).length} /{" "}
          {skills.length} In Progress
        </span>
      </header>

      <main className="app-main">
        {/* ── Stats ── */}
        <StatsStrip skills={skills} />

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search skills or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cat-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-tab${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat !== "All" && (
                  <span style={{ marginLeft: 4, opacity: 0.65 }}>
                    ({skills.filter((s) => s.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Skills grid ── */}
        <div className="section-heading">
          <h2>
            {activeCategory === "All" ? "All Skills" : activeCategory}
          </h2>
          <span className="section-count">
            {filtered.length} skill{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No skills found</h3>
            <p>Try a different category or search term</p>
          </div>
        ) : (
          <div className="skills-grid">
            {filtered.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onLevelChange={handleLevelChange}
                isSaving={savingIds.has(skill.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Toasts ── */}
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </>
  )
}
