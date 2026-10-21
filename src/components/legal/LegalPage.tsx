import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalHero } from "./LegalHero";
import { LegalReader } from "./LegalReader";
import { LEGAL, loadLegal, type LegalKey } from "@/lib/legal";
import "@/styles/legal.css";

export function LegalPage({ doc }: { doc: LegalKey }) {
  const d = LEGAL[doc];
  const c = loadLegal(doc);
  return (
    <div className="pg-legal">
      <a className="skip" href="#main">Skip to content</a>
      <Header progress />
      <main id="main">
        <LegalHero current={doc} eff={c.eff} upd={c.upd} ver={c.ver} />
        <LegalReader toc={c.toc.map(({ id, title }) => ({ id, title: title }))} html={c.body} fname={d.fname} title={d.title} />

        <section className="related" aria-label="Other pages">
          <Link href="/blog"><div className="win"><div className="tb"><i /><i /><i /><em>blog</em></div><div className="in2"><h3>read the blog</h3><p>Guides, study tips and worked examples.</p></div></div></Link>
          <Link href="/#pricing"><div className="win"><div className="tb"><i /><i /><i /><em>pricing.md</em></div><div className="in2"><h3>see the plans</h3><p>$1.99 trial, then $7.99 a month or $59 a year.</p></div></div></Link>
        </section>

        <section className="cta sky">
          <div className="wrap">
            <h2>stuck on a question right now?</h2>
            <p>Chat is always free. Videos start with a $1.99 trial.</p>
            <div className="btns">
              <Link className="pill w" href="/signup">start your trial</Link>
              <Link className="pill" href="/">back to home</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
