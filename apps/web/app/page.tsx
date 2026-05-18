import { ArrowUpRight, Cable, History, KeyRound, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRuntimeStatus } from "@/lib/api";

export default async function Home() {
  const runtime = await getRuntimeStatus().catch(() => ({
    connected: false,
    mode: "api-offline",
    message: "Start the FastAPI control plane to connect Grapeee Runtime.",
  }));

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-zinc-300 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-950 text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Grapeee</p>
              <p className="text-xs text-zinc-600">Rojo-powered Roblox agent</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <KeyRound size={16} />
            Provider keys
          </Button>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-6 py-6 lg:grid-cols-[1fr_360px]">
          <section className="flex flex-col justify-between rounded-lg border border-zinc-300 bg-white p-5">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700">
                <Cable size={14} />
                Runtime: {runtime.mode}
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-normal">
                Build straight into Roblox Studio.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-zinc-700">
                Grapeee is the open-source Lemonade-style agent: bring your own AI key,
                generate reversible Studio changes, and keep the Rojo foundation under your control.
              </p>
            </div>

            <form className="mt-12">
              <label className="mb-2 block text-sm font-medium text-zinc-700" htmlFor="prompt">
                Prompt
              </label>
              <div className="rounded-lg border border-zinc-300 bg-[#fbfaf7] p-3">
                <textarea
                  id="prompt"
                  className="min-h-36 w-full resize-none border-0 bg-transparent text-base outline-none placeholder:text-zinc-400"
                  placeholder="Make a sword shop with coin purchases, a simple UI, and server-side validation..."
                />
                <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
                  <p className="text-xs text-zinc-500">DeepSeek V4 Pro high reasoning when configured</p>
                  <Button type="button">
                    Generate plan
                    <ArrowUpRight size={16} />
                  </Button>
                </div>
              </div>
            </form>
          </section>

          <aside className="grid gap-6">
            <div className="rounded-lg border border-zinc-300 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Studio Connection</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                  {runtime.connected ? "Connected" : "Waiting"}
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-600">{runtime.message}</p>
            </div>

            <div className="rounded-lg border border-zinc-300 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <History size={16} />
                <h2 className="text-sm font-semibold">Prompt Iterations</h2>
              </div>
              <div className="space-y-3 text-sm text-zinc-600">
                <p>No snapshots yet.</p>
                <p>Every applied operation will create a rollback point before touching Studio.</p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-300 bg-zinc-950 p-5 text-white">
              <div className="mb-4 flex items-center gap-2">
                <RotateCcw size={16} />
                <h2 className="text-sm font-semibold">Rollback First</h2>
              </div>
              <p className="text-sm leading-6 text-zinc-300">
                The runtime plan starts with snapshots before mutation, so the product can move fast
                without making Studio edits feel reckless.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

