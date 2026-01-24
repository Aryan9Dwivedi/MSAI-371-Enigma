import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              KRAFT — Task Allocation System
            </h1>
            <p className="text-sm text-slate-600">
              Knowledge-Reasoned Allocation For Teams (KRR Project)
            </p>
          </div>

          <span className="rounded-full border px-3 py-1 text-xs font-medium text-slate-700">
            v0.1 scaffold
          </span>
        </header>

        <main className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border bg-slate-50 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Quick Demo Widget</h2>
            <p className="mt-1 text-sm text-slate-600">
              This is just a placeholder to confirm Tailwind is working.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                onClick={() => setCount((c) => c + 1)}
              >
                Increment
              </button>

              <button
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white"
                onClick={() => setCount(0)}
              >
                Reset
              </button>

              <span className="ml-auto text-sm text-slate-600">
                count: <span className="font-semibold text-slate-900">{count}</span>
              </span>
            </div>
          </section>

          <section className="rounded-xl border p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Next Screens (MVP)</h2>
            <ul className="mt-3 list-inside list-disc text-sm text-slate-700 space-y-1">
              <li>Team Members (skills + availability)</li>
              <li>Tasks (deadline + required skills)</li>
              <li>Allocate (run reasoning + show explanations)</li>
              <li>History (previous allocation runs)</li>
            </ul>

            <div className="mt-5 rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
              Backend Health Endpoint: <span className="font-mono">/health</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
