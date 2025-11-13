import type { MetaFunction } from "@remix-run/cloudflare";
import { SITE_TITLE } from "~/lib/pages/shared";

export const meta: MetaFunction = () => {
  return [{ title: `Apply · ${SITE_TITLE}` }];
};

export default function ApplyPage() {
  return (
    <>
      <section className="mb-10">
        <h1 className="text-[clamp(2rem,5vw,2.8rem)] mb-3">Submit an Application</h1>
        <p className="m-0 max-w-[620px] text-muted leading-relaxed">
          We review every application individually to match residents with the right home. Please complete the form below to get started.
        </p>
      </section>
      <section className="bg-card/85 border border-white/8 rounded-2xl p-8 overflow-hidden">
        <iframe
          className="airtable-embed rounded-2xl w-full min-h-[533px] border border-white/8"
          src="https://airtable.com/embed/app3d4qdHQNNvUyHp/pagnMbX3CD5qshg3h/form"
          frameBorder="0"
          width="100%"
          height="533"
          style={{ background: 'transparent', border: '1px solid #ccc' }}
        />
      </section>
    </>
  );
}

