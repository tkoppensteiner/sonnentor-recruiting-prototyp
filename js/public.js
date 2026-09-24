/* Öffentlicher Bereich: Karriereseite, Stellenansicht, Bewerbungsformular */
(function (ST) {
  const e = ST.esc;
  ST.INITIATIVE = { id: 'init', ref: 'initiativ', title: 'Initiativbewerbung', dept: '', location: 'Alle Standorte', hours: '', status: 'published',
    form: { photo: 'optional', letter: 'required', cv: 'required', questions: ['Für welchen Bereich interessierst du dich?'] } };
  ST.jobTitle = (id) => id === 'init' ? 'Initiativbewerbung' : (ST.job(id)?.title || '(gelöschte Stelle)');

  function shell(inner, { back } = {}) {
    return `<div class="pub">
      <header class="pub-h"><div class="wrap">
        <a href="#/" class="pub-brand">${ST.logo(42)}<span>Karriere</span></a>
        <nav>${back ? `<a href="${back}" class="btn ghost sm">${ST.icon('left', 16)} Zurück</a>` : ''}
          <a href="#/login" class="btn ghost sm">${ST.icon('lock', 15)} HR-Login</a></nav>
      </div></header>
      <main>${inner}</main>
      <footer class="pub-f"><div class="wrap">
        <div>${ST.logo(34)}</div>
        <p>${e(ST.db.settings.company)} · Sprögnitz 10 · 3913 Zwettl<br>
        <a href="${e(ST.db.settings.privacyUrl)}" target="_blank" rel="noopener">Datenschutz</a> · <a href="https://www.sonnentor.com" target="_blank" rel="noopener">sonnentor.com</a></p>
      </div></footer></div>`;
  }

  /* ---------- Karriereseite / Stellenliste ---------- */
  ST.viewCareers = function (root) {
    const jobs = ST.db.jobs.filter(j => j.status === 'published');
    const opt = (arr) => [...new Set(arr)].sort().map(v => `<option>${e(v)}</option>`).join('');
    root.innerHTML = shell(`
      <section class="hero kraft"><div class="wrap">
        <p class="hand">Wir lassen die Sonne strahlen</p>
        <h1><span class="tape">Arbeiten bei SONNENTOR</span></h1>
        <p class="lead">Bio-Kräuter, Tee und Gewürze mit Herz – aus dem Waldviertel in die Welt. Finde deine Stelle und bewirb dich in wenigen Minuten, ganz ohne Registrierung.</p>
      </div></section>
      <section class="wrap jobs-sec">
        <div class="filters card">
          <label class="search">${ST.icon('search')}<input id="q" placeholder="Stelle, Bereich oder Stichwort …"></label>
          <select id="fl"><option value="">Alle Standorte</option>${opt(jobs.map(j => j.location))}</select>
          <select id="fd"><option value="">Alle Bereiche</option>${opt(jobs.map(j => j.dept))}</select>
          <select id="fh"><option value="">Alle Arbeitszeiten</option>${opt(jobs.map(j => j.hours))}</select>
        </div>
        <p class="muted" id="cnt"></p>
        <div class="job-grid" id="list"></div>
      </section>`);
    const draw = () => {
      const q = root.querySelector('#q').value.toLowerCase(), l = root.querySelector('#fl').value, dd = root.querySelector('#fd').value, h = root.querySelector('#fh').value;
      const f = jobs.filter(j => (!l || j.location === l) && (!dd || j.dept === dd) && (!h || j.hours === h) &&
        (!q || [j.title, j.dept, j.intro, j.location].join(' ').toLowerCase().includes(q)));
      root.querySelector('#cnt').textContent = `${f.length} offene ${f.length === 1 ? 'Stelle' : 'Stellen'}`;
      root.querySelector('#list').innerHTML = f.map(j => `
        <a class="job-card" href="#/jobs/${j.ref}">
          <div class="jc-img" style="background-image:url('${e(j.image)}')"><span class="chip">${e(j.dept)}</span></div>
          <div class="jc-b"><h3>${e(j.title)}</h3>
            <p class="meta">${ST.icon('pin', 14)} ${e(j.location)} <span>·</span> ${ST.icon('clock', 14)} ${e(j.hours)} <span>·</span> ${e(j.start)}</p>
            <p class="teaser">${e(j.intro.slice(0, 130))}…</p>
            <span class="more">Zur Stelle ${ST.icon('right', 16)}</span></div></a>`).join('') + `
        <a class="job-card initiative" href="#/jobs/initiativ/apply">
          <div class="jc-b"><span class="sunicon">${ST.icon('sparkle', 28)}</span><h3>Nichts Passendes dabei?</h3>
          <p class="teaser">Schick uns deine Initiativbewerbung – wir melden uns, sobald eine passende Stelle frei wird.</p>
          <span class="more">Initiativ bewerben ${ST.icon('right', 16)}</span></div></a>`;
    };
    root.querySelectorAll('input,select').forEach(i => i.addEventListener('input', draw));
    draw();
  };

  /* ---------- Stellenansicht (Web) ---------- */
  ST.viewJob = function (root, ref, preview = false) {
    const j = ST.job(ref);
    if (!j || (!preview && j.status !== 'published')) {
      root.innerHTML = shell(`<div class="wrap empty-state"><h2>Diese Stelle ist leider nicht mehr verfügbar.</h2><a class="btn primary" href="#/">Alle offenen Stellen</a></div>`, { back: '#/' });
      return;
    }
    const tpl = ST.template(j.templateId);
    const c = ST.user(j.contactId);
    const list = (a) => `<ul class="checks">${a.filter(Boolean).map(x => `<li>${e(x)}</li>`).join('')}</ul>`;
    root.innerHTML = shell(`
      ${preview ? `<div class="preview-bar">${ST.icon('eye', 16)} Vorschau – so sehen Bewerber:innen die Stelle ${j.status !== 'published' ? '(noch nicht veröffentlicht)' : ''}</div>` : ''}
      <section class="job-hero kraft"><div class="wrap jh-grid">
        <div class="jh-photo" style="background-image:url('${e(j.image)}')"></div>
        <div class="jh-text">
          <h1><span class="tape">${e(j.title)}</span></h1>
          <div class="facts">
            <span>${ST.icon('pin', 16)} ${e(j.location)}</span><span>${ST.icon('clock', 16)} ${e(j.hours)}</span>
            <span>${ST.icon('calendar', 16)} ${e(j.start)}</span><span>${ST.icon('file', 16)} ${e(j.contract)}</span>
          </div>
        </div></div></section>
      <div class="wrap job-layout">
        <article class="job-content">
          <p class="lead">${e(j.intro)}</p>
          <h2>${e(tpl.h.tasks)}</h2>${list(j.tasks)}
          <h2>${e(tpl.h.profile)}</h2>${list(j.profile)}
          <h2>${e(tpl.h.offer)}</h2>${list(j.offer)}
          ${j.salary ? `<p class="salary">${e(j.salary)}</p>` : ''}
          <h2>Das macht uns aus</h2>
          <div class="benefits">${j.benefits.map(ST.benefit).filter(Boolean).map(b => `<div class="ben"><span>${ST.icon(b.icon, 26)}</span><p>${e(b.label.replace(/-(?=[a-zäöü])/, ''))}</p></div>`).join('')}</div>
        </article>
        <aside class="job-side">
          <div class="card apply-card">
            <h3>Klingt nach dir?</h3>
            <p class="muted">Bewerbung in ca. 3 Minuten – ohne Registrierung.</p>
            <a class="btn primary lg block" href="#/jobs/${j.ref}/apply">Jetzt bewerben ${ST.icon('right', 18)}</a>
            <button class="btn ghost block" id="share">${ST.icon('link', 16)} Link kopieren</button>
          </div>
          ${c ? `<div class="card contact-card">
            <div class="avatar lg">${ST.initials(c.name)}</div>
            <div><p class="muted small">${e(tpl.h.contact)}</p><p class="name">${e(c.name)}</p><p class="small">${e(c.title)}</p>
            ${c.phone ? `<a href="tel:${e(c.phone.replace(/\s/g, ''))}" class="small">${ST.icon('phone', 14)} ${e(c.phone)}</a>` : ''}</div></div>` : ''}
        </aside>
      </div>
      <div class="mobile-apply"><a class="btn primary lg block" href="#/jobs/${j.ref}/apply">Jetzt bewerben</a></div>`, { back: preview ? '#/admin/jobs/' + j.id : '#/' });
    root.querySelector('#share').onclick = () => { navigator.clipboard?.writeText(ST.jobUrl(j)); ST.toast('Link kopiert'); };
  };

  /* ---------- Bewerbungsformular ---------- */
  ST.viewApply = function (root, ref) {
    const j = ref === 'initiativ' ? ST.INITIATIVE : ST.job(ref);
    if (!j || j.status !== 'published') return ST.viewJob(root, ref);
    const cfg = j.form;
    const data = { salutation: '', first: '', last: '', email: '', phone: '', street: '', zip: '', city: '', country: 'Österreich', files: [], answers: {}, source: '', consent: '', privacy: false };
    let step = 0;
    const steps = ['Über dich', 'Unterlagen', 'Abschluss'];

    const docSlot = (kind, key, mode, accept) => mode === 'hidden' ? '' : `
      <div class="drop" data-kind="${kind}" data-req="${mode === 'required'}">
        <input type="file" id="f-${key}" accept="${accept}" ${kind === 'Weitere Dokumente' ? 'multiple' : ''} hidden>
        <label for="f-${key}">${ST.icon(kind === 'Foto' ? 'eye' : 'upload', 22)}
          <span><b>${kind}${mode === 'required' ? ' *' : ''}</b><small>Datei hierher ziehen oder <u>auswählen</u> · max. 50 MB</small></span></label>
        <div class="drop-files"></div>
      </div>`;

    const render = () => {
      const pct = ((step + 1) / steps.length) * 100;
      root.innerHTML = shell(`
        <section class="apply-head kraft"><div class="wrap narrow">
          <p class="hand">Deine Bewerbung als</p>
          <h1><span class="tape">${e(j.title)}</span></h1>
          ${j.location ? `<p class="facts-inline">${ST.icon('pin', 15)} ${e(j.location)} ${j.hours ? '· ' + e(j.hours) : ''}</p>` : ''}
        </div></section>
        <div class="wrap narrow">
          <div class="stepper">${steps.map((s, i) => `<div class="st ${i < step ? 'done' : i === step ? 'cur' : ''}"><span>${i < step ? ST.icon('check', 14) : i + 1}</span>${s}</div>`).join('')}
            <div class="bar"><i style="width:${pct}%"></i></div></div>
          <form class="card apply-form" novalidate>${[stepPerson, stepDocs, stepFinish][step]()}
            <div class="form-nav">
              ${step > 0 ? `<button type="button" class="btn ghost" data-prev>${ST.icon('left', 16)} Zurück</button>` : `<a class="btn ghost" href="${ref === 'initiativ' ? '#/' : '#/jobs/' + j.ref}">Abbrechen</a>`}
              ${step < steps.length - 1 ? `<button class="btn primary">Weiter ${ST.icon('right', 16)}</button>` : `<button class="btn primary">${ST.icon('send', 16)} Bewerbung absenden</button>`}
            </div></form>
          <p class="muted small center">${ST.icon('lock', 13)} Deine Daten werden verschlüsselt übertragen und ausschließlich für das Bewerbungsverfahren verwendet.</p>
        </div>`, { back: ref === 'initiativ' ? '#/' : '#/jobs/' + j.ref });
      bind();
    };

    const field = (k, label, type = 'text', req = true, attrs = '') => `<label class="fld"><span>${label}${req ? ' *' : ''}</span>
      <input name="${k}" type="${type}" value="${e(data[k])}" ${req ? 'required' : ''} ${attrs}><em class="err"></em></label>`;

    function stepPerson() {
      return `<h2>Persönliche Daten</h2>
        <div class="seg" role="radiogroup" aria-label="Anrede">${['Frau', 'Herr', 'Divers', 'Keine Angabe'].map(s =>
          `<label><input type="radio" name="salutation" value="${s}" ${data.salutation === s ? 'checked' : ''}><span>${s}</span></label>`).join('')}</div>
        <div class="grid2">${field('first', 'Vorname', 'text', true, 'autocomplete="given-name"')}${field('last', 'Nachname', 'text', true, 'autocomplete="family-name"')}</div>
        <div class="grid2">${field('email', 'E-Mail', 'email', true, 'autocomplete="email"')}${field('phone', 'Telefon', 'tel', true, 'autocomplete="tel"')}</div>
        <h2>Adresse</h2>
        ${field('street', 'Straße & Hausnummer', 'text', true, 'autocomplete="street-address"')}
        <div class="grid3">${field('zip', 'PLZ', 'text', true, 'autocomplete="postal-code" inputmode="numeric"')}${field('city', 'Ort', 'text', true, 'autocomplete="address-level2"')}
          <label class="fld"><span>Land</span><select name="country">${['Österreich', 'Deutschland', 'Schweiz', 'Tschechische Republik', 'Italien', 'Ungarn', 'Slowakei', 'Andere'].map(c => `<option ${data.country === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>`;
    }
    function stepDocs() {
      return `<h2>Deine Unterlagen</h2>
        <p class="muted">PDF, Word oder Bild. Lebenslauf reicht – ein Motivationsschreiben freut uns, ist aber ${cfg.letter === 'required' ? '<b>für diese Stelle erforderlich</b>' : 'kein Muss'}.</p>
        ${docSlot('Lebenslauf', 'cv', cfg.cv, '.pdf,.doc,.docx,.jpg,.png')}
        ${docSlot('Motivationsschreiben', 'letter', cfg.letter, '.pdf,.doc,.docx')}
        ${docSlot('Foto', 'photo', cfg.photo, 'image/*')}
        ${docSlot('Weitere Dokumente', 'more', 'optional', '.pdf,.doc,.docx,.jpg,.png')}
        <p class="err" id="docerr"></p>`;
    }
    function stepFinish() {
      return `${cfg.questions.length ? `<h2>Noch ein paar Fragen</h2>${cfg.questions.map((q, i) =>
          `<label class="fld"><span>${e(q)}</span><input name="q${i}" value="${e(data.answers[q] || '')}"></label>`).join('')}` : ''}
        <label class="fld"><span>Wie bist du auf uns aufmerksam geworden?</span><select name="source"><option value="">Bitte wählen</option>
          ${ST.SOURCES.map(s => `<option ${data.source === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <h2>Datenfreigabe</h2>
        <div class="choice">
          <label><input type="radio" name="consent" value="pool" ${data.consent === 'pool' ? 'checked' : ''}><span><b>In den Talente-Pool aufnehmen</b><small>Meine Daten dürfen bis zu ${ST.db.settings.poolMonths} Monate gespeichert werden und ich werde auf interessante Stellen hingewiesen.</small></span></label>
          <label><input type="radio" name="consent" value="delete" ${data.consent === 'delete' ? 'checked' : ''}><span><b>Nur für diese Bewerbung</b><small>Meine Daten werden ${ST.db.settings.retentionMonths} Monate nach Abschluss des Verfahrens gelöscht.</small></span></label>
        </div><em class="err" id="consenterr"></em>
        <label class="check"><input type="checkbox" name="privacy" ${data.privacy ? 'checked' : ''}><span>Ich habe die <a href="${e(ST.db.settings.privacyUrl)}" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin einverstanden. *</span></label>
        <em class="err" id="privacyerr"></em>
        <div class="summary"><b>${e(data.salutation)} ${e(data.first)} ${e(data.last)}</b> · ${e(data.email)} · ${data.files.length} Dokument(e)</div>`;
    }

    function collect(form) {
      const fd = new FormData(form);
      for (const [k, v] of fd.entries()) {
        if (/^q\d+$/.test(k)) data.answers[cfg.questions[+k.slice(1)]] = v;
        else if (k === 'privacy') data.privacy = true;
        else if (k in data) data[k] = v;
      }
      if (step === 2 && !fd.has('privacy')) data.privacy = false;
    }

    function validate(form) {
      let ok = true;
      form.querySelectorAll('.err').forEach(x => x.textContent = '');
      form.querySelectorAll('.invalid').forEach(x => x.classList.remove('invalid'));
      const bad = (el, msg) => { ok = false; el.classList.add('invalid'); const er = el.closest('.fld')?.querySelector('.err'); if (er) er.textContent = msg; };
      if (step === 0) {
        form.querySelectorAll('input[required]').forEach(i => { if (!i.value.trim()) bad(i, 'Bitte ausfüllen'); });
        const em = form.querySelector('[name=email]'); if (em.value && !/^\S+@\S+\.\S+$/.test(em.value)) bad(em, 'Bitte gültige E-Mail angeben');
        if (!data.salutation) { ok = false; form.querySelector('.seg').classList.add('invalid'); }
      }
      if (step === 1) {
        form.querySelectorAll('.drop[data-req=true]').forEach(dz => {
          if (!data.files.some(f => f.kind === dz.dataset.kind)) { ok = false; dz.classList.add('invalid'); form.querySelector('#docerr').textContent = `Bitte ${dz.dataset.kind} hochladen.`; }
        });
      }
      if (step === 2) {
        if (!data.consent) { ok = false; form.querySelector('#consenterr').textContent = 'Bitte eine Option wählen'; }
        if (!data.privacy) { ok = false; form.querySelector('#privacyerr').textContent = 'Bitte Datenschutzerklärung bestätigen'; }
      }
      if (!ok) form.querySelector('.invalid, .err:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return ok;
    }

    function drawFiles() {
      root.querySelectorAll('.drop').forEach(dz => {
        const fs = data.files.filter(f => f.kind === dz.dataset.kind);
        dz.classList.toggle('has', fs.length > 0);
        dz.querySelector('.drop-files').innerHTML = fs.map(f => `<div class="fchip">${ST.icon('file', 15)}<span>${e(f.name)}</span><small>${ST.fmtSize(f.size)}</small>
          <button type="button" class="icon-btn" data-rm="${e(f.name)}" aria-label="Entfernen">${ST.icon('x', 14)}</button></div>`).join('');
      });
    }
    function addFiles(kind, list) {
      for (const f of list) {
        if (f.size > 50e6) { ST.toast(f.name + ' ist größer als 50 MB', 'err'); continue; }
        if (kind !== 'Weitere Dokumente') data.files = data.files.filter(x => x.kind !== kind);
        data.files.push({ kind, name: f.name, size: f.size });
      }
      drawFiles();
    }

    function bind() {
      const form = root.querySelector('form');
      form.addEventListener('submit', (ev) => {
        ev.preventDefault(); collect(form);
        if (!validate(form)) return;
        if (step < steps.length - 1) { step++; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const app = Object.assign({ id: ST.uid('a'), jobId: j.id, stage: 'new', rating: 0, createdAt: new Date().toISOString(), comments: [],
          history: [{ at: new Date().toISOString(), text: 'Bewerbung online eingegangen' }] }, JSON.parse(JSON.stringify(data)));
        ST.db.apps.push(app);
        ST.log(`Neue Bewerbung von ${data.first} ${data.last} für „${j.title}“`);
        ST.save();
        location.hash = '#/danke/' + j.ref;
      });
      form.querySelector('[data-prev]')?.addEventListener('click', () => { collect(form); step--; render(); });
      form.querySelectorAll('.seg input').forEach(r => r.addEventListener('change', () => { data.salutation = r.value; form.querySelector('.seg').classList.remove('invalid'); }));
      form.querySelectorAll('.drop').forEach(dz => {
        const inp = dz.querySelector('input');
        inp.addEventListener('change', () => addFiles(dz.dataset.kind, inp.files));
        ['dragenter', 'dragover'].forEach(t => dz.addEventListener(t, ev => { ev.preventDefault(); dz.classList.add('over'); }));
        ['dragleave', 'drop'].forEach(t => dz.addEventListener(t, ev => { ev.preventDefault(); dz.classList.remove('over'); }));
        dz.addEventListener('drop', ev => addFiles(dz.dataset.kind, ev.dataTransfer.files));
        dz.addEventListener('click', ev => { const b = ev.target.closest('[data-rm]'); if (b) { data.files = data.files.filter(f => f.name !== b.dataset.rm); drawFiles(); } });
      });
      drawFiles();
    }
    render();
  };

  ST.viewThanks = function (root, ref) {
    const j = ref === 'initiativ' ? ST.INITIATIVE : ST.job(ref);
    root.innerHTML = shell(`<div class="wrap narrow thanks">
      <div class="sunburst">${ST.logo(96)}</div>
      <h1>Danke für deine Bewerbung!</h1>
      <p class="lead">Deine Bewerbung als <b>${e(j?.title || '')}</b> ist bei uns angekommen. Du erhältst in Kürze eine Bestätigung per E-Mail. Wir melden uns so schnell wie möglich bei dir – versprochen.</p>
      <a href="#/" class="btn primary">Weitere Stellen ansehen</a>
      <p class="demo-note">${ST.icon('lock', 13)} Prototyp: Deine Angaben wurden nur in deinem Browser gespeichert und nicht an SONNENTOR übermittelt.</p></div>`);
  };
})(window.ST);
