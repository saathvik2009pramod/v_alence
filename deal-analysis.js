(function (root) {
  'use strict';
  const required = ['deal_id', 'decision_date', 'outcome', 'close_date', 'list_price', 'discount_pct', 'stage'];
  const optional = ['quota_attainment_pct', 'deal_cost', 'rep_commission', 'rep_bonus', 'actual_sale_price'];
  const buckets = [
    ['0%', 0, 0], ['>0–10%', 0, 10], ['>10–20%', 10, 20], ['>20–30%', 20, 30], ['>30%', 30, 100]
  ];
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', quoted = false, closed = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; closed = true; }
        } else field += char;
        continue;
      }
      if (char === '"') {
        if (field || closed) throw new Error('Unexpected quote in CSV.');
        quoted = true;
      } else if (char === ',' || char === '\n' || char === '\r') {
        row.push(field.trim()); field = ''; closed = false;
        if (char !== ',') {
          if (row.some(value => value !== '')) rows.push(row);
          row = [];
          if (char === '\r' && text[i + 1] === '\n') i++;
        }
      } else {
        if (closed && char.trim()) throw new Error('Unexpected text after a quoted CSV field.');
        if (!closed) field += char;
      }
    }
    if (quoted) throw new Error('Unclosed quoted CSV field.');
    row.push(field.trim());
    if (row.some(value => value !== '')) rows.push(row);
    if (!rows.length) throw new Error('The CSV is empty.');
    return rows;
  }
  function date(value, label) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(label + ' must use YYYY-MM-DD.');
    const parsed = new Date(value + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new Error(label + ' is not a valid date.');
    }
    return parsed.getTime();
  }
  function number(value, label, max = Infinity) {
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) throw new Error(label + ' must be a nonnegative number without separators.');
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed > max) throw new Error(label + ' is out of range.');
    return parsed;
  }
  function quarterEnd(time, offset) {
    const d = new Date(time);
    const month = Math.floor(d.getUTCMonth() / 3) * 3 + 3 + offset * 3;
    return Date.UTC(d.getUTCFullYear(), month, 0);
  }
  function validate(table, asOf) {
    const headers = table[0].map(value => value.toLowerCase());
    if (new Set(headers).size !== headers.length) throw new Error('Duplicate column headers.');
    const missing = required.filter(key => !headers.includes(key));
    if (missing.length) throw new Error('Missing columns: ' + missing.join(', '));
    if (table.length === 1) throw new Error('The file contains headers only. Add company records first.');
    const ids = new Set();
    return table.slice(1).map((values, index) => {
      const at = 'Record ' + (index + 1) + ': ';
      if (values.length !== headers.length) throw new Error(at + 'column count does not match the header.');
      const raw = Object.fromEntries(headers.map((key, i) => [key, values[i]]));
      if (!raw.deal_id || ids.has(raw.deal_id)) throw new Error(at + 'deal_id must be present and unique.');
      ids.add(raw.deal_id);
      const decision = date(raw.decision_date, at + 'decision_date');
      if (decision > asOf) throw new Error(at + 'decision date is after the completeness date.');
      const outcome = raw.outcome.toLowerCase();
      if (!['won', 'lost', 'open'].includes(outcome)) throw new Error(at + 'outcome must be won, lost or open.');
      const close = raw.close_date ? date(raw.close_date, at + 'close_date') : null;
      if (outcome !== 'open' && close === null) throw new Error(at + 'closed records need close_date.');
      if (outcome === 'open' && close !== null) throw new Error(at + 'open records must leave close_date empty.');
      if (close !== null && (close < decision || close > asOf)) throw new Error(at + 'close_date must fall between the decision and completeness dates.');
      if (!raw.stage) throw new Error(at + 'stage must describe the decision snapshot.');
      const list = number(raw.list_price, at + 'list_price');
      if (!list) throw new Error(at + 'list_price must be greater than zero.');
      const discount = number(raw.discount_pct, at + 'discount_pct', 100);
      const fields = {};
      for (const key of optional) fields[key] = raw[key] ? number(raw[key], at + key) : null;
      return {id: raw.deal_id, decision, close, outcome, list, discount, stage: raw.stage, sameEnd: quarterEnd(decision, 0), nextEnd: quarterEnd(decision, 1), ...fields};
    });
  }
  function wilson(wins, count) {
    if (!count) return null;
    const z = 1.959964, p = wins / count, denominator = 1 + z * z / count;
    const centre = (p + z * z / (2 * count)) / denominator;
    const radius = z * Math.sqrt(p * (1 - p) / count + z * z / (4 * count * count)) / denominator;
    return [Math.max(0, centre - radius), Math.min(1, centre + radius)];
  }
  function summary(records, asOf, horizon) {
    const key = horizon === 'same' ? 'sameEnd' : 'nextEnd';
    const eligible = records.filter(record => record[key] <= asOf && (horizon !== 'deferred' || record.close === null || record.close > record.sameEnd));
    const wins = eligible.filter(record => record.outcome === 'won' && record.close <= record[key]).length;
    return {count: eligible.length, wins, interval: wilson(wins, eligible.length)};
  }
  function analyse(records, asOf) {
    return buckets.map(([label, lower, upper], index) => {
      const group = records.filter(row => index === 0 ? row.discount === 0 : row.discount > lower && row.discount <= upper);
      return {label, same: summary(group, asOf, 'same'), next: summary(group, asOf, 'next'), deferred: summary(group, asOf, 'deferred')};
    });
  }
  const api = {parseCSV, date, validate, summary, analyse, wilson, quarterEnd};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  let table = null, records = [], generation = 0, report = [];
  const today = new Date().toISOString().slice(0, 10);
  $('asof').value = today; $('asof').max = today;
  function status(message, error = false) {
    $('import-status').textContent = message;
    $('import-status').classList.toggle('error', error);
  }
  function setFilters() {
    const chosen = $('stage-filter').value;
    $('stage-filter').replaceChildren(new Option('All stages', ''));
    for (const stage of [...new Set(records.map(row => row.stage))].sort()) $('stage-filter').add(new Option(stage, stage));
    if (records.some(row => row.stage === chosen)) $('stage-filter').value = chosen;
  }
  function filtered() {
    const stage = $('stage-filter').value, quota = $('quota-filter').value;
    return records.filter(row => {
      if (stage && row.stage !== stage) return false;
      if (!quota) return true;
      const a = row.quota_attainment_pct;
      return a !== null && (quota === 'below' ? a < 90 : quota === 'near' ? a >= 90 && a < 100 : a >= 100);
    });
  }
  function rateCell(cell, stat) {
    if (!stat.count) { cell.textContent = 'No complete cohorts'; return; }
    cell.textContent = (100 * stat.wins / stat.count).toFixed(1) + '% (' + stat.wins + '/' + stat.count + ')';
    const small = document.createElement('small');
    small.textContent = '95% range ' + (stat.interval[0] * 100).toFixed(1) + '–' + (stat.interval[1] * 100).toFixed(1) + '%';
    cell.append(small);
  }
  function render() {
    const asOf = date($('asof').value, 'Completeness date');
    const rows = filtered(), same = summary(rows, asOf, 'same'), next = summary(rows, asOf, 'next');
    report = analyse(rows, asOf);
    $('metrics').replaceChildren();
    for (const [value, label] of [[rows.length, 'Filtered deal snapshots'], [next.count, 'Complete next-quarter cohorts'], [next.wins, 'Won by next-quarter end']]) {
      const div = document.createElement('div'), strong = document.createElement('strong'), span = document.createElement('span');
      strong.textContent = value.toLocaleString(); span.textContent = label; div.append(strong, span); $('metrics').append(div);
    }
    $('window-note').textContent = (rows.length - same.count) + ' records excluded from same-quarter rates and ' + (rows.length - next.count) + ' excluded from next-quarter rates because their observation window is unfinished. Quota filters exclude records with missing attainment.';
    $('cohort-rows').replaceChildren();
    for (const group of report) {
      const tr = document.createElement('tr');
      for (const text of [group.label, group.same.count + ' same / ' + group.next.count + ' next']) {
        const td = document.createElement('td'); td.textContent = text; tr.append(td);
      }
      for (const stat of [group.same, group.next, group.deferred]) { const td = document.createElement('td'); rateCell(td, stat); tr.append(td); }
      $('cohort-rows').append(tr);
    }
    const won = rows.filter(row => row.outcome === 'won');
    const covered = won.filter(row => [row.deal_cost, row.rep_commission, row.rep_bonus, row.actual_sale_price].every(value => value !== null));
    if (!covered.length) $('financials').textContent = 'No won deals have complete sale price, cost, commission and bonus fields. Add those fields to calculate actual deal economics.';
    else {
      const totals = covered.reduce((sum, row) => {
        const revenue = row.actual_sale_price, pay = row.rep_commission + row.rep_bonus;
        sum.revenue += revenue; sum.pay += pay; sum.contribution += revenue - row.deal_cost - pay; return sum;
      }, {revenue: 0, pay: 0, contribution: 0});
      const fmt = value => value.toLocaleString(undefined, {maximumFractionDigits: 2});
      $('financials').textContent = 'Coverage: ' + covered.length + ' of ' + won.length + ' won deals. In the file’s currency, sale value totals ' + fmt(totals.revenue) + ', recorded rep pay ' + fmt(totals.pay) + ', and deal contribution ' + fmt(totals.contribution) + '.';
    }
    $('results').hidden = false;
  }
  function process() {
    $('results').hidden = true; report = []; records = [];
    if (!table) return;
    try {
      const asOf = date($('asof').value, 'Completeness date');
      if (asOf > date(today, 'Today')) throw new Error('Completeness date cannot be in the future.');
      records = validate(table, asOf); setFilters(); render();
      status(records.length + ' records validated. Data remains in this browser.');
    } catch (error) { status(error.message, true); }
  }
  $('deals').addEventListener('change', async event => {
    const request = ++generation, file = event.target.files[0];
    table = null; records = []; report = []; $('results').hidden = true;
    if (!file) return;
    $('clear-data').hidden = false;
    if (file.size > 10 * 1024 * 1024) { status('Please use a CSV smaller than 10 MB.', true); return; }
    try {
      const text = await file.text();
      if (request !== generation) return;
      table = parseCSV(text); process();
    } catch (error) { if (request === generation) status(error.message, true); }
  });
  $('asof').addEventListener('change', process);
  for (const id of ['stage-filter', 'quota-filter']) $(id).addEventListener('change', () => { if (records.length) render(); });
  $('clear-data').addEventListener('click', () => {
    generation++; table = null; records = []; report = []; $('deals').value = '';
    $('results').hidden = true; $('clear-data').hidden = true; $('cohort-rows').replaceChildren(); $('metrics').replaceChildren();
    $('financials').textContent = ''; setFilters(); $('quota-filter').value = ''; status('Imported data cleared from this page.');
  });
  $('export-report').addEventListener('click', () => {
    if (!report.length) return;
    const rows = [['discount_group', 'same_quarter_eligible', 'same_quarter_wins', 'same_quarter_rate', 'same_quarter_ci_low', 'same_quarter_ci_high', 'next_quarter_eligible', 'next_quarter_wins', 'next_quarter_rate', 'next_quarter_ci_low', 'next_quarter_ci_high', 'deferred_eligible', 'deferred_wins', 'deferred_rate', 'deferred_ci_low', 'deferred_ci_high']];
    for (const group of report) {
      const values = [group.label];
      for (const stat of [group.same, group.next, group.deferred]) values.push(stat.count, stat.wins, stat.count ? stat.wins / stat.count : '', ...(stat.interval || ['', '']));
      rows.push(values);
    }
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'valence-observed-cohorts.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})(typeof window !== 'undefined' ? window : globalThis);
