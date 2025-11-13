import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="text-center py-16 px-4">
      <h1 className="text-3xl font-bold mb-4">Not found</h1>
      <p className="text-muted mb-6">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="inline-block rounded-full px-5 py-2.5 bg-accent text-[#04140f] font-semibold border-none cursor-pointer text-center no-underline"
      >
        Go home
      </Link>
    </section>
  );
}

