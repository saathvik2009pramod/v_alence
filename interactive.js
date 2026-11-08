const element = id => document.getElementById(id);
const controls = ['attainment', 'deal', 'discount', 'margin', 'bonus', 'chance'];
const defaults = [92, 10, 10, 60, 75, 85];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = value => (value < -0.5 ? '−' : value > 0.5 ? '+' : '') + '₹' + Math.abs(Math.round(value)).toLocaleString('en-IN');
const currency = value => '₹' + Math.round(value).toLocaleString('en-IN');
let animation;
let scanAttainment = null;
function settings() {
  return Object.fromEntries(controls.map(id => [id, Number(element(id).value)]));
}
function drawCurve() {
  const canvas = element('plot');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);
  const state = settings();
  const rule = element('rule').value;
  const maxBonus = Math.max(1000, state.bonus * 1000 * 1.65);
  const x = attainment => 47 + (attainment - 0.75) / 0.45 * (width - 64);
  const y = value => height - 34 - value / maxBonus * (height - 64);
  context.font = '11px "MADE Okine Sans", Arial, sans-serif';
  context.fillStyle = '#a8a1b0';
  context.strokeStyle = '#37313d';
  for (let tick = 0; tick <= 3; tick++) {
    const value = maxBonus * tick / 3;
    context.beginPath();
    context.moveTo(45, y(value)); context.lineTo(width - 15, y(value)); context.stroke();
    context.fillText(Math.round(value / 1000) + 'k', 3, y(value) + 3);
  }
  [0.8, 0.9, 1, 1.1, 1.2].forEach(value => context.fillText(Math.round(value * 100) + '%', x(value) - 10, height - 10));
  function plot(ruleName, color, dashed) {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.setLineDash(dashed ? [4, 5] : []);
    context.beginPath();
    if (ruleName === 'smooth') {
      context.moveTo(x(0.75), y(0)); context.lineTo(x(0.9), y(0));
      context.bezierCurveTo(x(0.9 + 0.2 / 3), y(0), x(0.9 + 0.4 / 3), y(state.bonus * 1000), x(1.1), y(state.bonus * 1000));
      context.lineTo(x(1.2), y(state.bonus * 1000));
    } else if (ruleName === 'cliff') {
      context.moveTo(x(0.75), y(0)); context.lineTo(x(1), y(0));
      context.lineTo(x(1), y(state.bonus * 1000)); context.lineTo(x(1.2), y(state.bonus * 1000));
    } else {
      context.moveTo(x(0.75), y(0)); context.lineTo(x(0.9), y(0));
      context.lineTo(x(1.2), y(ValenceModel.payout(1.2, state.bonus * 1000, ruleName)));
    }
    context.stroke(); context.setLineDash([]);
  }
  plot('cliff', '#77707e', true);
  plot(rule, '#bfa4e6', false);
  const selected = ValenceModel.evaluate(state, state.discount, rule);
  const location = scanAttainment ?? selected.attainment;
  if (location >= 0.75 && location <= 1.2) {
    const pointY = y(ValenceModel.payout(location, state.bonus * 1000, rule));
    context.beginPath(); context.arc(x(location), pointY, 5, 0, Math.PI * 2);
    context.fillStyle = '#ece2fa'; context.fill();
  }
  element('curve-type').textContent = rule === 'smooth' ? 'CUBIC BÉZIER' : rule === 'cliff' ? 'DISCRETE THRESHOLD' : 'MARGINAL RATE';
}
function update() {
  const state = settings();
  const labels = [state.attainment + '%', '₹' + state.deal + ' lakh', state.discount + '%', state.margin + '%', currency(state.bonus * 1000), state.chance + '%'];
  controls.forEach((id, index) => element(id + '-value').textContent = labels[index]);
  const result = ValenceModel.evaluate(state, state.discount, element('rule').value);
  element('rep').textContent = money(result.rep);
  element('company').textContent = money(result.company);
  element('early').textContent = Math.round(result.earlyChance * 100) + '%';
  element('book').textContent = (result.attainment * 100).toFixed(1) + '% quota';
  element('status').textContent = 'Selected discount compared with waiting. Run the search to compare all 61 discount choices.';
  drawCurve();
}
function cancelSearch() {
  cancelAnimationFrame(animation);
  scanAttainment = null;
  element('run').disabled = false;
  ['step1', 'step2', 'step3'].forEach(id => element(id).classList.remove('active'));
}
function runSearch() {
  cancelSearch();
  const state = settings();
  const rule = element('rule').value;
  const start = performance.now();
  element('run').disabled = true;
  function advance(now) {
    const progress = reducedMotion ? 1 : Math.min(1, (now - start) / 2600);
    const index = Math.min(60, Math.floor(progress * 61));
    const candidate = ValenceModel.evaluate(state, index / 2, rule);
    scanAttainment = candidate.attainment;
    drawCurve();
    element('status').textContent = 'Testing discount ' + (index / 2).toFixed(1) + '% · ' + (index + 1) + ' / 61 choices';
    ['step1', 'step2', 'step3'].forEach((id, i) => element(id).classList.toggle('active', progress >= i / 3));
    if (progress < 1) { animation = requestAnimationFrame(advance); return; }
    const result = ValenceModel.search(state, rule);
    const best = result.repBest;
    if (!best.wait) element('discount').value = best.discount;
    scanAttainment = null;
    update();
    if (best.wait) element('status').textContent = 'Waiting is at least as rewarding for the salesperson as every early-close option tested.';
    else element('status').textContent = 'Rep-preferred discount: ' + best.discount + '%. Expected rep gain ' + money(best.rep) + '; company change ' + money(best.company) + '. Company-preferred choice: ' + (result.companyBest.wait ? 'wait.' : result.companyBest.discount + '% discount.');
    if (best.wait) {
      element('rep').textContent = money(0);
      element('company').textContent = money(0);
      element('early').textContent = 'Wait';
      element('book').textContent = 'Next quarter';
    }
    document.querySelectorAll('.metric-row strong').forEach(node => {
      node.classList.remove('result-arrival');
      requestAnimationFrame(() => node.classList.add('result-arrival'));
    });
    element('run').disabled = false;
  }
  animation = requestAnimationFrame(advance);
}
controls.forEach(id => element(id).addEventListener('input', () => {cancelSearch(); update();}));
element('rule').addEventListener('change', () => {cancelSearch(); update();});
element('run').addEventListener('click', runSearch);
element('reset').addEventListener('click', () => {
  cancelSearch(); controls.forEach((id, index) => element(id).value = defaults[index]);
  element('rule').value = 'cliff'; update();
});
window.addEventListener('resize', drawCurve);

update();
document.fonts.ready.then(drawCurve);
