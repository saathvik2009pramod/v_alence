let autoAttainment = 1;
let autoChance = 85;
const capElement = id => document.getElementById(id);
const capDefaults = {attainment:92, deal:10, discount:10, margin:60, bonus:75, chance:85};
const capRules = [['cliff','Threshold'], ['accelerator','Accelerator'], ['smooth','Smooth Bézier']];
const capMoney = value => (value < -0.5 ? '−' : value > 0.5 ? '+' : '') + '₹' + Math.abs(Math.round(value)).toLocaleString('en-IN');
function drawCapabilityCurve() {
  const attainment = autoAttainment;
  capElement('cap-attainment-value').textContent = (attainment * 100).toFixed(1).replace('.0','') + '%';
  const canvas = capElement('cap-curve');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  context.scale(ratio,ratio);
  const x = value => 20 + (value - 0.75) / 0.45 * (width - 40);
  const y = value => height - 30 - value / 125000 * (height - 45);
  context.font = '11px "MADE Okine Sans", Arial, sans-serif';
  context.fillStyle = '#b3aabd';
  context.strokeStyle = '#39313f';
  context.beginPath();context.moveTo(20,y(0));context.lineTo(width-20,y(0));context.stroke();
  [0.8,0.9,1,1.1,1.2].forEach(value => context.fillText(Math.round(value*100)+'%',x(value)-10,height-8));
  const colors = ['#8c8596','#e4dcea','#bfa4e6'];
  capRules.forEach(([rule],index) => {
    context.strokeStyle = colors[index];
    context.lineWidth = 2;
    context.setLineDash(index===0?[3,4]:[]);
    context.beginPath();context.moveTo(x(0.75),y(0));
    if(rule==='smooth') {
      context.lineTo(x(.9),y(0));
      context.bezierCurveTo(x(.9+.2/3),y(0),x(.9+.4/3),y(75000),x(1.1),y(75000));
      context.lineTo(x(1.2),y(75000));
    } else if(rule==='cliff') {
      context.lineTo(x(1),y(0));context.lineTo(x(1),y(75000));context.lineTo(x(1.2),y(75000));
    } else {
      context.lineTo(x(.9),y(0));context.lineTo(x(1.2),y(112500));
    }
    context.stroke();context.setLineDash([]);
    context.beginPath();context.arc(x(attainment),y(ValenceModel.payout(attainment,75000,rule)),4,0,Math.PI*2);
    context.fillStyle=colors[index];context.fill();
  });
  capElement('payout-rows').replaceChildren();
  capRules.forEach(([rule,name]) => {
    const row=document.createElement('tr');
    [name,'₹'+Math.round(ValenceModel.payout(attainment,75000,rule)).toLocaleString('en-IN')].forEach(text=>{
      const cell=document.createElement('td');cell.textContent=text;row.append(cell);
    });
    capElement('payout-rows').append(row);
  });
}
function updateSensitivity() {
  const chance=autoChance;
  const outcome=ValenceModel.evaluate({...capDefaults,chance},10,'cliff');
  capElement('cap-chance-value').textContent=chance+'%';
  capElement('cap-rep').textContent=capMoney(outcome.rep);
  capElement('cap-company').textContent=capMoney(outcome.company);
  capElement('cap-sensitivity-status').textContent=outcome.rep>0&&outcome.company<0
    ? 'At this assumption, bringing the deal forward increases expected rep pay while reducing expected company contribution.'
    : 'At this assumption, compare the signs and amounts above to assess whether interests diverge.';
}

const curveRoot = capElement('cap-curve').closest('.cap-demo');
ValenceMotion.loop(curveRoot, 14000, progress => {
  autoAttainment = .75 + .45 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
  drawCapabilityCurve();
});
const sensitivityRoot = document.querySelector('[data-auto-sensitivity]');
ValenceMotion.loop(sensitivityRoot, 16000, progress => {
  autoChance = Math.round(40 + 55 * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2)));
  updateSensitivity();
});
let previousCount = -1;
const searchRoot = document.querySelector('[data-auto-search]');
ValenceMotion.loop(searchRoot, 12000, progress => {
  const count = Math.min(3, Math.floor(progress * 6) + 1);
  if(count === previousCount) return;
  previousCount = count;
  capElement('search-rows').replaceChildren();
  capRules.slice(0,count).forEach(([rule,name],index) => {
    const {repBest} = ValenceModel.search(capDefaults,rule);
    const row = document.createElement('tr');
    [name,repBest.wait?'Wait':repBest.discount+'% discount',capMoney(repBest.company)].forEach(text => {
      const cell = document.createElement('td');cell.textContent=text;row.append(cell);
    });
    if(index === count-1) row.className='result-arrival';
    capElement('search-rows').append(row);
  });
  capElement('cap-search-status').textContent = count < 3
    ? 'Searching 61 discount choices for each rule. Results appear as the comparison unfolds.'
    : 'All three rules still produce an incentive conflict in this scenario. The company prefers a 0% discount in each modeled search.';
});
