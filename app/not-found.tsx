import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className="text-5xl">🥕</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-1 text-sm text-gray-500">That aisle does not exist.</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
        Back to overview
      </Link>
    </div>
  );
}
