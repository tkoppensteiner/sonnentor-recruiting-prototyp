/* Backoffice: Bewerbungen, Template-Designer, Benutzer, Rollen, Einstellungen, Protokoll */
(function (ST) {
  const e = ST.esc;

  /* ---------- Bewerbungen (Kanban) ---------- */
  ST.viewApps = function (root, query) {
    if (!ST.canAny(['apps.view_all', 'apps.view_own'])) return ST.denied(root, '#/admin/applications');
    const params = new URLSearchParams(query || '');
    let jobF = params.get('job') || '', view = sessionStorage.getItem('appView') || 'board';
    const personal = ST.can('apps.view_personal');
    const jobsWithApps = [...new Set(ST.visibleApps().map(a => a.jobId))];
    const c = ST.adminShell(root, '#/admin/applications', 'Bewerbungen', `
      ${!personal ? `<div class="card role-hint warn">${ST.icon('eyeoff', 18)}<p>Anonymisierte Ansicht: Deine Rolle sieht keine personenbezogenen Daten oder Dokumente.</p></div>` : ''}
      <div class="toolbar">
        <select id="job"><option value="">Alle Stellen</option>${jobsWithApps.map(id => `<option value="${id}" ${id === jobF ? 'selected' : ''}>${e(ST.jobTitle(id))}</option>`).join('')}</select>
        <label class="search sm">${ST.icon('search', 16)}<input id="q" placeholder="${personal ? 'Name, E-Mail …' : 'Suchen …'}"></label>
        <div class="tabs"><button data-v="board">Board</button><button data-v="list">Liste</button></div>
      </div>
      <div id="out"></div>`);

    const draw = () => {
      c.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view));
      const q = c.querySelector('#q').value.toLowerCase();
      const apps = ST.visibleApps().filter(a => (!jobF || a.jobId === jobF) && (!q || (personal ? a.first + ' ' + a.last + ' ' + a.email : a.id + ST.jobTitle(a.jobId)).toLowerCase().includes(q)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const card = (a) => `<a class="acard" href="#/admin/applications/${a.id}" draggable="${ST.can('apps.move')}" data-id="${a.id}">
        <div class="acard-h"><span class="avatar sm">${personal ? ST.initials(a.first + ' ' + a.last) : '?'}</span><b>${e(ST.personLabel(a))}</b></div>
        ${!jobF ? `<small class="muted">${e(ST.jobTitle(a.jobId))}</small>` : ''}
        <div class="acard-f">${ST.stars(a.rating)}<small class="muted">${ST.ago(a.createdAt)}</small>${a.comments.length ? `<small class="muted">${ST.icon('msg', 12)} ${a.comments.length}</small>` : ''}</div></a>`;
      c.querySelector('#out').innerHTML = view === 'board'
        ? `<div class="board">${ST.STAGES.map(s => { const list = apps.filter(a => a.stage === s.id); return `
            <div class="col" data-stage="${s.id}" style="--c:${s.color}"><div class="col-h"><i></i>${s.label}<em>${list.length}</em></div>
            <div class="col-b">${list.map(card).join('') || '<p class="col-empty">–</p>'}</div></div>`; }).join('')}</div>`
        : `<div class="card table-card"><table class="tbl"><thead><tr><th>Bewerber:in</th><th>Stelle</th><th>Status</th><th>Bewertung</th><th>Kanal</th><th>Eingang</th></tr></thead><tbody>
            ${apps.map(a => `<tr data-href="#/admin/applications/${a.id}"><td><b>${e(ST.personLabel(a))}</b>${personal ? `<small class="block muted">${e(a.email)}</small>` : ''}</td><td>${e(ST.jobTitle(a.jobId))}</td>
            <td>${ST.stageBadge(a.stage)}</td><td>${ST.stars(a.rating)}</td><td>${e(a.source || '–')}</td><td>${ST.fmtDate(a.createdAt)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Keine Bewerbungen</td></tr>'}</tbody></table></div>`;
    };
    c.querySelector('#job').onchange = (ev) => { jobF = ev.target.value; draw(); };
    c.querySelector('#q').oninput = draw;
    c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { view = b.dataset.v; sessionStorage.setItem('appView', view); draw(); });
    c.addEventListener('click', ev => { const tr = ev.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href; });
    /* Drag & Drop zwischen Spalten */
    let dragId = null;
    c.addEventListener('dragstart', ev => { const a = ev.target.closest('.acard'); if (a) { dragId = a.dataset.id; a.classList.add('dragging'); } });
    c.addEventListener('dragend', ev => ev.target.closest?.('.acard')?.classList.remove('dragging'));
    c.addEventListener('dragover', ev => { const col = ev.target.closest('.col'); if (col && dragId) { ev.preventDefault(); c.querySelectorAll('.col').forEach(x => x.classList.toggle('over', x === col)); } });
    c.addEventListener('drop', ev => {
      const col = ev.target.closest('.col'); c.querySelectorAll('.col').forEach(x => x.classList.remove('over'));
      if (!col || !dragId) return; ev.preventDefault();
      const a = ST.db.apps.find(x => x.id === dragId); dragId = null;
      if (a.stage !== col.dataset.stage) {
        if (col.dataset.stage === 'rejected') return ST.rejectDialog(a, draw);
        ST.moveStage(a, col.dataset.stage); draw();
      }
    });
    draw();
  };

  ST.moveStage = function (a, stage) {
    const s = ST.STAGES.find(x => x.id === stage);
    a.stage = stage; a.history.unshift({ at: new Date().toISOString(), text: `Status → ${s.label}`, by: ST.db.currentUser });
    ST.log(`Bewerbung ${a.first} ${a.last}: Status → ${s.label}`); ST.save(); ST.toast('Status: ' + s.label);
  };

  ST.rejectDialog = function (a, done) {
    if (!ST.can('apps.reject')) return ST.toast('Keine Berechtigung für Absagen', 'err');
    const job = ST.jobTitle(a.jobId);
    ST.modal({ title: 'Absage senden', wide: true, body: `
      <label class="fld"><span>An</span><input value="${e(a.email)}" disabled></label>
      <label class="fld"><span>Betreff</span><input id="subj" value="Deine Bewerbung als ${e(job)}"></label>
      <label class="fld"><span>Nachricht</span><textarea id="msg" rows="9">Liebe:r ${e(a.first)} ${e(a.last)},

vielen Dank für dein Interesse an SONNENTOR und die Zeit, die du in deine Bewerbung als ${e(job)} investiert hast.

Nach sorgfältiger Prüfung haben wir uns für eine:n andere:n Kandidat:in entschieden. ${a.consent === 'pool' ? 'Da du der Aufnahme in unseren Talente-Pool zugestimmt hast, melden wir uns gerne, wenn eine passende Stelle frei wird.' : ''}

Wir wünschen dir alles Gute und sonnige Grüße
Dein SONNENTOR Personal-Team</textarea></label>
      <p class="muted small">${ST.icon('mail', 13)} Demo: Die E-Mail wird nicht tatsächlich versendet.</p>`,
      actions: [{ label: 'Abbrechen', cls: 'ghost' }, { label: ST.icon('send', 15) + ' Absage senden', cls: 'danger', onClick: () => { ST.moveStage(a, 'rejected'); a.history.unshift({ at: new Date().toISOString(), text: 'Absage-E-Mail versendet', by: ST.db.currentUser }); ST.save(); done && done(); } }] });
  };

  /* ---------- Bewerbung Detail ---------- */
  ST.viewApp = function (root, id) {
    const a = ST.db.apps.find(x => x.id === id);
    if (!a || !ST.canSeeApp(a)) return ST.denied(root, '#/admin/applications');
    const personal = ST.can('apps.view_personal');
    const job = ST.job(a.jobId);
    const deleteAt = new Date(new Date(a.createdAt).getTime() + (a.consent === 'pool' ? ST.db.settings.poolMonths : ST.db.settings.retentionMonths) * 30.4 * 864e5).toISOString();
    const c = ST.adminShell(root, '#/admin/applications', `<a href="#/admin/applications${job ? '?job=' + job.id : ''}" class="back">${ST.icon('left', 20)}</a> ${e(ST.personLabel(a))}`, `
      <div class="app-detail">
        <div class="stack">
          <div class="card app-head">
            <span class="avatar xl">${personal ? ST.initials(a.first + ' ' + a.last) : '?'}</span>
            <div class="grow"><h2>${e(ST.personLabel(a))}</h2><p class="muted">${e(ST.jobTitle(a.jobId))} · eingegangen ${ST.fmtDateTime(a.createdAt)}</p>
              <div class="stage-pick">${ST.STAGES.map(s => `<button class="${a.stage === s.id ? 'on' : ''}" style="--c:${s.color}" data-stage="${s.id}" ${ST.can('apps.move') ? '' : 'disabled'}>${s.label}</button>`).join('')}</div></div>
          </div>
          ${personal ? `<div class="card"><div class="card-h"><h2>Kontaktdaten</h2></div>
            <dl class="dl">
              <dt>Anrede</dt><dd>${e(a.salutation)}</dd><dt>E-Mail</dt><dd><a href="mailto:${e(a.email)}">${e(a.email)}</a></dd>
              <dt>Telefon</dt><dd><a href="tel:${e(a.phone)}">${e(a.phone)}</a></dd><dt>Adresse</dt><dd>${e(a.street)}, ${e(a.zip)} ${e(a.city)}, ${e(a.country)}</dd>
            </dl></div>
          <div class="card"><div class="card-h"><h2>Dokumente</h2></div>
            <div class="docs">${a.files.map(f => `<div class="doc">${ST.icon('file', 22)}<div><b>${e(f.name)}</b><small>${e(f.kind)} · ${ST.fmtSize(f.size)}</small></div>
              <button class="icon-btn" onclick="ST.toast('Demo: Dokumentvorschau')" title="Ansehen">${ST.icon('eye', 16)}</button></div>`).join('') || '<p class="muted">Keine Dokumente</p>'}</div></div>`
          : `<div class="card role-hint warn">${ST.icon('eyeoff', 18)}<p>Kontaktdaten und Dokumente sind für deine Rolle ausgeblendet.</p></div>`}
          ${Object.keys(a.answers || {}).length || a.source ? `<div class="card"><div class="card-h"><h2>Angaben</h2></div><dl class="dl">
            ${Object.entries(a.answers || {}).map(([q, v]) => `<dt>${e(q)}</dt><dd>${e(v || '–')}</dd>`).join('')}
            <dt>Aufmerksam geworden über</dt><dd>${e(a.source || '–')}</dd></dl></div>` : ''}
        </div>
        <div class="stack">
          <div class="card"><div class="card-h"><h2>Bewertung</h2></div>
            <div id="rate">${ST.stars(a.rating, ST.can('apps.rate'))}</div>
            <div class="comments">${a.comments.map(cm => `<div class="cmt"><span class="avatar sm">${ST.initials(ST.user(cm.by)?.name || '?')}</span><div><b>${e(ST.user(cm.by)?.name)}</b> <small class="muted">${ST.fmtDateTime(cm.at)}</small><p>${e(cm.text)}</p></div></div>`).join('') || '<p class="muted small">Noch keine Kommentare.</p>'}</div>
            ${ST.can('apps.rate') ? `<form id="cf" class="cmt-form"><textarea rows="2" placeholder="Interne Notiz / Einschätzung …" required></textarea><button class="btn sm primary">${ST.icon('msg', 14)} Kommentieren</button></form>` : ''}
          </div>
          <div class="card"><div class="card-h"><h2>Datenschutz</h2></div><dl class="dl">
            <dt>Einwilligung</dt><dd>${a.consent === 'pool' ? 'Talente-Pool' : 'Nur diese Bewerbung'}</dd>
            <dt>Löschung geplant</dt><dd>${ST.fmtDate(deleteAt)}</dd></dl>
            <div class="row-btns">${ST.can('apps.reject') && a.stage !== 'rejected' ? `<button class="btn sm ghost" id="rej">${ST.icon('mail', 14)} Absage senden</button>` : ''}
            ${ST.can('apps.delete') ? `<button class="btn sm danger ghost" id="del">${ST.icon('trash', 14)} Endgültig löschen</button>` : ''}</div></div>
          <div class="card"><div class="card-h"><h2>Verlauf</h2></div>
            <ul class="timeline">${a.history.map(h => `<li><b>${e(h.text)}</b><small>${ST.fmtDateTime(h.at)}${h.by ? ' · ' + e(ST.user(h.by)?.name || '') : ''}</small></li>`).join('')}</ul></div>
        </div>
      </div>`);
    const again = () => ST.viewApp(root, id);
    c.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { if (b.dataset.stage === 'rejected') return ST.rejectDialog(a, again); ST.moveStage(a, b.dataset.stage); again(); });
    c.querySelector('#rate').onclick = (ev) => { const s = ev.target.closest('[data-star]'); if (!s || !ST.can('apps.rate')) return; a.rating = +s.dataset.star; ST.save(); again(); };
    c.querySelector('#cf')?.addEventListener('submit', (ev) => { ev.preventDefault(); const t = ev.target.querySelector('textarea').value.trim(); if (!t) return;
      a.comments.push({ by: ST.db.currentUser, at: new Date().toISOString(), text: t }); ST.save(); again(); });
    c.querySelector('#rej')?.addEventListener('click', () => ST.rejectDialog(a, again));
    c.querySelector('#del')?.addEventListener('click', () => ST.confirm('Bewerbung endgültig löschen?', 'Alle personenbezogenen Daten und Dokumente werden unwiderruflich gelöscht (DSGVO Art. 17).', () => {
      ST.db.apps = ST.db.apps.filter(x => x.id !== a.id); ST.log(`Bewerbung #${a.id.slice(-4).toUpperCase()} DSGVO-konform gelöscht`); ST.save(); location.hash = '#/admin/applications';
    }, 'Löschen', 'danger'));
  };

  /* ---------- Vorlagen-Liste ---------- */
  ST.viewTemplates = function (root) {
    if (!ST.can('templates.view')) return ST.denied(root, '#/admin/templates');
    const sample = ST.db.jobs.find(j => j.status === 'published') || ST.db.jobs[0];
    const c = ST.adminShell(root, '#/admin/templates', 'PDF-Vorlagen', `
      <p class="muted intro">Eine Vorlage legt Gestaltung, Überschriften und Reihenfolge fest. Zusammen mit den Inhalten einer Stelle entsteht die fertige Ausschreibung als PDF.</p>
      <div class="tpl-grid">${ST.db.templates.map(t => `<a class="tpl-card card" href="#/admin/templates/${t.id}">
        <div class="tpl-thumb"><div class="a4 thumb" data-tpl="${t.id}"></div></div>
        <div class="tpl-meta"><b>${e(t.name)}</b>${t.isDefault ? ST.badge('Standard', '#16a34a') : ''}<small class="muted">${ST.db.jobs.filter(j => j.templateId === t.id).length} Stelle(n)</small></div></a>`).join('')}
      </div>`, ST.can('templates.edit') ? `<button class="btn primary" id="new">${ST.icon('plus', 16)} Neue Vorlage</button>` : '');
    c.querySelectorAll('[data-tpl]').forEach(box => { box.innerHTML = ST.renderPosting(sample, ST.template(box.dataset.tpl)); requestAnimationFrame(() => ST.fitA4(box)); });
    root.querySelector('#new')?.addEventListener('click', () => {
      const t = JSON.parse(JSON.stringify(ST.template())); t.id = ST.uid('tpl-'); t.name = 'Neue Vorlage'; t.isDefault = false;
      ST.db.templates.push(t); ST.log('Vorlage angelegt'); ST.save(); location.hash = '#/admin/templates/' + t.id;
    });
  };

  /* ---------- Template-Designer ---------- */
  ST.viewTemplateEdit = function (root, id) {
    if (!ST.can('templates.view')) return ST.denied(root, '#/admin/templates');
    const orig = ST.db.templates.find(t => t.id === id); if (!orig) return ST.viewTemplates(root);
    const t = JSON.parse(JSON.stringify(orig));
    const canEdit = ST.can('templates.edit'), ro = canEdit ? '' : 'disabled';
    let sampleId = sessionStorage.getItem('tplSample') || (ST.db.jobs.find(j => j.templateId === id) || ST.db.jobs[0]).id;
    const SEC = { facts: ['Eckdaten', 'showFacts'], intro: ['Einleitung'], tasks: ['Aufgaben'], profile: ['Profil'], offer: ['Angebot & Gehalt'], benefits: ['Benefits', 'showBenefits'], contact: ['Kontakt & QR-Code', 'showContact'] };
    const FONTS = ['Nunito', 'Source Sans 3', 'Merriweather', 'Caveat'];
    const color = (k, l) => `<label class="fld color"><span>${l}</span><input type="color" data-k="${k}" value="${t[k]}" ${ro}><code>${t[k]}</code></label>`;
    const tog = (k, l) => `<label class="switch"><input type="checkbox" data-k="${k}" ${t[k] ? 'checked' : ''} ${ro}><i></i>${l}</label>`;
    const sel = (k, l, arr) => `<label class="fld"><span>${l}</span><select data-k="${k}" ${ro}>${arr.map(([v, lab]) => `<option value="${v}" ${t[k] === v ? 'selected' : ''}>${lab}</option>`).join('')}</select></label>`;

    const c = ST.adminShell(root, '#/admin/templates', `<a href="#/admin/templates" class="back">${ST.icon('left', 20)}</a> Template-Designer`, `
      <div class="designer">
        <div class="ds-panel">
          <div class="card">
            <label class="fld"><span>Name der Vorlage</span><input data-k="name" value="${e(t.name)}" ${ro}></label>
            ${tog('isDefault', 'Standardvorlage für neue Stellen')}
          </div>
          <details class="card" open><summary>Layout & Stil</summary>
            <div class="style-pick">${[['kraft', 'Kraftpapier'], ['clean', 'Klar'], ['sun', 'Sonne']].map(([v, l]) => `<label><input type="radio" name="style" data-k="style" value="${v}" ${t.style === v ? 'checked' : ''} ${ro}><span class="sp sp-${v}"></span>${l}</label>`).join('')}</div>
            <div class="grid2">${sel('logoPos', 'Logo', [['right', 'Rechts'], ['left', 'Links']])}${sel('density', 'Dichte', [['normal', 'Normal'], ['compact', 'Kompakt']])}</div>
          </details>
          <details class="card" open><summary>Farben & Schrift</summary>
            <div class="grid2">${color('primary', 'Primär (Band, Überschriften)')}${color('accent', 'Akzent (Sonne)')}${color('text', 'Text')}${color('paper', 'Papier')}</div>
            <div class="grid2">${sel('fontHeading', 'Schrift Überschriften', FONTS.map(f => [f, f]))}${sel('fontBody', 'Schrift Text', FONTS.slice(0, 3).map(f => [f, f]))}</div>
          </details>
          <details class="card" open><summary>Abschnitte & Reihenfolge</summary>
            <ul class="sec-order" id="order"></ul>
            ${tog('showImage', 'Titelbild anzeigen')}${tog('showSalary', 'Gehaltsangabe anzeigen')}${tog('showQR', 'QR-Code „Jetzt bewerben“')}
            ${sel('benefitsStyle', 'Darstellung Benefits', [['icons', 'Icons'], ['list', 'Fließtext']])}
          </details>
          <details class="card"><summary>Überschriften & Texte</summary>
            ${[['tasks', 'Aufgaben'], ['profile', 'Profil'], ['offer', 'Angebot'], ['contact', 'Kontakt']].map(([k, l]) => `<label class="fld"><span>${l}</span><input data-h="${k}" value="${e(t.h[k])}" ${ro}></label>`).join('')}
            <label class="fld"><span>Fußzeile</span><textarea data-k="footer" rows="2" ${ro}>${e(t.footer)}</textarea></label>
          </details>
          ${canEdit ? '' : `<p class="note">${ST.icon('lock', 14)} Nur-Lese-Ansicht – Vorlagen gestalten darf nur HR-Leitung / Admin.</p>`}
        </div>
        <div class="ds-stage">
          <div class="prev-h"><label class="inline-sel">Beispiel-Stelle <select id="sample">${ST.visibleJobs().map(j => `<option value="${j.id}" ${j.id === sampleId ? 'selected' : ''}>${e(j.title)}</option>`).join('')}</select></label></div>
          <div class="a4 big" id="a4"></div>
        </div>
      </div>`,
      `${ST.can('pdf.export') ? `<button class="btn ghost" id="pdf">${ST.icon('printer', 16)} Test-PDF</button>` : ''}
       ${canEdit ? `<button class="btn ghost" id="dup">${ST.icon('copy', 16)} Duplizieren</button>${!orig.isDefault ? `<button class="btn ghost danger" id="del">${ST.icon('trash', 16)}</button>` : ''}<button class="btn primary" id="save">${ST.icon('check', 16)} Speichern</button>` : ''}`);

    const sample = () => ST.job(sampleId) || ST.db.jobs[0];
    const drawOrder = () => {
      c.querySelector('#order').innerHTML = t.order.map((k, i) => { const [label, flag] = SEC[k]; return `<li class="${flag && !t[flag] ? 'off' : ''}">
        ${ST.icon('grip', 14, 'muted')}<span class="grow">${label}</span>
        ${flag ? `<button class="icon-btn" data-vis="${flag}" title="Ein-/Ausblenden" ${ro}>${ST.icon(t[flag] ? 'eye' : 'eyeoff', 15)}</button>` : ''}
        <button class="icon-btn" data-mv="${i}:-1" ${ro}>${ST.icon('up', 15)}</button><button class="icon-btn" data-mv="${i}:1" ${ro}>${ST.icon('down', 15)}</button></li>`; }).join('');
    };
    let raf;
    const preview = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const box = c.querySelector('#a4'); box.innerHTML = ST.renderPosting(sample(), t); ST.fitA4(box); }); };

    c.querySelector('.ds-panel').addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.dataset.h) t.h[el.dataset.h] = el.value;
      else if (el.dataset.k) {
        t[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
        if (el.type === 'color') el.nextElementSibling.textContent = el.value;
      }
      drawOrder(); preview();
    });
    c.querySelector('#order').addEventListener('click', (ev) => {
      const mv = ev.target.closest('[data-mv]'), vis = ev.target.closest('[data-vis]');
      if (mv) { const [i, d] = mv.dataset.mv.split(':').map(Number), j = i + d; if (j >= 0 && j < t.order.length) [t.order[i], t.order[j]] = [t.order[j], t.order[i]]; }
      if (vis) { t[vis.dataset.vis] = !t[vis.dataset.vis]; }
      drawOrder(); preview();
    });
    c.querySelector('#sample').onchange = (ev) => { sampleId = ev.target.value; sessionStorage.setItem('tplSample', sampleId); preview(); };
    root.querySelector('#pdf')?.addEventListener('click', () => ST.exportPdf(sample(), t));
    root.querySelector('#save')?.addEventListener('click', () => {
      if (t.isDefault) ST.db.templates.forEach(x => x.isDefault = false);
      Object.assign(orig, t); if (!ST.db.templates.some(x => x.isDefault)) ST.db.templates[0].isDefault = true;
      ST.log(`Vorlage „${t.name}“ gespeichert`); ST.save(); ST.toast('Vorlage gespeichert');
    });
    root.querySelector('#dup')?.addEventListener('click', () => {
      const n = JSON.parse(JSON.stringify(t)); n.id = ST.uid('tpl-'); n.name = t.name + ' (Kopie)'; n.isDefault = false;
      ST.db.templates.push(n); ST.save(); location.hash = '#/admin/templates/' + n.id;
    });
    root.querySelector('#del')?.addEventListener('click', () => ST.confirm('Vorlage löschen?', 'Stellen mit dieser Vorlage verwenden danach die Standardvorlage.', () => {
      ST.db.templates = ST.db.templates.filter(x => x.id !== id); ST.db.jobs.forEach(j => { if (j.templateId === id) j.templateId = ST.template().id; });
      ST.log(`Vorlage „${t.name}“ gelöscht`); ST.save(); location.hash = '#/admin/templates';
    }, 'Löschen', 'danger'));
    drawOrder(); preview();
    window.addEventListener('resize', preview);
  };

  /* ---------- Benutzer ---------- */
  ST.viewUsers = function (root) {
    if (!ST.can('users.manage')) return ST.denied(root, '#/admin/users');
    const c = ST.adminShell(root, '#/admin/users', 'Benutzer', `
      <div class="card table-card"><table class="tbl"><thead><tr><th>Name</th><th>Bereich</th><th>Rolle</th><th>Aktiv</th><th></th></tr></thead><tbody>
      ${ST.db.users.map(u => `<tr><td><div class="urow"><span class="avatar sm" style="--c:${ST.role(u)?.color}">${ST.initials(u.name)}</span><div><b>${e(u.name)}</b><small class="block muted">${e(u.email)}</small></div></div></td>
        <td>${e(u.dept)}</td>
        <td><select data-role="${u.id}" ${u.id === ST.me().id ? 'disabled title="Eigene Rolle nicht änderbar"' : ''}>${ST.db.roles.map(r => `<option value="${r.id}" ${r.id === u.role ? 'selected' : ''}>${e(r.name)}</option>`).join('')}</select></td>
        <td><label class="switch"><input type="checkbox" data-act="${u.id}" ${u.active ? 'checked' : ''} ${u.id === ST.me().id ? 'disabled' : ''}><i></i></label></td>
        <td class="acts">${u.id !== ST.me().id ? `<button class="icon-btn" data-rm="${u.id}" title="Entfernen">${ST.icon('trash', 16)}</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted small">${ST.icon('shield', 13)} Produktiv: Benutzer werden über Microsoft Entra ID (SSO) synchronisiert, Rollen über Entra-Gruppen zugeordnet.</p>`,
      `<button class="btn primary" id="add">${ST.icon('plus', 16)} Benutzer hinzufügen</button>`);
    c.addEventListener('change', ev => {
      const r = ev.target.dataset.role, a = ev.target.dataset.act;
      if (r) { const u = ST.user(r); u.role = ev.target.value; ST.log(`Rolle von ${u.name} → ${ST.role(u).name}`); ST.save(); ST.toast('Rolle geändert'); ST.viewUsers(root); }
      if (a) { const u = ST.user(a); u.active = ev.target.checked; ST.log(`${u.name} ${u.active ? 'aktiviert' : 'deaktiviert'}`); ST.save(); }
    });
    c.addEventListener('click', ev => { const b = ev.target.closest('[data-rm]'); if (b) { const u = ST.user(b.dataset.rm); ST.confirm('Benutzer entfernen?', `${e(u.name)} verliert den Zugang.`, () => { ST.db.users = ST.db.users.filter(x => x !== u); ST.log(`Benutzer ${u.name} entfernt`); ST.save(); ST.viewUsers(root); }, 'Entfernen', 'danger'); } });
    root.querySelector('#add').onclick = () => ST.modal({ title: 'Benutzer hinzufügen', body: `
      <label class="fld"><span>Name</span><input id="n"></label><label class="fld"><span>E-Mail</span><input id="m" type="email"></label>
      <label class="fld"><span>Funktion</span><input id="ti"></label>
      <div class="grid2"><label class="fld"><span>Bereich</span><select id="d">${ST.db.settings.depts.map(x => `<option>${e(x)}</option>`).join('')}</select></label>
      <label class="fld"><span>Rolle</span><select id="r">${ST.db.roles.map(r => `<option value="${r.id}">${e(r.name)}</option>`).join('')}</select></label></div>`,
      actions: [{ label: 'Abbrechen', cls: 'ghost' }, { label: 'Hinzufügen', cls: 'primary', onClick: (m) => {
        const n = m.querySelector('#n').value.trim(); if (!n) { ST.toast('Name fehlt', 'err'); return false; }
        ST.db.users.push({ id: ST.uid('u'), name: n, email: m.querySelector('#m').value, title: m.querySelector('#ti').value, dept: m.querySelector('#d').value, role: m.querySelector('#r').value, active: true });
        ST.log(`Benutzer ${n} angelegt`); ST.save(); ST.viewUsers(root);
      } }] });
  };

  /* ---------- Rollen & Rechte ---------- */
  ST.viewRoles = function (root) {
    if (!ST.canAny(['roles.manage', 'users.manage'])) return ST.denied(root, '#/admin/roles');
    const edit = ST.can('roles.manage');
    const c = ST.adminShell(root, '#/admin/roles', 'Rollen & Rechte', `
      <div class="roles-cards">${ST.db.roles.map(r => `<div class="card rcard" style="--c:${r.color}"><b>${e(r.name)}</b><p class="small muted">${e(r.desc)}</p>
        <small>${ST.db.users.filter(u => u.role === r.id).length} Benutzer · ${r.perms.length} Rechte</small></div>`).join('')}</div>
      <div class="card table-card"><table class="tbl matrix"><thead><tr><th>Recht</th>${ST.db.roles.map(r => `<th><span class="dot" style="--c:${r.color}"></span>${e(r.name)}</th>`).join('')}</tr></thead>
      <tbody>${ST.PERMISSIONS.map(g => `<tr class="grp"><td colspan="${ST.db.roles.length + 1}">${g.group}</td></tr>` + g.items.map(([k, l]) => `<tr><td>${l}<small class="block muted"><code>${k}</code></small></td>
        ${ST.db.roles.map(r => `<td class="c"><input type="checkbox" data-r="${r.id}" data-p="${k}" ${r.perms.includes(k) ? 'checked' : ''} ${!edit || r.system ? 'disabled' : ''}></td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>
      <div class="card"><div class="card-h"><h2>Regeln auf Datenebene</h2></div><ul class="rules">
        <li><b>Führungskräfte</b> sehen nur Stellen ihres Bereichs bzw. bei denen sie als Führungskraft eingetragen sind – und nur deren Bewerbungen.</li>
        <li><b>4-Augen-Prinzip:</b> Wer eine Stelle zur Freigabe einreicht, kann sie nicht selbst freigeben (Ausnahme: Administrator:in).</li>
        <li><b>Anonymisierung:</b> Ohne Recht „Personenbezogene Daten“ werden Namen, Kontaktdaten und Dokumente ausgeblendet (z. B. Betriebsrat: Statistik & Prozessüberblick).</li>
        <li><b>Stellenanforderung:</b> Führungskräfte können Stellen anfordern und bis zur Übernahme durch HR bearbeiten.</li>
        <li><b>DSGVO:</b> Automatische Löschung nach ${ST.db.settings.retentionMonths} Monaten (Talente-Pool: ${ST.db.settings.poolMonths} Monate); jede Aktion wird protokolliert.</li>
      </ul></div>`, edit ? `<button class="btn primary" id="add">${ST.icon('plus', 16)} Neue Rolle</button>` : '');
    c.addEventListener('change', ev => {
      const r = ST.db.roles.find(x => x.id === ev.target.dataset.r), p = ev.target.dataset.p; if (!r) return;
      r.perms = ev.target.checked ? [...new Set([...r.perms, p])] : r.perms.filter(x => x !== p);
      ST.log(`Recht ${p} für Rolle ${r.name} ${ev.target.checked ? 'erteilt' : 'entzogen'}`); ST.save(); ST.toast('Recht aktualisiert');
    });
    root.querySelector('#add')?.addEventListener('click', () => ST.modal({ title: 'Neue Rolle', body: `
      <label class="fld"><span>Name</span><input id="n" placeholder="z. B. Assistenz Personal"></label>
      <label class="fld"><span>Beschreibung</span><input id="d"></label>
      <label class="fld"><span>Rechte übernehmen von</span><select id="c"><option value="">– keine –</option>${ST.db.roles.map(r => `<option value="${r.id}">${e(r.name)}</option>`).join('')}</select></label>`,
      actions: [{ label: 'Abbrechen', cls: 'ghost' }, { label: 'Anlegen', cls: 'primary', onClick: (m) => {
        const n = m.querySelector('#n').value.trim(); if (!n) return false;
        const src = ST.db.roles.find(r => r.id === m.querySelector('#c').value);
        ST.db.roles.push({ id: ST.uid('r'), name: n, desc: m.querySelector('#d').value, color: '#475569', perms: src ? src.perms.slice() : [] });
        ST.log(`Rolle ${n} angelegt`); ST.save(); ST.viewRoles(root);
      } }] }));
  };

  /* ---------- Einstellungen ---------- */
  ST.viewSettings = function (root) {
    if (!ST.can('settings.manage')) return ST.denied(root, '#/admin/settings');
    const S = ST.db.settings;
    const tags = (k, l) => `<div class="fld"><span>${l}</span><div class="tags" data-tags="${k}">${S[k].map((v, i) => `<span class="tag">${e(v)}<button data-rmtag="${k}:${i}">${ST.icon('x', 12)}</button></span>`).join('')}
      <input placeholder="+ hinzufügen" data-addtag="${k}"></div></div>`;
    const c = ST.adminShell(root, '#/admin/settings', 'Einstellungen', `
      <div class="settings-grid">
        <div class="card"><div class="card-h"><h2>Stammdaten</h2></div>${tags('locations', 'Standorte')}${tags('depts', 'Bereiche')}${tags('hours', 'Arbeitszeitmodelle')}${tags('contracts', 'Dienstverhältnisse')}</div>
        <div class="stack">
          <div class="card"><div class="card-h"><h2>Benefits</h2></div>
            ${ST.db.benefits.map((b, i) => `<div class="ben-row">${ST.icon(b.icon, 18)}<input data-ben="${i}" value="${e(b.label)}"></div>`).join('')}</div>
          <div class="card"><div class="card-h"><h2>Datenschutz (DSGVO)</h2></div>
            <div class="grid2"><label class="fld"><span>Löschfrist (Monate)</span><input type="number" min="1" data-s="retentionMonths" value="${S.retentionMonths}"></label>
            <label class="fld"><span>Talente-Pool (Monate)</span><input type="number" min="1" data-s="poolMonths" value="${S.poolMonths}"></label></div>
            <label class="fld"><span>Link Datenschutzerklärung</span><input data-s="privacyUrl" value="${e(S.privacyUrl)}"></label></div>
          <div class="card"><div class="card-h"><h2>Demo</h2></div><p class="muted small">Alle Daten liegen in diesem Entwurf im Browser (localStorage).</p>
            <button class="btn danger ghost" id="reset">${ST.icon('history', 16)} Demo-Daten zurücksetzen</button></div>
        </div>
      </div>`);
    const persist = () => { ST.save(); ST.toast('Gespeichert'); };
    c.addEventListener('change', ev => {
      const t = ev.target;
      if (t.dataset.s) { S[t.dataset.s] = t.type === 'number' ? +t.value : t.value; persist(); }
      if (t.dataset.ben) { ST.db.benefits[+t.dataset.ben].label = t.value; persist(); }
    });
    c.addEventListener('keydown', ev => {
      const t = ev.target; if (t.dataset.addtag && ev.key === 'Enter' && t.value.trim()) { S[t.dataset.addtag].push(t.value.trim()); persist(); ST.viewSettings(root); root.querySelector(`[data-addtag=${t.dataset.addtag}]`).focus(); }
    });
    c.addEventListener('click', ev => { const b = ev.target.closest('[data-rmtag]'); if (b) { const [k, i] = b.dataset.rmtag.split(':'); S[k].splice(+i, 1); persist(); ST.viewSettings(root); } });
    root.querySelector('#reset').onclick = () => ST.confirm('Demo zurücksetzen?', 'Alle Änderungen gehen verloren.', () => { const u = ST.db.currentUser; ST.reset(); ST.db.currentUser = u; ST.save(); ST.route(); ST.toast('Zurückgesetzt'); }, 'Zurücksetzen', 'danger');
  };

  /* ---------- Protokoll ---------- */
  ST.viewAudit = function (root) {
    if (!ST.can('audit.view')) return ST.denied(root, '#/admin/audit');
    ST.adminShell(root, '#/admin/audit', 'Protokoll', `<div class="card table-card"><table class="tbl"><thead><tr><th>Zeitpunkt</th><th>Benutzer</th><th>Aktion</th></tr></thead><tbody>
      ${ST.db.audit.map(a => `<tr><td class="nowrap">${ST.fmtDateTime(a.at)}</td><td>${e(ST.user(a.by)?.name || (a.by === 'public' ? 'Bewerber:in (online)' : a.by))}</td><td>${e(a.text)}</td></tr>`).join('')}</tbody></table></div>`);
  };
})(window.ST);
