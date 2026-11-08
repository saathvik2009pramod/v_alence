/* All monetary values are rupees. Model assumptions are shown in the page. */
(function (root) {
  const quota = 10000000;
  function payout(attainment, target, rule) {
    const position = (attainment - 0.9) / 0.2;
    if (rule === 'cliff') return attainment >= 1 ? target : 0;
    if (rule === 'accelerator') return Math.max(0, position) * target;
    const t = Math.min(1, Math.max(0, position));
    return target * (3 * t * t - 2 * t * t * t);
  }
  function evaluate(settings, discount, rule) {
    const list = settings.deal * 100000;
    const current = settings.attainment / 100;
    const target = settings.bonus * 1000;
    const cost = list * (1 - settings.margin / 100);
    const price = list * (1 - discount / 100);
    const earlyChance = Math.min(0.95, 0.2 + discount * 0.025);
    const laterChance = settings.chance / 100;
    const bonusChange = payout(current + price / quota, target, rule) - payout(current, target, rule);
    const waitRep = laterChance * list * 0.03;
    const earlyRep = price * 0.03 + bonusChange;
    const waitCompany = laterChance * (list - cost - list * 0.03);
    const earlyCompany = price - cost - earlyRep;
    return {
      discount, earlyChance, price,
      attainment: current + price / quota,
      rep: earlyChance * (earlyRep - waitRep),
      company: earlyChance * (earlyCompany - waitCompany)
    };
  }
  function search(settings, rule) {
    let repBest = {rep: 0, company: 0, wait: true};
    let companyBest = {rep: 0, company: 0, wait: true};
    for (let step = 0; step <= 60; step++) {
      const candidate = evaluate(settings, step / 2, rule);
      if (candidate.rep > repBest.rep + 0.001) repBest = candidate;
      if (candidate.company > companyBest.company + 0.001) companyBest = candidate;
    }
    return {repBest, companyBest};
  }
  const api = {payout, evaluate, search};
  if (typeof module !== 'undefined') module.exports = api;
  else root.ValenceModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
