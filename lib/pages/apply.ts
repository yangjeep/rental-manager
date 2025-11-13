import { renderLayout } from "./layout";
import { SITE_TITLE, escapeHtml } from "./shared";

type ApplicationPageOptions = {
  activePath?: string;
};

export function renderApplicationPage({ activePath = "/apply" }: ApplicationPageOptions = {}): string {
  const body = `
    <section class="page-hero">
      <h1>Submit an Application</h1>
      <p>We review every application individually to match residents with the right home. Please complete the form below to get started.</p>
    </section>
    <section class="application-form">
      <iframe class="airtable-embed" src="https://airtable.com/embed/app3d4qdHQNNvUyHp/pagnMbX3CD5qshg3h/form" frameborder="0" onmousewheel="" width="100%" height="533" style="background: transparent; border: 1px solid #ccc;"></iframe>
    </section>
  `;

  return renderLayout({
    title: `Apply · ${escapeHtml(SITE_TITLE)}`,
    body,
    activePath,
  });
}

