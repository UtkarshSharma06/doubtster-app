export default function Header() {
  return (
    <header className="bar"><div className="in">
        <a className="brand" href="/" aria-label="Doubtster home"><img src="/brand/doubtster-logo-light.svg" alt="Doubtster" height={34} /></a>
        <nav><a href="/#features">features</a><a href="/examples">examples</a><a href="/#pricing">pricing</a><a href="/#faq">faq</a></nav>
        <div className="logo" aria-hidden="true"><img src="/brand/doubtster-icon.svg" alt="" width={28} height={28} /></div>
        <div className="r">
          <span id="clock" />
          <a href="/login" style={{ color: "var(--ink)", fontWeight: 500 }}>log in</a>
          <a href="/app" style={{ color: "var(--blue)", fontWeight: 600 }}>open app</a>
          <a href="/signup" style={{ background: "linear-gradient(#7DB2FF, #2F7BFF)", color: "#fff", padding: "5px 14px", borderRadius: "99px", fontSize: "14px", fontWeight: 600, border: "1px solid #1F63D8" }}>start trial</a>
        </div>
      </div></header>
  );
}
