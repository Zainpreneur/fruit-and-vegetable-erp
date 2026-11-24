'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
      <h1 className="text-lg font-semibold text-red-800 dark:text-red-200">Something went wrong</h1>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">The store data could not be loaded.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
