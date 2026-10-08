/* ============================================================
   demo-list.js — the hero phone's "living list" animation.
   Mirrors today's Shop: Aisles view, each item shows who added it
   and which meal it's for. Elly adds limes for taco night; Helen
   and Dan check things off at the store. Decorative only.
   ============================================================ */
(function(){
  const list = document.getElementById('list');
  if(!list) return;

  const T = 'Ground Beef Tacos', B = 'Adirondack Cheeseburger';
  const seed = [
    {cat:'Produce'},
    {n:'Avocados',    q:3, by:'Added by Elly', f:T},
    {n:'Blueberries', q:2, f:'Lake Pancakes'},
    {n:'Garlic',           f:T},
    {n:'Lettuce',     q:2, f:B+' & '+T},
    {n:'Onions',      q:2, f:B+' & '+T},
    {cat:'Meat & Seafood'},
    {n:'Ground Beef', q:3, f:T+' & '+B},
  ];
  const LIMES = {n:'Limes', q:2, by:'Added by Elly', f:T};

  const rowHTML = it => `
    <div class="box"></div>
    <div class="row-body">
      <div class="row-name">${it.n}</div>
      ${it.by ? `<div class="row-by">${it.by}</div>` : ''}
      ${it.f ? `<div class="row-for">For ${it.f}</div>` : ''}
    </div>
    ${it.q ? `<div class="qty">×${it.q}</div>` : ''}`;

  function build(){
    list.innerHTML = '';
    seed.forEach(it=>{
      const el = document.createElement('div');
      if(it.cat){ el.className='cat in'; el.textContent=it.cat; }
      else { el.className='row in'; el.dataset.name=it.n; el.innerHTML=rowHTML(it); }
      list.appendChild(el);
    });
  }

  let total = 20, inCart = 14;
  const $ = id => document.getElementById(id);
  function paint(){
    const pct = (inCart/total*100) + '%';
    $('ct').textContent = $('wct').textContent = inCart;
    $('tot').textContent = $('wtot').textContent = total;
    $('cf').textContent = $('badge').textContent = total - inCart;
    $('bar').style.width = pct;
    $('wfill').style.width = pct;
  }
  const row = n => list.querySelector(`.row[data-name="${n}"]`);
  function check(n){
    const r=row(n); if(!r||r.classList.contains('checked')) return;
    r.querySelector('.box').classList.add('done'); r.classList.add('checked'); inCart++; paint();
  }
  function uncheck(n){
    const r=row(n); if(!r||!r.classList.contains('checked')) return;
    r.querySelector('.box').classList.remove('done'); r.classList.remove('checked'); inCart--; paint();
  }
  function addLimes(){
    const r=document.createElement('div');
    r.className='row'; r.dataset.name=LIMES.n; r.innerHTML=rowHTML(LIMES);
    list.insertBefore(r, row('Onions'));  // lands in its aisle, alphabetically
    requestAnimationFrame(()=>r.classList.add('in'));
    total++; paint();
    return r;
  }

  function cycle(){
    const added = addLimes();                       // Elly adds limes from home
    setTimeout(()=>check('Blueberries'), 2100);     // Helen, in the store
    setTimeout(()=>check('Garlic'), 3800);          // Dan, two aisles over
    setTimeout(()=>{
      added.classList.remove('in');
      setTimeout(()=>{ added.remove(); total--; uncheck('Blueberries'); uncheck('Garlic'); }, 450);
    }, 6800);
  }

  build(); paint();
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    setTimeout(cycle, 1200);
    setInterval(cycle, 9000);
  }
})();
