import type { Article } from "@/lib/blog";
import { CancelCalculator } from "./CancelCalculator";
import { CopyLink } from "./ReadingTools";

export function ArticleBody({ a }: { a: Article }) {
  return (
    <div className="win paper">
      <div className="tb"><i /><i /><i /><em>{a.slug}.md</em></div>
      <div className="bd" style={{ padding: 0 }}>
        <article className="prose pad" id="prose">
          <div className="tldr"><strong>In short</strong><p>{a.tldr}</p></div>
          {a.sections.map((s) => {
            const calc = s.html.includes("data-calculator");
            const intro = calc ? s.html.replace(/<div data-calculator><\/div>/, "") : s.html;
            return (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`}>{s.heading}<CopyLink id={s.id} /></h2>
                <div dangerouslySetInnerHTML={{ __html: intro }} />
                {calc && <CancelCalculator />}
              </section>
            );
          })}
          <aside className="take" aria-label="Key takeaways">
            <h2>Key takeaways</h2>
            <ul>{a.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
          </aside>
          <p className="aimist">AI explanations can contain mistakes. Check important answers with your teacher.</p>
        </article>
      </div>
    </div>
  );
}
