import { NavBar } from "@/components/shared/navbar"
import { GoalSearch } from "@/components/search/goal-search"

export default function Home() {
  return (
    <div className="min-h-screen bg-bg p-6">
      <NavBar />

      <main className="mt-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">
          ORYNTA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe a goal in plain language — learning robotics, growing a business,
          finding cultural experiences — and get matching opportunities instead of a
          generic list of places. Or ask anything else — the AI assistant answers
          questions too.
        </p>

        <GoalSearch />
      </main>
    </div>
  )
}