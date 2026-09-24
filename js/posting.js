/* Renderer: Stelle + Vorlage => fertige Ausschreibung (A4 / PDF) */
(function (ST) {
  const e = (s) => ST.esc(s);

  ST.qrSvg = function (text, size = 96) {
    try {
      const q = qrcode(0, 'M'); q.addData(text); q.make();
      const n = q.getModuleCount(), c = size / n;
      let d = '';
      for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) d += `M${(col * c).toFixed(2)} ${(r * c).toFixed(2)}h${c.toFixed(2)}v${c.toFixed(2)}h-${c.toFixed(2)}z`;
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path d="${d}" fill="currentColor"/></svg>`;
    } catch (err) {
      return `<div class="qr-fallback" style="width:${size}px;height:${size}px">QR</div>`;
    }
  };

  ST.renderPosting = function (job, tpl) {
    tpl = tpl || ST.template(job.templateId);
    const contact = ST.user(job.contactId);
    const list = (arr) => `<ul>${(arr || []).filter(Boolean).map(x => `<li>${e(x)}</li>`).join('')}</ul>`;
    const [first, ...rest] = (contact?.name || '').split(' ');

    const S = {
      facts: () => tpl.showFacts ? `<div class="p-facts">
          <span>${ST.icon('pin', 14)} ${e(job.location)}</span><span>${ST.icon('clock', 14)} ${e(job.hours)}</span>
          <span>${ST.icon('calendar', 14)} ${e(job.start)}</span><span>${ST.icon('file', 14)} ${e(job.contract)}</span></div>` : '',
      intro: () => job.intro ? `<p class="p-intro">${e(job.intro)}</p>` : '',
      tasks: () => job.tasks?.some(Boolean) ? `<section><h3>${e(tpl.h.tasks)}</h3>${list(job.tasks)}</section>` : '',
      profile: () => job.profile?.some(Boolean) ? `<section><h3>${e(tpl.h.profile)}</h3>${list(job.profile)}</section>` : '',
      offer: () => `<section><h3>${e(tpl.h.offer)}</h3>${list(job.offer)}${tpl.showSalary && job.salary ? `<p class="p-salary">${e(job.salary)}</p>` : ''}</section>`,
      benefits: () => tpl.showBenefits && job.benefits?.length ? (tpl.benefitsStyle === 'icons'
        ? `<div class="p-benefits">${job.benefits.map(id => ST.benefit(id)).filter(Boolean).map(b => `<div class="p-ben"><span>${ST.icon(b.icon, 22)}</span>${e(b.label).replace(/-(?=[a-zäöü])/, '&shy;')}</div>`).join('')}</div>`
        : `<section class="p-benlist"><h3>Deine Vorteile</h3><p>${job.benefits.map(id => ST.benefit(id)?.label.replace(/-(?=[a-zäöü])/, '')).filter(Boolean).map(e).join(' · ')}</p></section>`) : '',
      contact: () => tpl.showContact || tpl.showQR ? `<div class="p-contact">
          ${tpl.showContact && contact ? `<div><h4>${e(tpl.h.contact)}:</h4><p class="p-cname"><b>${e(first)}</b> ${e(rest.join(' '))}</p><p>${e(contact.title || '')}</p>${contact.phone ? `<p>${e(contact.phone)}</p>` : ''}${contact.email ? `<p>${e(contact.email)}</p>` : ''}</div>` : '<div></div>'}
          ${tpl.showQR ? `<div class="p-qr">${ST.qrSvg(ST.applyUrl(job), 88)}<span>Jetzt bewerben</span></div>` : ''}
        </div>` : '',
    };

    const style = `--p:${tpl.primary};--a:${tpl.accent};--t:${tpl.text};--paper:${tpl.paper};--fh:'${tpl.fontHeading}';--fb:'${tpl.fontBody}'`;
    const hero = tpl.showImage && job.image ? `<div class="p-img" style="background-image:url('${e(job.image)}')"></div>` : '';

    return `<article class="posting st-${tpl.style} dens-${tpl.density} logo-${tpl.logoPos}" style="${style}">
      <header class="p-head">
        <div class="p-logo">${ST.logo(tpl.style === 'clean' ? 44 : 64)}</div>
        ${tpl.style === 'sun' ? '<div class="p-sunrays"></div>' : ''}
        ${hero}
        <h1 class="p-title"><span>${e(job.title || 'Stellentitel')}</span></h1>
      </header>
      <div class="p-body">${tpl.order.map(k => S[k] ? S[k]() : '').join('')}</div>
      <footer class="p-foot">${e(tpl.footer)}</footer>
    </article>`;
  };

  /* PDF-Export: öffnet druckoptimiertes Fenster -> "Als PDF speichern" */
  ST.exportPdf = function (job, tpl) {
    tpl = tpl || ST.template(job.templateId);
    const w = window.open('', '_blank');
    if (!w) return ST.toast('Pop-up blockiert – bitte Pop-ups erlauben', 'err');
    const base = location.href.split('#')[0].replace(/[^/]*$/, '');
    w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Ausschreibung ${e(job.ref)} – ${e(job.title)}</title>
      <base href="${base}">
      <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Merriweather:wght@400;700&family=Nunito:wght@400;600;700;800;900&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="css/posting.css">
      <style>@page{size:A4;margin:0}body{margin:0;background:#fff}.posting{box-shadow:none!important;margin:0!important}</style>
      </head><body class="print" style="background:${e(tpl.paper)}">${ST.renderPosting(job, tpl)}
      <script>document.fonts.ready.then(()=>setTimeout(()=>{window.print()},400));<\/script></body></html>`);
    w.document.close();
    ST.log(`PDF-Ausschreibung „${job.title}“ exportiert (Vorlage: ${tpl.name})`); ST.save();
  };
})(window.ST);
