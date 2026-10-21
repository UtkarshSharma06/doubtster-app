export default function Notes() {
  return (
    <section className="nts wrap" id="notes">
      <div className="nhead"><span className="bubble">doubtster</span><h2>structured notes, with the diagram</h2><p>Ask once and get clean notes with the diagram that goes with them, plus flashcards from the same page. Biology, chemistry, physics, coding and more.</p></div>
      <div className="win nwin"><div className="tb"><i /><i /><i /><em id="nfile">photosynthesis.md</em></div><div className="bd">
          <div className="ntabs" id="ntabs" role="tablist" aria-label="Subjects" />
          <div className="nbody"><article className="nin" id="nnote" /><figure className="nfig" id="nfig" /></div>
          <div className="ncards"><div className="nch"><b>flashcards from this note</b><span>click a card to flip it</span></div><div className="cardrow" id="ncards" /></div>
        </div></div>
      <p className="ill">Illustrative example of a generated note. AI notes can contain mistakes, so check important facts with your teacher.</p>
    </section>
  );
}
