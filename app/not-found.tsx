export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <h1 className="text-3xl font-bold tracking-tight">Preview not found</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        This preview URL doesn&apos;t match any active prospect. Double-check
        the link or contact Kickbord.
      </p>
      <a
        href="https://kickbord.com"
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-amber-400 px-5 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
      >
        Kickbord →
      </a>
    </main>
  );
}
