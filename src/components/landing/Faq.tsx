import { FAQ } from "@/lib/faq";

export default function Faq() {
  return (
    <section className="faq wrap" id="faq">
      <h2>frequently asked questions</h2>
      <p className="sb">what to know about doubtster, credits, and billing.</p>
      {FAQ.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>{f.q}</summary>
          <p>
            {f.a}
            {f.link ? <> <a href={f.link.href}>{f.link.text}</a>.</> : null}
          </p>
        </details>
      ))}
    </section>
  );
}
