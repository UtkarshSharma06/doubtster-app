export default function Footer() {
  return (
    <footer>
      <div className="fbrandrow"><img src="/brand/doubtster-logo-light.svg" alt="Doubtster" /><a href="/signup">start your trial →</a></div>
      <div className="cols">
        <div><h3>product</h3><a href="/app">open app</a><a href="/#features">features</a><a href="/#pricing">pricing</a><a href="/signup">start trial</a></div>
        <div><h3>resources</h3><a href="/examples">example lessons</a><a href="/blog">blog</a><a href="/#faq">faq</a></div>
        <div><h3>legal</h3><a href="/terms">terms</a><a href="/privacy">privacy</a><a href="/refund-policy">refund policy</a></div>
        <div><h3>disclaimer</h3><p>AI explanations can contain mistakes. Check important answers with your teacher.</p></div>
      </div>
      <div className="mark" aria-hidden="true">doubtster</div>
      <div className="copy">© <span id="yr">{new Date().getFullYear()}</span> Doubtster</div>
    </footer>
  );
}
