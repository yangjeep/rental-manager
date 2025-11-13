import { renderLayout } from "./layout";
import { SITE_TITLE, escapeHtml } from "./shared";

type AboutPageOptions = {
  activePath?: string;
};

export function renderAboutPage({ activePath = "/about" }: AboutPageOptions = {}): string {
  const body = `
    <section class="page-hero">
      <h1>About ${escapeHtml(SITE_TITLE)}</h1>
      <p>We manage a curated portfolio of long-term rentals with a focus on thoughtful design, transparent communication, and responsive maintenance.</p>
    </section>
    <section class="about-grid">
      <article>
        <h2>Why Residents Choose Us</h2>
        <ul>
          <li>Homes inspected and refreshed between each tenancy.</li>
          <li>Dedicated contact for maintenance with a 24-hour response goal.</li>
          <li>Clear pricing with no surprise fees.</li>
        </ul>
      </article>
      <article>
        <h2>Our Process</h2>
        <p>We review every application carefully and coordinate in-person or virtual tours to help you evaluate the space. Once approved, signing and payments are handled securely online.</p>
        <p class="muted">Questions? <a href="mailto:rentals@example.com">Email our team</a> and we’ll get back to you quickly.</p>
      </article>
    </section>
  `;

  return renderLayout({
    title: `About · ${escapeHtml(SITE_TITLE)}`,
    body,
    activePath,
  });
}

