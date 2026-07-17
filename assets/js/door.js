/* ============================================================
   door.js — the arrival mechanic (the reusable front-door core).

   On submit it does exactly three things, in this order and with
   this priority:
     1. Fires the beta_signups insert (anon key), FIRE-AND-FORGET.
     2. Builds a pre-filled Clerk signup URL from name + email.
     3. Shows the welcome door.

   Load-bearing rule: the redirect must NEVER be blocked by the
   insert. If the telemetry write fails — bad key, CORS, offline,
   RLS — the visitor still reaches the door. Never trap someone at
   the door because a mission-control row hiccuped.

   Config (Supabase URL + anon key + app signup URL) comes from
   window.OP_CONFIG, generated at build time from env vars. The
   anon key is public by design (it is already in the app bundle);
   RLS — specifically the ABSENCE of a SELECT policy for anon — is
   what keeps beta_signups unreadable to visitors.
   ============================================================ */
(function(){
  const cfg = window.OP_CONFIG || {};
  const APP_SIGNUP_URL = cfg.appSignupUrl || 'https://ourprovisions.velayo.ai/sign-up';

  /* ---------- single-select chips ---------- */
  document.querySelectorAll('.chips[data-single]').forEach(group=>{
    const select = chip=>{
      group.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
      chip.classList.add('on');
    };
    group.querySelectorAll('.chip').forEach(chip=>{
      chip.addEventListener('click',()=>select(chip));
      chip.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();select(chip);}
      });
    });
  });

  /* ---------- collect the questionnaire ---------- */
  // Chip groups declare their column via data-field; a group tagged
  // data-type="boolean" coerces its "true"/"false" value. The mechanic
  // never hard-codes the questions — add a question in the markup and it
  // is collected here for free.
  function collect(){
    const row = {};

    document.querySelectorAll('.chips[data-single][data-field]').forEach(group=>{
      const field = group.dataset.field;
      const chosen = group.querySelector('.chip.on');
      if(!chosen) return;
      let val = chosen.dataset.val;
      if(group.dataset.type === 'boolean') val = (val === 'true');
      row[field] = val;
    });

    document.querySelectorAll('textarea.field[data-field], input.field[data-field]').forEach(el=>{
      const v = (el.value || '').trim();
      if(v) row[el.dataset.field] = v;
    });

    const first = (document.getElementById('f-first').value || '').trim();
    const last  = (document.getElementById('f-last').value  || '').trim();
    const email = (document.getElementById('f-email').value || '').trim();

    // name is ONE column: first + last joined. Nothing is ever parsed —
    // the split is only carried on the URL for Clerk (see buildSignupUrl).
    row.name  = [first, last].filter(Boolean).join(' ');
    row.email = email;

    return { row, first, last, email };
  }

  /* ---------- fire-and-forget telemetry insert ---------- */
  function fireInsert(row){
    if(!cfg.supabaseUrl || !cfg.anonKey){
      // Not configured (e.g. a preview built without env). Skip the write;
      // the door still opens. This is the never-trap rule, at config level.
      return;
    }
    try{
      fetch(cfg.supabaseUrl.replace(/\/$/,'') + '/rest/v1/beta_signups', {
        method:'POST',
        headers:{
          'apikey':        cfg.anonKey,
          'Authorization': 'Bearer ' + cfg.anonKey,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal'
        },
        body: JSON.stringify(row),
        keepalive: true,
        mode: 'cors'
      }).catch(()=>{ /* swallow — the signup matters more than the row */ });
    }catch(_){ /* never let a telemetry error reach the visitor */ }
  }

  /* ---------- pre-filled Clerk signup URL ---------- */
  // A COURTESY, not a lock — Clerk pre-fills and every field stays editable.
  function buildSignupUrl(first, last, email){
    const params = new URLSearchParams();
    if(email) params.set('email_address', email);
    if(first) params.set('first_name', first);
    if(last)  params.set('last_name', last);
    const qs = params.toString();
    return qs ? APP_SIGNUP_URL + '?' + qs : APP_SIGNUP_URL;
  }

  /* ---------- submit ---------- */
  const submitBtn = document.getElementById('submit');
  if(submitBtn){
    submitBtn.addEventListener('click',()=>{
      const { row, first, last, email } = collect();

      // 1. telemetry — fire-and-forget, never awaited, never blocking.
      fireInsert(row);

      // 2. the door the visitor actually walks through.
      document.getElementById('door-btn').href = buildSignupUrl(first, last, email);

      // 3. show the welcome door.
      document.getElementById('page').style.display = 'none';
      document.getElementById('done').classList.add('show');
      window.scrollTo(0,0);
    });
  }

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('seen'); io.unobserve(e.target);} });
  },{threshold:0.12});
  document.querySelectorAll('.reveal-up').forEach(el=>io.observe(el));

  /* ---------- nav over dark sections ---------- */
  const nav = document.getElementById('nav');
  const dark = document.querySelectorAll('.hero, .thesis, .foot');
  const heroCta = document.querySelector('.hero-actions .btn');
  function navState(){
    let on=false;
    dark.forEach(s=>{
      const r=s.getBoundingClientRect();
      if(r.top <= 96 && r.bottom >= 96) on=true;
    });
    nav.classList.toggle('on-dark', on);
    // the nav CTA only shouts once the hero's own CTA is off-screen —
    // two loud buttons thirty pixels apart is one too many.
    if(heroCta){
      const gone = heroCta.getBoundingClientRect().bottom < 80;
      nav.classList.toggle('solid', gone);
    }
  }
  window.addEventListener('scroll', navState, {passive:true});
  navState();
})();
