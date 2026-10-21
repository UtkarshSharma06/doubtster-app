(async () => {
  console.log('Sending request to /api/explainer...');
  const t0 = Date.now();
  const res = await fetch('http://localhost:3000/api/explainer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Explain the greenhouse effect simply' })
  });
  const data = await res.json();
  console.log('Enqueued:', data);
  if (!data.id) return;

  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    const s = await fetch('http://localhost:3000/api/explainer/' + data.id);
    const sj = await s.json();
    const elapsed = Math.round((Date.now() - t0) / 1000);
    const pct = sj.progress ? (sj.progress * 100).toFixed(0) : '0';
    console.log(`[${elapsed}s] Status: ${sj.status}, Stage: ${sj.stage}, Progress: ${pct}%`);
    if (sj.status === 'done') {
      console.log('SUCCESS! Video generated in', sj.seconds_taken, 'seconds. Video duration:', sj.duration, 's');
      break;
    }
    if (sj.status === 'failed') {
      console.error('FAILED:', sj.error);
      break;
    }
  }
})();
