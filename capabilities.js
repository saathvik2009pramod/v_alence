const capElement = id => document.getElementById(id);
const capReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const capDefaults = {attainment:92, deal:10, discount:10, margin:60, bonus:75, chance:85};
const capRules = [['cliff','Threshold'], ['accelerator','Accelerator'], ['smooth','Smooth Bézier']];
const capMoney = value => (value < -0.5 ? '−' : value > 0.5 ? '+' : '') + '₹' + Math.abs(Math.round(value)).toLocaleString('en-IN');
function animateArrival(node) {
  node.classList.remove('result-arrival');
  requestAnimationFrame(() => node.classList.add('result-arrival'));
}
function drawCapabilityCurve() {
  const attainment = Number(capElement('cap-attainment').value) / 100;
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
  context.font = '11px Neiko, Arial, sans-serif';
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
  const chance=Number(capElement('cap-chance').value);
  const outcome=ValenceModel.evaluate({...capDefaults,chance},10,'cliff');
  capElement('cap-chance-value').textContent=chance+'%';
  capElement('cap-rep').textContent=capMoney(outcome.rep);
  capElement('cap-company').textContent=capMoney(outcome.company);
  capElement('cap-sensitivity-status').textContent=outcome.rep>0&&outcome.company<0
    ? 'At this assumption, bringing the deal forward increases expected rep pay while reducing expected company contribution.'
    : 'At this assumption, compare the signs and amounts above to assess whether interests diverge.';
}
function compareRules() {
  const button=capElement('cap-run');
  button.disabled=true;
  capElement('search-rows').replaceChildren();
  capElement('cap-search-status').textContent='Evaluating 61 discounts and the option to wait for each payout rule…';
  let index=0;
  function addResult() {
    const [rule,name]=capRules[index];
    const {repBest,companyBest}=ValenceModel.search(capDefaults,rule);
    const row=document.createElement('tr');
    [name,repBest.wait?'Wait':repBest.discount+'% discount',capMoney(repBest.company)].forEach(text=>{
      const cell=document.createElement('td');cell.textContent=text;row.append(cell);
    });
    row.className='result-arrival';
    capElement('search-rows').append(row);
    capElement('cap-search-status').textContent=name+': expected rep change '+capMoney(repBest.rep)+'. Company-preferred choice: '+(companyBest.wait?'wait.':companyBest.discount+'% discount.');
    index++;
    if(index<capRules.length) {setTimeout(addResult,capReducedMotion?0:650);return;}
    button.disabled=false;
    capElement('cap-search-status').textContent+=' Comparison complete. A smoother payout can still leave an incentive conflict under these assumptions.';
  }
  setTimeout(addResult,capReducedMotion?0:400);
}
capElement('cap-attainment').addEventListener('input',drawCapabilityCurve);
capElement('cap-chance').addEventListener('input',()=>{updateSensitivity();animateArrival(capElement('cap-company'));animateArrival(capElement('cap-rep'));});
capElement('cap-run').addEventListener('click',compareRules);
window.addEventListener('resize',drawCapabilityCurve);
const capObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('visible');capObserver.unobserve(entry.target);}
}),{threshold:.15});
document.querySelectorAll('.word-reveal').forEach(heading=>{
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  let index=0;
  nodes.forEach(node=>{
    const fragment=document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(word=>{
      if(!word.trim()){fragment.append(document.createTextNode(word));return;}
      const span=document.createElement('span');span.textContent=word;
      span.style.setProperty('--delay',Math.min(index++*55,350)+'ms');fragment.append(span);
    });node.replaceWith(fragment);
  });capObserver.observe(heading);
});
drawCapabilityCurve();updateSensitivity();
