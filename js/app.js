/* Router */
(function (ST) {
  ST.route = function () {
    const root = document.getElementById('app');
    const [path, query] = (location.hash.slice(1) || '/').split('?');
    const p = path.split('/').filter(Boolean);
    window.scrollTo(0, 0);
    const b = document.body;
    b.classList.toggle('is-admin', p[0] === 'admin');
    b.classList.toggle('print', p[0] === 'print');
    b.classList.toggle('demo', p[0] !== 'print'); /* Prototyp-Hinweis, nicht in der Druckansicht */
    b.style.background = '';

    if (p[0] === 'jobs' && p[2] === 'apply') return ST.viewApply(root, p[1]);
    if (p[0] === 'jobs' && p[1]) return ST.viewJob(root, p[1]);
    if (p[0] === 'danke') return ST.viewThanks(root, p[1]);
    if (p[0] === 'print') { /* Druckansicht (öffentlich nur für veröffentlichte Stellen) */
      const j = ST.job(p[1]);
      if (!j || (j.status !== 'published' && !ST.me())) return ST.viewJob(root, p[1]);
      b.style.background = ST.template(j.templateId).paper; /* Folgeseiten in Papierfarbe */
      root.innerHTML = ST.renderPosting(j);
      return;
    }
    if (p[0] === 'login') return ST.viewLogin(root);
    if (p[0] === 'admin' || p[0] === 'preview') {
      if (!ST.me()) { location.hash = '#/login'; return; }
      if (p[0] === 'preview') return ST.viewJob(root, p[1], true);
      switch (p[1]) {
        case undefined: return ST.viewDashboard(root);
        case 'jobs': return p[2] ? ST.viewJobEdit(root, p[2]) : ST.viewJobs(root);
        case 'applications': return p[2] ? ST.viewApp(root, p[2]) : ST.viewApps(root, query);
        case 'templates': return p[2] ? ST.viewTemplateEdit(root, p[2]) : ST.viewTemplates(root);
        case 'users': return ST.viewUsers(root);
        case 'roles': return ST.viewRoles(root);
        case 'settings': return ST.viewSettings(root);
        case 'audit': return ST.viewAudit(root);
      }
    }
    return ST.viewCareers(root);
  };

  ST.load();
  /* Demo-Direktlink: ?as=u2 meldet direkt als Benutzer an (nur im Entwurf) */
  const as = new URLSearchParams(location.search).get('as');
  if (as && ST.user(as)) { ST.db.currentUser = as; ST.save(); }
  if (as) try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* file:// */ }
  window.addEventListener('hashchange', ST.route);
  document.addEventListener('DOMContentLoaded', ST.route);
})(window.ST);
