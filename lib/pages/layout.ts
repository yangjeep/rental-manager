import { DESCRIPTION, SITE_TITLE, escapeHtml } from "./shared";

type LayoutOptions = {
  title: string;
  body: string;
  extraHead?: string;
  extraScripts?: string;
  activePath?: string;
};

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Listings" },
  { href: "/map", label: "Map" },
  { href: "/apply", label: "Submit an Application" },
  { href: "/about", label: "About" },
];

export function renderLayout({ title, body, extraHead = "", extraScripts = "", activePath = "/" }: LayoutOptions): string {
  const navLinks = NAV_ITEMS.map(item => {
    const isActive = activePath === item.href;
    const classes = ["nav-link"];
    if (isActive) classes.push("active");
    return `<a class="${classes.join(" ")}" href="${item.href}">${escapeHtml(item.label)}</a>`;
  }).join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <meta name="description" content="${escapeHtml(DESCRIPTION)}" />
      <link rel="stylesheet" href="/styles.css" />
      ${extraHead}
    </head>
    <body>
      <header class="site-header">
        <a class="brand" href="/">${escapeHtml(SITE_TITLE)}</a>
        <nav class="site-nav">${navLinks}</nav>
      </header>
      <main class="container">
        ${body}
      </main>
      <footer>
        <small>Built with a modern edge-native stack</small>
      </footer>
      ${extraScripts}
    </body>
  </html>`;
}

