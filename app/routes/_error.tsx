import { isRouteErrorResponse, useRouteError, Link } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <section className="text-center py-16 px-4">
        <h1 className="text-3xl font-bold mb-4">
          {error.status === 404 ? "Not found" : "Something went wrong!"}
        </h1>
        <p className="text-muted mb-6">
          {error.status === 404
            ? "The page you are looking for does not exist."
            : error.statusText || error.data || "An unexpected error occurred"}
        </p>
        <Link
          to="/"
          className="inline-block rounded-full px-5 py-2.5 bg-accent text-[#04140f] font-semibold border-none cursor-pointer text-center no-underline"
        >
          Go home
        </Link>
      </section>
    );
  }

  return (
    <section className="text-center py-16 px-4">
      <h1 className="text-3xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-muted mb-6">
        {error instanceof Error ? error.message : "An unexpected error occurred"}
      </p>
      <Link
        to="/"
        className="inline-block rounded-full px-5 py-2.5 bg-accent text-[#04140f] font-semibold border-none cursor-pointer text-center no-underline"
      >
        Go home
      </Link>
    </section>
  );
}

