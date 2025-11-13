import type { MetaFunction } from "@remix-run/cloudflare";
import { SITE_TITLE } from "~/lib/pages/shared";

export const meta: MetaFunction = () => {
  return [{ title: `About · ${SITE_TITLE}` }];
};

export default function AboutPage() {
  return (
    <>
      <section className="mb-10">
        <h1 className="text-[clamp(2rem,5vw,2.8rem)] mb-3">About {SITE_TITLE}</h1>
        <p className="m-0 max-w-[620px] text-muted leading-relaxed">
          We manage a curated portfolio of long-term rentals with a focus on thoughtful design, transparent communication, and responsive maintenance.
        </p>
      </section>
      <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
        <article className="bg-card/85 border border-white/8 rounded-2xl p-7 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Why Residents Choose Us</h2>
          <ul className="m-0 pl-5 text-muted leading-relaxed">
            <li>Homes inspected and refreshed between each tenancy.</li>
            <li>Dedicated contact for maintenance with a 24-hour response goal.</li>
            <li>Clear pricing with no surprise fees.</li>
          </ul>
        </article>
        <article className="bg-card/85 border border-white/8 rounded-2xl p-7 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Our Process</h2>
          <p className="m-0 text-muted leading-relaxed">
            We review every application carefully and coordinate in-person or virtual tours to help you evaluate the space. Once approved, signing and payments are handled securely online.
          </p>
          <p className="m-0 text-muted leading-relaxed">
            Questions? <a href="mailto:rentals@example.com" className="text-accent no-underline">Email our team</a> and we&apos;ll get back to you quickly.
          </p>
        </article>
      </section>
    </>
  );
}

