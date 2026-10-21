import Link from "next/link";
import { Year } from "./Year";

export function Footer({ mark = true, resources }: { mark?: boolean; resources?: { href: string; label: string }[] }) {
  const res = resources ?? [
    { href: "/examples", label: "examples" },
    { href: "/blog", label: "blog" },
    { href: "/#faq", label: "faq" },
  ];
  return (
    <footer>
      <div className="cols">
        <div>
          <h4>product</h4>
          <Link href="/app">open app</Link>
          <Link href="/#features">features</Link>
          <Link href="/#pricing">pricing</Link>
          <Link href="/signup">start trial</Link>
          <Link href="/login">log in</Link>
        </div>
        <div>
          <h4>resources</h4>
          {res.map((r) => (
            <Link key={r.href} href={r.href}>{r.label}</Link>
          ))}
        </div>
        <div>
          <h4>legal</h4>
          <Link href="/terms">terms</Link>
          <Link href="/privacy">privacy</Link>
          <Link href="/refund-policy">refund policy</Link>
        </div>
        <div>
          <h4>contact</h4>
          <a href="mailto:contact@doubtster.com">contact@doubtster.com</a>
          <p style={{ margin: "6px 0 10px", fontSize: "12px", color: "var(--mute)", lineHeight: 1.45 }}>
            27, Sahyog Nagar, near Shiva Talkies,<br />
            Ward No 19, 321001, Rajasthan
          </p>
          <p style={{ margin: 0, fontSize: "11.5px", color: "var(--mute)", lineHeight: 1.4 }}>
            AI explanations can contain mistakes. Check important answers with your teacher.
          </p>
        </div>
      </div>
      {mark && <div className="mark" aria-hidden="true">doubtster</div>}
      <div className="copy" style={mark ? undefined : { marginTop: 30 }}>
        © <Year /> Doubtster
      </div>
    </footer>
  );
}
