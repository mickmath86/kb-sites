import Link from "next/link";

// Marketing root — shown only at the apex domain (e.g. preview.kickbord.com).
// Wildcard subdomains are rewritten by proxy.ts to /_sites/[slug].
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M13 2 4 14h7l-2 8 9-12h-7l2-8z" />
        </svg>
      </div>
      <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
        Kickbord previews
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-400">
        Each Kickbord prospect gets their own live preview site at{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
          [their-slug].preview.kickbord.com
        </code>
        .
      </p>
      <Link
        href="https://kickbord.com"
        className="mt-10 inline-flex h-11 items-center justify-center rounded-md bg-amber-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
      >
        About Kickbord →
      </Link>
    </main>
  );
}
