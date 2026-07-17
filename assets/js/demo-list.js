/* ============================================================
   demo-list.js — the hero phone's "living list" animation.

   Purely decorative content: a household's standing list where
   someone adds an item and someone else checks one off, mirroring
   the live app's shop bar (14 of 20 checked, 6 shown A–Z). Not
   part of the arrival mechanic — see door.js for that.
   ============================================================ */
(function(){
  // The list is a household's standing list — it's ALREADY there.
  // What's live is: someone adds an item, someone else checks one off.
  const seed = [
    {n:'Apples',        by:'Helen', q:'5', d:false},
    {n:'Avocados',      by:'Dan',   q:'2', d:false},
    {n:'NY Strip Steak',by:'Elly',  q:'',  d:false},
    {n:'Skyr Yogurt',   by:'Dan',   q:'6', d:false},
  ];

  const list = document.getElementById('list');
  if(!list) return;

  function rowHTML(item){
    return `
      <div class="box"></div>
      <div class="row-body">
        <div class="row-name">${item.n}</div>
        <div class="row-by">${item.by}</div>
      </div>
      ${item.q ? `<div class="qty">×${item.q}</div>` : ''}`;
  }

  function build(){
    list.innerHTML = '';
    seed.forEach(item=>{
      if(item.cat){
        const c = document.createElement('div');
        c.className='cat in'; c.textContent=item.cat;
        list.appendChild(c);
        return;
      }
      const r = document.createElement('div');
      r.className='row in';
      r.dataset.name = item.n;
      r.innerHTML = rowHTML(item);
      list.appendChild(r);
    });
  }

  // counters mirror the live app's shop bar: 14 of 20 checked, 6 left
  const TOTAL_BASE = 20;
  let total = TOTAL_BASE, checked = 14;

  function paint(){
    const left = total - checked;
    document.getElementById('ct').textContent  = checked;
    document.getElementById('hid').textContent = checked;
    document.getElementById('ic').textContent  = left;
    document.getElementById('badge').textContent = total;
    document.querySelector('.shop-count').innerHTML =
      `<span id="ct">${checked}</span> of ${total} checked`;
    document.getElementById('bar').style.width = (checked/total*100) + '%';
  }

  function check(name){
    const r = list.querySelector(`.row[data-name="${name}"]`);
    if(!r || r.classList.contains('checked')) return;
    r.querySelector('.box').classList.add('done');
    r.classList.add('checked');
    checked++; paint();
  }

  function uncheck(name){
    const r = list.querySelector(`.row[data-name="${name}"]`);
    if(!r || !r.classList.contains('checked')) return;
    r.querySelector('.box').classList.remove('done');
    r.classList.remove('checked');
    checked--; paint();
  }

  function addItem(item){
    // A-Z view: the item lands where it belongs alphabetically,
    // not at the bottom — same as the live app.
    const r = document.createElement('div');
    r.className='row';
    r.dataset.name = item.n;
    r.innerHTML = rowHTML(item);
    const rows = [...list.querySelectorAll('.row')];
    const after = rows.find(x => x.dataset.name.localeCompare(item.n) > 0);
    if(after) list.insertBefore(r, after); else list.appendChild(r);
    requestAnimationFrame(()=>r.classList.add('in'));
    total++; paint();
    return r;
  }

  const LIMES = {n:'Limes', by:'Elly', q:'6', d:false};

  function cycle(){
    // 1. Elly adds Limes — it arrives on your screen
    const added = addItem(LIMES);
    // 2. Helen checks off Apples at the store
    setTimeout(()=>check('Apples'), 2100);
    // 3. Dan checks off Skyr Yogurt
    setTimeout(()=>check('Skyr Yogurt'), 3800);
    // 4. reset quietly for the loop
    setTimeout(()=>{
      added.classList.remove('in');
      setTimeout(()=>{
        added.remove(); total--; paint();
        uncheck('Apples'); uncheck('Skyr Yogurt');
      }, 450);
    }, 6600);
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  build(); paint();
  if(!reduce){
    setTimeout(cycle, 1200);
    setInterval(cycle, 9000);
  }
})();
