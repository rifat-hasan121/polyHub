export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-24 text-white">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-16 text-center shadow-2xl shadow-cyan-950/30 sm:px-16">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Learn · Connect · Build
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          PolyHub
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300 sm:text-xl">
          - Bangladesh Polytechnic Platform
        </p>
        <div className="mx-auto mt-8 h-1 w-16 rounded-full bg-cyan-400" />
      </section>
    </main>
  );
}
