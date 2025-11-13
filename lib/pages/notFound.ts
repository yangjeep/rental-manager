import { renderLayout } from "./layout";
import { SITE_TITLE, escapeHtml } from "./shared";

export function renderNotFound(message: string): string {
  const body = `
    <section class="not-found">
      <h1>Not found</h1>
      <p>${escapeHtml(message)}</p>
      <a class="button" href="/">Go home</a>
    </section>
  `;

  return renderLayout({
    title: `Not found · ${SITE_TITLE}`,
    body,
  });
}

