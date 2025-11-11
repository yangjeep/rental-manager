export default function ContactForm({ listingTitle }: { listingTitle: string }) {
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-xl font-semibold">Apply / Inquire</h2>
      <iframe
        className="airtable-embed"
        src="https://airtable.com/embed/app3d4qdHQNNvUyHp/pagnMbX3CD5qshg3h/form"
        frameBorder="0"
        width="100%"
        height="533"
        style={{ background: "transparent", border: "1px solid #ccc" }}
      />
    </section>
  );
}
