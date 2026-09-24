/* Backoffice: Login, Layout, Dashboard, Stellenverwaltung */
(function (ST) {
  const e = ST.esc;

  ST.NAV = [
    { href: '#/admin', label: 'Übersicht', icon: 'chart', perm: null },
    { href: '#/admin/jobs', label: 'Stellen', icon: 'briefcase', perm: ['jobs.view_all', 'jobs.view_own'] },
    { href: '#/admin/applications', label: 'Bewerbungen', icon: 'inbox', perm: ['apps.view_all', 'apps.view_own'] },
    { href: '#/admin/templates', label: 'PDF-Vorlagen', icon: 'layout', perm: ['templates.view'] },
    { sep: 'Administration' },
    { href: '#/admin/users', label: 'Benutzer', icon: 'users', perm: ['users.manage'] },
    { href: '#/admin/roles', label: 'Rollen & Rechte', icon: 'shield', perm: ['roles.manage', 'users.manage'] },
    { href: '#/admin/settings', label: 'Einstellungen', icon: 'settings', perm: ['settings.manage'] },
    { href: '#/admin/audit', label: 'Protokoll', icon: 'history', perm: ['audit.view'] },
  ];
  ST.canAny = (perms) => !perms || perms.some(ST.can);

  /* ---------- Login (Demo: Benutzer wählen; produktiv: Microsoft Entra ID SSO) ---------- */
  ST.viewLogin = function (root) {
    root.innerHTML = `<div class="login kraft"><div class="login-card card">
      <div class="center">${ST.logo(72)}</div>
      <h1>Recruiting-Backoffice</h1>
      <button class="btn block sso" disabled title="Im Produktivsystem via Microsoft Entra ID">
        <svg width="18" height="18" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
        Mit Microsoft anmelden (SSO)</button>
      <div class="divider"><span>Demo: als Rolle anmelden</span></div>
      <div class="user-pick">${ST.db.users.filter(u => u.active).map(u => { const r = ST.role(u); return `
        <button class="upick" data-u="${u.id}"><span class="avatar" style="--c:${r.color}">${ST.initials(u.name)}</span>
          <span><b>${e(u.name)}</b><small>${ST.badge(r.name, r.color)} ${e(u.dept)}</small></span>${ST.icon('right', 16)}</button>`; }).join('')}</div>
      <a href="#/" class="small muted center block">${ST.icon('left', 14)} Zur Karriereseite</a></div></div>`;
    root.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      ST.db.currentUser = b.dataset.u; ST.log('Anmeldung'); ST.save(); location.hash = '#/admin';
    });
  };

  ST.adminShell = function (root, active, title, inner, actions = '') {
    const me = ST.me(), r = ST.role();
    root.innerHTML = `<div class="adm">
      <aside class="side" id="side">
        <a class="side-brand" href="#/admin">${ST.logo(40)}<span>Recruiting</span></a>
        <nav>${ST.NAV.filter(n => n.sep || ST.canAny(n.perm)).map(n => n.sep ? `<p class="nav-sep">${n.sep}</p>` :
          `<a href="${n.href}" class="${active === n.href ? 'on' : ''}">${ST.icon(n.icon)}<span>${n.label}</span>${n.href === '#/admin/applications' ? `<em>${ST.visibleApps().filter(a => a.stage === 'new').length || ''}</em>` : ''}</a>`).join('')}
          <p class="nav-sep">Öffentlich</p>
          <a href="#/" target="_blank">${ST.icon('globe')}<span>Karriereseite</span></a>
        </nav>
        <div class="side-user">
          <span class="avatar" style="--c:${r.color}">${ST.initials(me.name)}</span>
          <div><b>${e(me.name)}</b><small>${e(r.name)}</small></div>
          <button class="icon-btn" id="logout" title="Abmelden">${ST.icon('logout')}</button>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn only-m" id="menu">${ST.icon('menu')}</button>
          <h1>${title}</h1><div class="top-actions">${actions}</div>
          <label class="role-switch" title="Demo: Benutzer/Rolle wechseln, um das Rechtekonzept zu testen">${ST.icon('shield', 15)}
            <select id="switch">${ST.db.users.filter(u => u.active).map(u => `<option value="${u.id}" ${u.id === me.id ? 'selected' : ''}>${e(u.name)} – ${e(ST.role(u).name)}</option>`).join('')}</select></label>
        </header>
        <div class="content">${inner}</div>
      </div></div>`;
    root.querySelector('#logout').onclick = () => { ST.db.currentUser = null; ST.save(); location.hash = '#/login'; };
    root.querySelector('#switch').onchange = (ev) => { ST.db.currentUser = ev.target.value; ST.save(); ST.route(); ST.toast('Angemeldet als ' + ST.me().name); };
    root.querySelector('#menu').onclick = () => root.querySelector('#side').classList.toggle('open');
    return root.querySelector('.content');
  };

  ST.denied = (root, active) => ST.adminShell(root, active, 'Keine Berechtigung', `<div class="empty-state card">${ST.icon('lock', 40)}
    <h2>Dafür fehlt dir die Berechtigung</h2><p class="muted">Deine Rolle <b>${e(ST.role().name)}</b> hat keinen Zugriff auf diesen Bereich. Wende dich an HR oder die Administration.</p></div>`);

  const personLabel = (a) => ST.can('apps.view_personal') ? `${a.first} ${a.last}` : `Bewerber:in #${a.id.slice(-4).toUpperCase()}`;
  ST.personLabel = personLabel;

  /* ---------- Dashboard ---------- */
  ST.viewDashboard = function (root) {
    const me = ST.me();
    const jobs = ST.visibleJobs(), apps = ST.visibleApps();
    const open = jobs.filter(j => j.status === 'published');
    const new7 = apps.filter(a => Date.now() - new Date(a.createdAt) < 7 * 864e5);
    const pending = jobs.filter(j => j.status === 'review');
    const requests = jobs.filter(j => j.status === 'request');
    const bySource = ST.SOURCES.map(s => [s, apps.filter(a => a.source === s).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const maxS = Math.max(1, ...bySource.map(x => x[1]));
    const recent = apps.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const hour = new Date().getHours();

    const c = ST.adminShell(root, '#/admin', `${hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend'}, ${e(me.name.split(' ')[0])}`,
      `<div class="kpis">
        <div class="kpi card"><span>${ST.icon('briefcase')}</span><div><b>${open.length}</b><small>Veröffentlichte Stellen</small></div></div>
        <div class="kpi card"><span>${ST.icon('inbox')}</span><div><b>${new7.length}</b><small>Neue Bewerbungen (7 Tage)</small></div></div>
        <div class="kpi card"><span>${ST.icon('users')}</span><div><b>${apps.filter(a => a.stage === 'interview').length}</b><small>Im Gespräch</small></div></div>
        <div class="kpi card"><span>${ST.icon('check')}</span><div><b>${apps.filter(a => a.stage === 'hired').length}</b><small>Eingestellt</small></div></div>
      </div>
      <div class="dash-grid">
        <div class="card">
          <div class="card-h"><h2>Neueste Bewerbungen</h2><a href="#/admin/applications" class="small">Alle ansehen ${ST.icon('right', 14)}</a></div>
          ${recent.length ? `<ul class="rows">${recent.map(a => `<li><a href="#/admin/applications/${a.id}">
            <span class="avatar sm">${ST.can('apps.view_personal') ? ST.initials(a.first + ' ' + a.last) : '?'}</span>
            <span class="grow"><b>${e(personLabel(a))}</b><small>${e(ST.jobTitle(a.jobId))}</small></span>
            ${ST.stageBadge(a.stage)}<small class="muted">${ST.ago(a.createdAt)}</small></a></li>`).join('')}</ul>` : '<p class="muted">Noch keine Bewerbungen.</p>'}
        </div>
        <div class="stack">
          ${(ST.can('jobs.approve') && pending.length) || (ST.can('jobs.create') && requests.length) ? `<div class="card todo">
            <div class="card-h"><h2>${ST.icon('sparkle', 18)} Zu erledigen</h2></div>
            <ul class="rows">${ST.can('jobs.approve') ? pending.map(j => `<li><a href="#/admin/jobs/${j.id}"><span class="grow"><b>${e(j.title)}</b><small>wartet auf Freigabe · eingereicht von ${e(ST.user(j.createdBy)?.name)}</small></span>${ST.statusBadge(j.status)}</a></li>`).join('') : ''}
            ${ST.can('jobs.create') ? requests.map(j => `<li><a href="#/admin/jobs/${j.id}"><span class="grow"><b>${e(j.title)}</b><small>Stellenanforderung von ${e(ST.user(j.createdBy)?.name)}</small></span>${ST.statusBadge(j.status)}</a></li>`).join('') : ''}</ul></div>` : ''}
          <div class="card">
            <div class="card-h"><h2>Bewerbungskanäle</h2></div>
            ${bySource.length ? `<div class="bars">${bySource.map(([s, n]) => `<div class="barrow"><span>${e(s)}</span><i><b style="width:${n / maxS * 100}%"></b></i><em>${n}</em></div>`).join('')}</div>` : '<p class="muted">Keine Daten</p>'}
          </div>
          <div class="card">
            <div class="card-h"><h2>Pipeline</h2></div>
            <div class="funnel">${ST.STAGES.map(s => `<div style="--c:${s.color}"><b>${apps.filter(a => a.stage === s.id).length}</b><small>${s.label}</small></div>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="card role-hint">${ST.icon('shield', 18)}<p>Du bist als <b>${e(ST.role().name)}</b> angemeldet. ${e(ST.role().desc)} Über den Umschalter oben rechts kannst du andere Rollen ausprobieren.</p></div>`,
      ST.can('jobs.create') || ST.can('jobs.request') ? `<a class="btn primary" href="#/admin/jobs/new">${ST.icon('plus', 16)} ${ST.can('jobs.create') ? 'Neue Stelle' : 'Stelle anfordern'}</a>` : '');
  };

  /* ---------- Stellenliste ---------- */
  ST.viewJobs = function (root) {
    if (!ST.canAny(['jobs.view_all', 'jobs.view_own'])) return ST.denied(root, '#/admin/jobs');
    let filter = sessionStorage.getItem('jobFilter') || 'active';
    const c = ST.adminShell(root, '#/admin/jobs', 'Stellen', `
      <div class="toolbar">
        <div class="tabs">${[['active', 'Aktiv'], ['published', 'Veröffentlicht'], ['work', 'In Arbeit'], ['closed', 'Beendet'], ['all', 'Alle']].map(([k, l]) => `<button data-f="${k}">${l}</button>`).join('')}</div>
        <label class="search sm">${ST.icon('search', 16)}<input id="q" placeholder="Suchen …"></label>
      </div>
      <div class="card table-card"><table class="tbl"><thead><tr><th>Stelle</th><th>Bereich / Ort</th><th>Status</th><th class="num">Bewerbungen</th><th>Ansprechperson</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`,
      ST.can('jobs.create') || ST.can('jobs.request') ? `<a class="btn primary" href="#/admin/jobs/new">${ST.icon('plus', 16)} ${ST.can('jobs.create') ? 'Neue Stelle' : 'Stelle anfordern'}</a>` : '');
    const draw = () => {
      c.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === filter));
      const q = c.querySelector('#q').value.toLowerCase();
      const js = ST.visibleJobs().filter(j => (filter === 'all' || (filter === 'active' && j.status !== 'closed') || (filter === 'work' && ['request', 'draft', 'review'].includes(j.status)) || j.status === filter)
        && (!q || (j.title + j.dept + j.location + j.ref).toLowerCase().includes(q)));
      c.querySelector('#tb').innerHTML = js.map(j => {
        const n = ST.db.apps.filter(a => a.jobId === j.id), nn = n.filter(a => a.stage === 'new').length;
        return `<tr data-href="#/admin/jobs/${j.id}"><td><b>${e(j.title || '(ohne Titel)')}</b><small class="block muted">#${e(j.ref)} · erstellt ${ST.fmtDate(j.createdAt)}</small></td>
          <td>${e(j.dept)}<small class="block muted">${e(j.location)}</small></td><td>${ST.statusBadge(j.status)}</td>
          <td class="num">${ST.canAny(['apps.view_all', 'apps.view_own']) ? `<a href="#/admin/applications?job=${j.id}" class="pill">${n.length}${nn ? ` <em>+${nn}</em>` : ''}</a>` : n.length}</td>
          <td>${e(ST.user(j.contactId)?.name || '–')}</td>
          <td class="acts">${j.status === 'published' ? `<a class="icon-btn" href="#/jobs/${j.ref}" target="_blank" title="Online ansehen">${ST.icon('globe', 16)}</a>` : ''}
            ${ST.can('pdf.export') ? `<button class="icon-btn" data-pdf="${j.id}" title="PDF exportieren">${ST.icon('printer', 16)}</button>` : ''}${ST.icon('right', 16)}</td></tr>`;
      }).join('') || `<tr><td colspan="6" class="empty">Keine Stellen gefunden.</td></tr>`;
    };
    c.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; sessionStorage.setItem('jobFilter', filter); draw(); });
    c.querySelector('#q').oninput = draw;
    c.addEventListener('click', ev => {
      const p = ev.target.closest('[data-pdf]'); if (p) { ev.stopPropagation(); return ST.exportPdf(ST.job(p.dataset.pdf)); }
      if (ev.target.closest('a')) return;
      const tr = ev.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href;
    });
    draw();
  };

  /* A4-Vorschau skalieren */
  ST.fitA4 = function (box) {
    const inner = box.querySelector('.posting'); if (!inner) return;
    const s = box.clientWidth / inner.offsetWidth;
    inner.style.transform = `scale(${s})`; inner.style.transformOrigin = 'top left';
    box.style.height = inner.offsetHeight * s + 'px';
    /* Seitenumbrüche (A4 = 297mm ≈ 1122.5px) markieren */
    box.querySelectorAll('.pbreak').forEach(x => x.remove());
    const pages = Math.ceil(inner.offsetHeight / 1122.5 - 0.01);
    for (let i = 1; i < pages; i++) box.insertAdjacentHTML('beforeend', `<div class="pbreak" style="top:${i * 1122.5 * s}px"><span>Seite ${i + 1}</span></div>`);
    box.dataset.pages = pages;
  };

  /* ---------- Stellen-Editor ---------- */
  ST.viewJobEdit = function (root, id) {
    const isNew = id === 'new';
    const orig = isNew ? null : ST.job(id);
    if (isNew && !ST.canAny(['jobs.create', 'jobs.request'])) return ST.denied(root, '#/admin/jobs');
    if (!isNew && (!orig || !ST.canSeeJob(orig))) return ST.denied(root, '#/admin/jobs');
    const job = isNew ? ST.newJob() : JSON.parse(JSON.stringify(orig));
    const editable = isNew || ST.canEditJob(orig);
    const ro = editable ? '' : 'disabled';
    const S = ST.db.settings;
    const opts = (arr, v) => arr.map(x => `<option ${x === v ? 'selected' : ''}>${e(x)}</option>`).join('');
    const userOpts = (v, filter) => `<option value="">–</option>` + ST.db.users.filter(filter).map(u => `<option value="${u.id}" ${u.id === v ? 'selected' : ''}>${e(u.name)}</option>`).join('');
    const listEd = (key, label, hint) => `<div class="fld"><span>${label}</span>${hint ? `<small class="muted">${hint}</small>` : ''}
      <div class="list-ed" data-list="${key}"></div>${editable ? `<button type="button" class="btn ghost sm" data-add="${key}">${ST.icon('plus', 14)} Punkt hinzufügen</button>` : ''}</div>`;
    const modeSel = (k, label) => `<label class="fld inline"><span>${label}</span><select data-form="${k}" ${ro}>${[['required', 'Pflicht'], ['optional', 'Optional'], ['hidden', 'Ausblenden']].map(([v, l]) => `<option value="${v}" ${job.form[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    const appsN = ST.db.apps.filter(a => a.jobId === job.id).length;

    const c = ST.adminShell(root, '#/admin/jobs', isNew ? (ST.can('jobs.create') ? 'Neue Stelle' : 'Stellenanforderung') : e(job.title), `
      <div class="editor">
        <form class="ed-form" id="f">
          <div class="card">
            <div class="card-h"><h2>Status & Freigabe</h2>${ST.statusBadge(job.status)}</div>
            <div class="workflow">${['request', 'draft', 'review', 'published', 'closed'].map(s => `<span class="${s === job.status || (s === 'published' && job.status === 'paused') ? 'cur' : ''}">${ST.JOB_STATUS[s].label}</span>`).join(ST.icon('right', 14))}</div>
            <div class="wf-actions" id="wf"></div>
            ${!editable ? `<p class="note">${ST.icon('lock', 14)} Nur-Lese-Ansicht – deine Rolle darf diese Stelle nicht bearbeiten.</p>` : ''}
          </div>
          <div class="card">
            <div class="card-h"><h2>Eckdaten</h2><small class="muted">Ref. #${e(job.ref)}</small></div>
            <label class="fld"><span>Stellentitel *</span><input name="title" value="${e(job.title)}" placeholder="z. B. Mitarbeiter:in für …" ${ro}></label>
            <div class="grid2">
              <label class="fld"><span>Bereich</span><select name="dept" ${ro}>${opts(S.depts, job.dept)}</select></label>
              <label class="fld"><span>Standort</span><select name="location" ${ro}>${opts(S.locations, job.location)}</select></label>
              <label class="fld"><span>Arbeitszeit</span><input name="hours" list="dl-hours" value="${e(job.hours)}" ${ro}><datalist id="dl-hours">${opts(S.hours)}</datalist></label>
              <label class="fld"><span>Dienstverhältnis</span><select name="contract" ${ro}>${opts(S.contracts, job.contract)}</select></label>
              <label class="fld"><span>Eintritt</span><input name="start" value="${e(job.start)}" ${ro}></label>
              <label class="fld"><span>Bewerbungsfrist (optional)</span><input type="date" name="deadline" value="${e(job.deadline)}" ${ro}></label>
            </div>
          </div>
          <div class="card">
            <div class="card-h"><h2>Inhalt der Ausschreibung</h2></div>
            <label class="fld"><span>Einleitung</span><textarea name="intro" rows="4" ${ro}>${e(job.intro)}</textarea></label>
            ${listEd('tasks', 'Aufgaben', 'Überschrift laut Vorlage, z. B. „Du freust dich auf“')}
            ${listEd('profile', 'Profil / Anforderungen', '„Wir freuen uns auf dich und“')}
            ${listEd('offer', 'Angebot', '„… und lassen für dich die Sonne strahlen“')}
            <label class="fld"><span>Gehaltsangabe (gesetzlich verpflichtend in AT)</span><textarea name="salary" rows="2" ${ro}>${e(job.salary)}</textarea></label>
            <div class="fld"><span>Benefits</span><div class="ben-pick">${ST.db.benefits.map(b => `<label><input type="checkbox" data-ben="${b.id}" ${job.benefits.includes(b.id) ? 'checked' : ''} ${ro}><span>${ST.icon(b.icon, 16)} ${e(b.label.replace(/-(?=[a-zäöü])/, ''))}</span></label>`).join('')}</div></div>
            <label class="fld"><span>Titelbild (URL)</span><div class="img-row"><input name="image" value="${e(job.image)}" ${ro}>
              ${editable ? `<select id="imgpick"><option value="">Bildauswahl …</option>${Object.entries(ST.IMAGES).map(([k, v]) => `<option value="${v}">${{ office: 'Büro-Team', herbs: 'Kräuter', kitchen: 'Küche', ware: 'Lager', it: 'IT', shop: 'Geschäft' }[k]}</option>`).join('')}</select>` : ''}</div></label>
          </div>
          <div class="card">
            <div class="card-h"><h2>Zuständigkeit</h2></div>
            <div class="grid2">
              <label class="fld"><span>Ansprechperson (öffentlich)</span><select name="contactId" ${ro}>${userOpts(job.contactId, u => ['recruiter', 'hrlead'].includes(u.role))}</select></label>
              <label class="fld"><span>Führungskraft (sieht Bewerbungen)</span><select name="managerId" ${ro}>${userOpts(job.managerId, u => u.active)}</select></label>
            </div>
          </div>
          <div class="card">
            <div class="card-h"><h2>Bewerbungsformular</h2></div>
            <div class="grid3">${modeSel('cv', 'Lebenslauf')}${modeSel('letter', 'Motivationsschreiben')}${modeSel('photo', 'Foto')}</div>
            ${listEd('questions', 'Zusatzfragen an Bewerber:innen', 'z. B. Eintrittstermin, Gehaltsvorstellung, Führerschein')}
          </div>
          <div class="card">
            <div class="card-h"><h2>PDF-Ausschreibung</h2></div>
            <label class="fld"><span>Vorlage</span><select name="templateId" ${ST.can('templates.view') ? '' : 'disabled'}>${ST.db.templates.map(t => `<option value="${t.id}" ${t.id === job.templateId ? 'selected' : ''}>${e(t.name)}</option>`).join('')}</select></label>
          </div>
          ${!isNew && job.status === 'published' ? `<div class="card">
            <div class="card-h"><h2>${ST.icon('link', 18)} Einbindung Website</h2></div>
            <p class="muted small">Diesen Link auf der SONNENTOR-Website beim Button „Jetzt bewerben“ hinterlegen:</p>
            <div class="copy-row"><input readonly value="${e(ST.applyUrl(job))}"><button type="button" class="btn ghost sm" data-copy="${e(ST.applyUrl(job))}">${ST.icon('copy', 14)} Kopieren</button></div>
            <p class="muted small">Stellenbeschreibung:</p>
            <div class="copy-row"><input readonly value="${e(ST.jobUrl(job))}"><button type="button" class="btn ghost sm" data-copy="${e(ST.jobUrl(job))}">${ST.icon('copy', 14)} Kopieren</button></div>
          </div>` : ''}
        </form>
        <div class="ed-preview">
          <div class="prev-h"><b>Live-Vorschau PDF</b><span class="muted small" id="tplname"></span></div>
          <div class="a4" id="a4"></div>
        </div>
      </div>`,
      `${!isNew ? `<a class="btn ghost" href="#/preview/${job.ref}">${ST.icon('eye', 16)} Web-Vorschau</a>` : ''}
       ${ST.can('pdf.export') ? `<button class="btn ghost" id="pdf">${ST.icon('printer', 16)} PDF</button>` : ''}
       ${editable ? `<button class="btn primary" id="save">${ST.icon('check', 16)} Speichern</button>` : ''}`);

    const form = c.querySelector('#f');
    const drawLists = () => form.querySelectorAll('[data-list]').forEach(box => {
      const key = box.dataset.list, arr = key === 'questions' ? job.form.questions : job[key];
      box.innerHTML = arr.map((v, i) => `<div class="li-row"><span class="li-dot"></span><textarea rows="1" data-li="${key}" data-i="${i}" ${ro}>${e(v)}</textarea>
        ${editable ? `<div class="li-acts"><button type="button" class="icon-btn" data-mv="${key}:${i}:-1" title="Nach oben">${ST.icon('up', 14)}</button><button type="button" class="icon-btn" data-mv="${key}:${i}:1" title="Nach unten">${ST.icon('down', 14)}</button><button type="button" class="icon-btn" data-del="${key}:${i}" title="Entfernen">${ST.icon('trash', 14)}</button></div>` : ''}</div>`).join('');
      box.querySelectorAll('textarea').forEach(autosize);
    });
    function autosize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
    const arrOf = (key) => key === 'questions' ? job.form.questions : job[key];

    let raf;
    const preview = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const box = c.querySelector('#a4'); box.innerHTML = ST.renderPosting(job); ST.fitA4(box);
      c.querySelector('#tplname').textContent = 'Vorlage: ' + ST.template(job.templateId).name;
    }); };

    form.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t.dataset.li) { arrOf(t.dataset.li)[+t.dataset.i] = t.value; autosize(t); }
      else if (t.dataset.ben) job.benefits = ST.db.benefits.map(b => b.id).filter(id => form.querySelector(`[data-ben=${id}]`).checked);
      else if (t.dataset.form) job.form[t.dataset.form] = t.value;
      else if (t.id === 'imgpick') { if (t.value) { job.image = t.value; form.querySelector('[name=image]').value = t.value; } }
      else if (t.name) job[t.name] = t.value;
      preview();
    });
    form.addEventListener('click', (ev) => {
      const add = ev.target.closest('[data-add]'), mv = ev.target.closest('[data-mv]'), del = ev.target.closest('[data-del]'), cp = ev.target.closest('[data-copy]');
      if (add) { arrOf(add.dataset.add).push(''); drawLists(); form.querySelector(`[data-list=${add.dataset.add}] .li-row:last-child textarea`)?.focus(); }
      if (mv) { const [k, i, d] = mv.dataset.mv.split(':'); const a = arrOf(k), j = +i + +d; if (j >= 0 && j < a.length) { [a[i], a[j]] = [a[j], a[i]]; drawLists(); } }
      if (del) { const [k, i] = del.dataset.del.split(':'); arrOf(k).splice(+i, 1); drawLists(); }
      if (cp) { navigator.clipboard?.writeText(cp.dataset.copy); ST.toast('Link kopiert'); }
      if (add || mv || del) preview();
    });

    const save = (newStatus, msg) => {
      if (!job.title.trim()) { ST.toast('Bitte einen Stellentitel angeben', 'err'); form.querySelector('[name=title]').focus(); return false; }
      job.tasks = job.tasks.filter(x => x.trim()); job.profile = job.profile.filter(x => x.trim()); job.offer = job.offer.filter(x => x.trim()); job.form.questions = job.form.questions.filter(x => x.trim());
      if (newStatus) { job.status = newStatus; if (newStatus === 'published' && !job.publishedAt) job.publishedAt = new Date().toISOString(); }
      const i = ST.db.jobs.findIndex(j => j.id === job.id);
      if (i >= 0) ST.db.jobs[i] = job; else ST.db.jobs.unshift(job);
      ST.log(msg || `Stelle „${job.title}“ ${isNew ? 'angelegt' : 'bearbeitet'}`);
      ST.save(); ST.toast(msg || 'Gespeichert');
      location.hash = '#/admin/jobs/' + job.id; ST.route();
      return true;
    };

    /* Workflow-Aktionen je nach Status + Rechten */
    const me = ST.me(), wf = [];
    const btn = (label, cls, fn, icon) => wf.push({ label, cls, fn, icon });
    const s = job.status;
    if (s === 'request' && ST.can('jobs.create')) btn('Anforderung übernehmen → Entwurf', 'primary', () => save('draft', `Stellenanforderung „${job.title}“ übernommen`), 'check');
    if (s === 'request' && !ST.can('jobs.create') && isNew) btn('Anforderung an HR senden', 'primary', () => save('request', `Stellenanforderung „${job.title}“ an HR gesendet`), 'send');
    if (s === 'draft' && ST.can('jobs.create')) btn('Zur Freigabe einreichen', 'primary', () => save('review', `Stelle „${job.title}“ zur Freigabe eingereicht`), 'send');
    if (s === 'review' && ST.can('jobs.approve')) {
      const self = job.createdBy === me.id && ST.role().id !== 'admin';
      if (self) wf.push({ note: '4-Augen-Prinzip: Die Freigabe muss durch eine andere Person erfolgen.' });
      else btn('Freigeben & veröffentlichen', 'primary', () => save('published', `Stelle „${job.title}“ freigegeben & veröffentlicht`), 'check');
      btn('Zurück an Entwurf', 'ghost', () => save('draft', `Stelle „${job.title}“ zur Überarbeitung zurückgegeben`), 'left');
    }
    if (s === 'review' && !ST.can('jobs.approve')) wf.push({ note: 'Wartet auf Freigabe durch HR-Leitung.' });
    if (s === 'published' && ST.can('jobs.publish')) { btn('Pausieren', 'ghost', () => save('paused', `Stelle „${job.title}“ pausiert`)); btn('Stelle beenden', 'ghost', () => save('closed', `Stelle „${job.title}“ beendet`)); }
    if (s === 'paused' && ST.can('jobs.publish')) { btn('Wieder veröffentlichen', 'primary', () => save('published', `Stelle „${job.title}“ wieder veröffentlicht`), 'globe'); btn('Stelle beenden', 'ghost', () => save('closed', `Stelle „${job.title}“ beendet`)); }
    if (s === 'closed' && ST.can('jobs.create')) btn('Als neuen Entwurf reaktivieren', 'ghost', () => save('draft', `Stelle „${job.title}“ reaktiviert`), 'history');
    if (!isNew && ST.can('jobs.delete')) btn('Löschen', 'danger ghost', () => ST.confirm('Stelle löschen?', `„${e(job.title)}“ und <b>${appsN}</b> zugehörige Bewerbung(en) werden endgültig gelöscht.`, () => {
      ST.db.jobs = ST.db.jobs.filter(j => j.id !== job.id); ST.db.apps = ST.db.apps.filter(a => a.jobId !== job.id);
      ST.log(`Stelle „${job.title}“ gelöscht`); ST.save(); location.hash = '#/admin/jobs';
    }, 'Endgültig löschen', 'danger'), 'trash');
    c.querySelector('#wf').innerHTML = wf.map((w, i) => w.note ? `<p class="note">${ST.icon('shield', 14)} ${w.note}</p>` : `<button type="button" class="btn sm ${w.cls}" data-wf="${i}">${w.icon ? ST.icon(w.icon, 14) : ''} ${w.label}</button>`).join('') || '<p class="muted small">Keine Aktionen verfügbar.</p>';
    c.querySelector('#wf').onclick = (ev) => { const b = ev.target.closest('[data-wf]'); if (b) wf[+b.dataset.wf].fn(); };

    root.querySelector('#save')?.addEventListener('click', () => save());
    root.querySelector('#pdf')?.addEventListener('click', () => ST.exportPdf(job));
    drawLists(); preview();
    window.addEventListener('resize', preview, { once: true });
  };
})(window.ST);
