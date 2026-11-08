(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = value => (value < -0.5 ? '−' : value > 0.5 ? '+' : '') + '₹' + Math.abs(Math.round(value)).toLocaleString('en-IN');

  // Advance a demonstration only while it is visible and the visitor has not paused it.
  function loop(container, duration, render) {
    let elapsed = 0;
    let previous = 0;
    let frame = 0;
    let visible = false;
    let paused = reduced;
    const button = container.querySelector('.pause-demo');
    function updateButton() {
      if (!button) return;
      button.textContent = paused ? 'Play animation' : 'Pause animation';
      button.setAttribute('aria-pressed', String(paused));
    }
    function tick(now) {
      frame = 0;
      if (!visible || paused || document.hidden) { previous = 0; return; }
      if (previous) elapsed += Math.min(now - previous, 100);
      previous = now;
      render((elapsed % duration) / duration);
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      previous = 0;
      if (!frame && visible && !paused && !document.hidden) frame = requestAnimationFrame(tick);
    }
    if (button) button.addEventListener('click', () => {
      paused = !paused;
      updateButton();
      if (paused) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
      else resume();
    });
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
      else resume();
    }, {threshold: .1});
    observer.observe(container);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('resize', () => render((elapsed % duration) / duration));
    document.fonts.ready.then(() => render(reduced ? .78 : (elapsed % duration) / duration));
    render(reduced ? .78 : 0);
    updateButton();
  }

  function arrival(node) {
    node.classList.remove('result-arrival');
    requestAnimationFrame(() => node.classList.add('result-arrival'));
  }
  window.ValenceMotion = {loop, money, arrival};

  function typeTitle(headline) {
    headline.setAttribute('aria-label', headline.innerText.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const characters = [];
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      Array.from(node.textContent).forEach(character => {
        const span = document.createElement('span');
        span.className = 'typing-character';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = character;
        characters.push(span); fragment.append(span);
      });
      node.replaceWith(fragment);
    });
    if (!characters.length) return;
    if (reduced) {
      characters.forEach(character => character.classList.add('typed'));
      characters.at(-1).classList.add('cursor');
      headline.classList.add('typing-complete');
      return;
    }
    let index = 0;
    function advance() {
      if (index) characters[index - 1].classList.remove('cursor');
      characters[index].classList.add('typed', 'cursor');
      index++;
      if (index === characters.length) { headline.classList.add('typing-complete'); return; }
      setTimeout(advance, characters[index - 1].textContent === '.' ? 220 : 58);
    }
    setTimeout(advance, 200);
  }
  document.fonts.ready.then(() => document.querySelectorAll('[data-type-title]').forEach(typeTitle));

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), {threshold: .12});
  document.querySelectorAll('h2').forEach(heading => heading.classList.add('word-reveal'));
  document.querySelectorAll('.word-reveal').forEach(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
        const span = document.createElement('span');
        span.className = 'reveal-word'; span.textContent = word;
        span.style.setProperty('--delay', Math.min(index++ * 60, 360) + 'ms');
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });
    revealObserver.observe(heading);
  });
  document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));

  document.querySelectorAll('[data-auto-demo]').forEach(root => {
    const state = {attainment:92, deal:10, discount:20, margin:60, bonus:75, chance:85};
    const stages = [
      ['Start with the option to wait.', 'The deal may close next quarter at list price. Both expected changes start at zero.', 'cliff'],
      ['An early close needs a discount.', 'Offer 20% off a ₹10 lakh order. The modeled early-close chance rises to 70%.', 'cliff'],
      ['The quota unlocks a bonus.', 'A successful early close reaches 100% quota. Expected salesperson pay rises while company contribution falls.', 'cliff'],
      ['Now change the bonus schedule.', 'Replay the same discount under the smooth Bézier rule. The expected values change; an incentive conflict remains.', 'smooth']
    ];
    let previousStage = -1;
    function draw(progress) {
      const stage = Math.min(3, Math.floor(progress * 4));
      const local = progress * 4 - stage;
      const [title, description, rule] = stages[stage];
      const result = ValenceModel.evaluate(state, 20, rule);
      const old = ValenceModel.evaluate(state, 20, 'cliff');
      const ease = Math.min(1, local * 3);
      let rep = 0;
      let company = 0;
      if (stage === 2) {rep = old.rep * ease; company = old.company * ease;}
      if (stage === 3) {rep = old.rep + (result.rep - old.rep) * ease; company = old.company + (result.company - old.company) * ease;}
      if (stage !== previousStage) {
        root.querySelector('[data-demo-title]').textContent = title;
        root.querySelector('[data-demo-description]').textContent = description;
        root.querySelector('[data-demo-rule]').textContent = rule === 'cliff' ? 'Threshold bonus' : 'Smooth Bézier bonus';
        arrival(root.querySelector('[data-demo-title]'));
        root.querySelectorAll('.auto-track span').forEach((node, index) => node.classList.toggle('active', index <= stage));
        previousStage = stage;
      }
      root.querySelector('[data-demo-rep]').textContent = money(rep);
      root.querySelector('[data-demo-company]').textContent = money(company);
      root.querySelector('[data-demo-detail]').textContent = stage < 2 ? 'Baseline · 92% current quota attainment' : 'Expected change versus waiting · two-quarter horizon';
      const canvas = root.querySelector('canvas');
      const w = canvas.clientWidth, h = canvas.clientHeight, ratio = devicePixelRatio || 1;
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      const c = canvas.getContext('2d'); c.scale(ratio, ratio);
      const x = a => 30 + (a - .85) / .3 * (w - 50);
      const y = bonus => h - 30 - bonus / 85000 * (h - 55);
      c.font = '11px "MADE Okine Sans", Arial, sans-serif';
      c.fillStyle = '#a69aae'; c.strokeStyle = '#38313e';
      [.9,1,1.1].forEach(a => {c.fillText(Math.round(a * 100) + '%', x(a) - 12, h - 8);});
      c.fillText('Bonus payout', 5, 15);
      c.beginPath(); c.moveTo(x(.85), y(0));
      if (rule === 'cliff') {c.lineTo(x(1), y(0));c.lineTo(x(1), y(75000));c.lineTo(x(1.15),y(75000));}
      else {c.lineTo(x(.9),y(0));c.bezierCurveTo(x(.9+.2/3),y(0),x(.9+.4/3),y(75000),x(1.1),y(75000));c.lineTo(x(1.15),y(75000));}
      c.strokeStyle = '#bfa4e6'; c.lineWidth = 2; c.stroke();
      const attainment = stage === 0 ? .92 : stage === 1 ? .92 + .08 * Math.min(1,local*2) : 1;
      c.beginPath();c.arc(x(attainment),y(ValenceModel.payout(attainment,75000,rule)),5,0,Math.PI*2);c.fillStyle='#ede2fa';c.fill();
    }
    loop(root, 18000, draw);
  });
})();
