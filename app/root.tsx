import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { Navigation } from "~/components/Navigation";
import { SITE_TITLE, DESCRIPTION } from "~/lib/pages/shared";
import styles from "~/app/styles/globals.css?url";

export const links = () => [
  { rel: "stylesheet", href: styles },
];

export const meta = () => {
  return [
    { title: `${SITE_TITLE} · Rentals` },
    { name: "description", content: DESCRIPTION },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-6 flex items-center justify-between gap-4">
          <a href="/" className="text-fg font-bold text-xl uppercase tracking-wider no-underline">
            {SITE_TITLE}
          </a>
          <Navigation />
        </header>
        <main className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] py-8 pb-20">
          <Outlet />
        </main>
        <footer className="text-center py-8 pb-12 text-muted">
          <small>Built with a modern edge-native stack</small>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
      </head>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: 'radial-gradient(circle at top, #10152b, #05060a 55%)',
          color: '#f4f4f5',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Something went wrong!
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            {isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <a
            href="/"
            style={{
              padding: '0.55rem 1.2rem',
              background: '#6ee7b7',
              color: '#04140f',
              fontWeight: '600',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

