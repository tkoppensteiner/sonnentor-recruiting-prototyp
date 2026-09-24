/* SONNENTOR Recruiting – Datenhaltung (Demo: localStorage) + Stammdaten + Rollen/Rechte */
window.ST = window.ST || {};

(function (ST) {
  const KEY = 'sonnentor-recruiting-v1';

  /* ---------- Rechte-Katalog ---------- */
  ST.PERMISSIONS = [
    { group: 'Stellen', items: [
      ['jobs.view_all', 'Alle Stellen sehen'],
      ['jobs.view_own', 'Eigene Stellen sehen (Bereich / zugeordnet)'],
      ['jobs.request', 'Stellenanforderung stellen'],
      ['jobs.create', 'Stellen anlegen & bearbeiten'],
      ['jobs.approve', 'Stellen freigeben (4-Augen-Prinzip)'],
      ['jobs.publish', 'Stellen veröffentlichen / beenden'],
      ['jobs.delete', 'Stellen löschen / archivieren'],
    ]},
    { group: 'Bewerbungen', items: [
      ['apps.view_all', 'Alle Bewerbungen sehen'],
      ['apps.view_own', 'Bewerbungen eigener Stellen sehen'],
      ['apps.view_personal', 'Personenbezogene Daten & Dokumente sehen'],
      ['apps.rate', 'Bewerbungen bewerten & kommentieren'],
      ['apps.move', 'Status im Prozess ändern'],
      ['apps.reject', 'Absagen versenden'],
      ['apps.delete', 'Bewerbungen löschen (DSGVO)'],
    ]},
    { group: 'Vorlagen & PDF', items: [
      ['templates.view', 'Vorlagen verwenden'],
      ['templates.edit', 'Vorlagen gestalten (Template-Designer)'],
      ['pdf.export', 'PDF-Ausschreibung exportieren'],
    ]},
    { group: 'Administration', items: [
      ['users.manage', 'Benutzer verwalten'],
      ['roles.manage', 'Rollen & Rechte verwalten'],
      ['settings.manage', 'Stammdaten & Einstellungen'],
      ['audit.view', 'Protokoll einsehen'],
    ]},
  ];

  const ALL = ST.PERMISSIONS.flatMap(g => g.items.map(i => i[0]));

  const DEFAULT_ROLES = [
    { id: 'admin', name: 'Administrator:in', color: '#7c3aed', system: true,
      desc: 'Vollzugriff inkl. Benutzer-, Rollen- und Systemverwaltung.', perms: ALL.slice() },
    { id: 'hrlead', name: 'HR-Leitung', color: '#1e4d8c',
      desc: 'Verantwortet den Recruiting-Prozess, gibt Stellen frei, gestaltet Vorlagen.',
      perms: ALL.filter(p => !['users.manage', 'roles.manage'].includes(p)) },
    { id: 'recruiter', name: 'HR-Recruiter:in', color: '#0e7490',
      desc: 'Erstellt Stellen, betreut Bewerbungen, exportiert Ausschreibungen.',
      perms: ['jobs.view_all', 'jobs.request', 'jobs.create', 'jobs.publish', 'apps.view_all', 'apps.view_personal',
        'apps.rate', 'apps.move', 'apps.reject', 'templates.view', 'pdf.export', 'audit.view'] },
    { id: 'manager', name: 'Führungskraft', color: '#b45309',
      desc: 'Fordert Stellen an, sieht & bewertet nur Bewerbungen der eigenen Stellen.',
      perms: ['jobs.view_own', 'jobs.request', 'apps.view_own', 'apps.view_personal', 'apps.rate', 'templates.view', 'pdf.export'] },
    { id: 'works', name: 'Betriebsrat', color: '#4d7c0f',
      desc: 'Informationsrecht: sieht Stellen & anonymisierte Bewerbungsstatistik.',
      perms: ['jobs.view_all', 'apps.view_all', 'templates.view'] },
  ];

  /* ---------- Stammdaten ---------- */
  const BENEFITS = [
    { id: 'lunch', label: 'kostenloses Bio-Mittagsmenü', icon: 'utensils' },
    { id: 'kids', label: 'Kindertages-betreuung', icon: 'baby' },
    { id: 'home', label: 'Home Office', icon: 'home' },
    { id: 'sport', label: 'Sport & Gesundheit', icon: 'heart' },
    { id: 'edu', label: 'Aus- & Weiterbildungen', icon: 'grad' },
    { id: 'disc', label: 'Vergünstigungen & Kooperationen', icon: 'tag' },
    { id: 'ev', label: 'E-Ladestationen', icon: 'plug' },
    { id: 'team', label: 'Teamevents', icon: 'party' },
  ];

  const DEFAULT_TEMPLATES = [
    { id: 'tpl-kraft', name: 'SONNENTOR Kraftpapier', isDefault: true,
      style: 'kraft', primary: '#1e4d8c', accent: '#ffd000', text: '#2b2118', paper: '#fbf6ec',
      fontHeading: 'Nunito', fontBody: 'Nunito', density: 'compact',
      showImage: true, showFacts: true, showBenefits: true, benefitsStyle: 'icons', showContact: true, showQR: true, showSalary: true,
      logoPos: 'right',
      h: { tasks: 'Du freust dich auf', profile: 'Wir freuen uns auf dich und', offer: '… und lassen für dich die Sonne strahlen', contact: 'Deine Ansprechperson' },
      order: ['facts', 'intro', 'tasks', 'profile', 'offer', 'benefits', 'contact'],
      footer: 'SONNENTOR Kräuterhandelsgesellschaft mbH · Sprögnitz 10 · 3910 Zwettl · sonnentor.com/karriere' },
    { id: 'tpl-clean', name: 'Klar & modern', isDefault: false,
      style: 'clean', primary: '#1e4d8c', accent: '#ffd000', text: '#1f2937', paper: '#ffffff',
      fontHeading: 'Nunito', fontBody: 'Source Sans 3', density: 'compact',
      showImage: true, showFacts: true, showBenefits: true, benefitsStyle: 'list', showContact: true, showQR: true, showSalary: true,
      logoPos: 'left',
      h: { tasks: 'Deine Aufgaben', profile: 'Dein Profil', offer: 'Unser Angebot', contact: 'Kontakt' },
      order: ['facts', 'intro', 'tasks', 'profile', 'offer', 'contact', 'benefits'],
      footer: 'SONNENTOR · sonnentor.com/karriere' },
    { id: 'tpl-sun', name: 'Sonnenschein (Lehre & Aushang)', isDefault: false,
      style: 'sun', primary: '#1e4d8c', accent: '#ffd000', text: '#1e293b', paper: '#fffdf5',
      fontHeading: 'Caveat', fontBody: 'Nunito', density: 'normal',
      showImage: false, showFacts: true, showBenefits: true, benefitsStyle: 'icons', showContact: true, showQR: true, showSalary: true,
      logoPos: 'right',
      h: { tasks: 'Das erwartet dich', profile: 'Das bringst du mit', offer: 'Darauf kannst du dich freuen', contact: 'Melde dich bei' },
      order: ['facts', 'intro', 'tasks', 'profile', 'offer', 'benefits', 'contact'],
      footer: 'SONNENTOR · Wir lassen die Sonne strahlen · sonnentor.com/karriere' },
  ];

  const USERS = [
    { id: 'u1', name: 'Thomas Koppensteiner', title: 'IT', role: 'admin', dept: 'IT', email: 'thomas.koppensteiner@sonnentor.at', active: true },
    { id: 'u2', name: 'Thomas Steinbauer', title: 'Personal | Talente-Förderer', role: 'recruiter', dept: 'Personal', phone: '+43 2875 7256 313', email: 'personal@sonnentor.at', active: true },
    { id: 'u3', name: 'Andrea Hofbauer', title: 'Leitung Personal', role: 'hrlead', dept: 'Personal', phone: '+43 2875 7256 300', email: 'personal@sonnentor.at', active: true },
    { id: 'u4', name: 'Markus Leitner', title: 'Leitung Marketing', role: 'manager', dept: 'Marketing', email: 'marketing@sonnentor.at', active: true },
    { id: 'u5', name: 'Sabine Gruber', title: 'Leitung Logistik', role: 'manager', dept: 'Logistik', email: 'logistik@sonnentor.at', active: true },
    { id: 'u6', name: 'Josef Wagner', title: 'Betriebsratsvorsitz', role: 'works', dept: 'Produktion', email: 'betriebsrat@sonnentor.at', active: true },
  ];

  const IMG = {
    office: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=70&auto=format&fit=crop',
    herbs: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=1200&q=70&auto=format&fit=crop',
    kitchen: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=70&auto=format&fit=crop',
    ware: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=70&auto=format&fit=crop',
    it: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=70&auto=format&fit=crop',
    shop: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=70&auto=format&fit=crop',
  };
  ST.IMAGES = IMG;

  const d = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();

  const JOBS = [
    { id: 'j643', ref: '643', title: 'Mitarbeiter:in für Werbung, Kooperationen & Sponsoring', dept: 'Marketing', location: 'Sprögnitz',
      hours: 'TZ oder VZ', start: 'Ab sofort', contract: 'Unbefristet', level: 'Berufserfahrung',
      intro: 'Du denkst Marketing ganzheitlich, hast ein Gespür für starke Markenkommunikation und behältst auch bei vielfältigen Projekten den Überblick? Du bringst Erfahrung im Bereich Marketing und Werbung mit und möchtest kreative Ideen in wirksame Kampagnen, passende Kooperationen und begeisternde Social-Media-Werbung übersetzen, dann bist du bei SONNENTOR genau richtig.',
      tasks: ['die strategische Jahres- und Maßnahmenplanung sowie Budgetkontrolle für die Bereiche Werbung, Kooperationen & Sponsoring',
        'die Erfolgskontrolle und strategische Weiterentwicklung dieser Bereiche in Zusammenarbeit mit dem Werbeteam',
        'die Konzeption und Umsetzung von Print- und Online-Werbemaßnahmen für unsere Produkt- und Markenkampagnen',
        'die strategische Planung und Umsetzung von Social-Media- und Influencer-Werbung sowie den persönlichen Austausch mit Influencer:innen, als zentrale Ansprechperson',
        'die Erarbeitung und Umsetzung von Kooperationen mit ausgewählten Partner:innen',
        'die Auswahl und Koordination von Produktsponsorings'],
      profile: ['dein abgeschlossenes Studium und/oder deine mehrjährige Erfahrung im Bereich Marketing & Werbung',
        'deine selbstständige, ergebnisorientierte Persönlichkeit', 'dein Verhandlungsgeschick und deine kreativen Ideen',
        'deine strukturierte und teamorientierte Arbeitsweise'],
      offer: ['ab sofort mit einer unbefristeten Teil- oder Vollzeitbeschäftigung (38,5h) ab August',
        'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Mit einem Mindestgehalt von Euro 2.500,- brutto pro Monat. - Das tatsächliche Gehalt richtet sich nach deiner Qualifikation und Erfahrung und wird gemeinsam mit dir festgelegt.',
      benefits: BENEFITS.map(b => b.id), contactId: 'u2', managerId: 'u4', templateId: 'tpl-kraft', image: IMG.office,
      status: 'published', createdBy: 'u2', createdAt: d(21), publishedAt: d(18), deadline: '',
      form: { photo: 'optional', letter: 'optional', cv: 'required', questions: ['Frühestmöglicher Eintrittstermin', 'Gehaltsvorstellung (brutto/Monat)'] } },

    { id: 'j651', ref: '651', title: 'Lagermitarbeiter:in Kommissionierung', dept: 'Logistik', location: 'Sprögnitz',
      hours: 'VZ', start: 'Ab sofort', contract: 'Unbefristet', level: 'Einstieg',
      intro: 'Bei uns verlassen täglich tausende Packerl mit Kräutern, Tees und Gewürzen das Haus. Du packst gern mit an, arbeitest sorgfältig und schätzt ein herzliches Team? Dann bring Schwung in unsere Logistik!',
      tasks: ['die Kommissionierung von Kundenaufträgen mit Handscanner', 'die Warenannahme und Kontrolle eingehender Lieferungen', 'das Verpacken und die Versandvorbereitung', 'die Mithilfe bei Inventuren und die Sauberkeit im Lager'],
      profile: ['deine Zuverlässigkeit und Genauigkeit', 'deine körperliche Belastbarkeit', 'idealerweise deinen Staplerschein (oder die Bereitschaft, ihn zu machen)', 'gute Deutschkenntnisse'],
      offer: ['ab sofort mit einer unbefristeten Vollzeitbeschäftigung (38,5h, Mo–Fr)', 'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Mit einem Mindestgehalt von Euro 2.250,- brutto pro Monat (KV Handel), Überzahlung je nach Qualifikation möglich.',
      benefits: ['lunch', 'kids', 'sport', 'edu', 'disc', 'team'], contactId: 'u2', managerId: 'u5', templateId: 'tpl-kraft', image: IMG.ware,
      status: 'published', createdBy: 'u2', createdAt: d(12), publishedAt: d(10), deadline: '',
      form: { photo: 'hidden', letter: 'hidden', cv: 'optional', questions: ['Hast du einen Staplerschein?'] } },

    { id: 'j655', ref: '655', title: 'Koch / Köchin im Bio-Gasthaus Leibspeis', dept: 'Gastronomie', location: 'Sprögnitz',
      hours: 'VZ', start: 'Ab März', contract: 'Unbefristet', level: 'Berufserfahrung',
      intro: 'In unserem Bio-Gasthaus „Leibspeis“ kochen wir mit Kräutern aus dem eigenen Garten und Zutaten von Bio-Bäuer:innen aus der Region. Du liebst ehrliche Küche? Dann koch mit uns!',
      tasks: ['die Zubereitung saisonaler, regionaler Bio-Gerichte', 'die Mitgestaltung unserer Wochenkarte', 'die Einhaltung von HACCP-Richtlinien', 'die Unterstützung bei Veranstaltungen & Caterings'],
      profile: ['deine abgeschlossene Ausbildung als Koch/Köchin', 'deine Leidenschaft für Bio-Lebensmittel', 'dein Teamgeist und deine Kreativität'],
      offer: ['eine unbefristete Vollzeitstelle mit geregelten Arbeitszeiten, keine Nachtdienste', 'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Mit einem Mindestgehalt von Euro 2.400,- brutto pro Monat, Überzahlung je nach Erfahrung.',
      benefits: ['lunch', 'kids', 'sport', 'edu', 'disc', 'team'], contactId: 'u2', managerId: '', templateId: 'tpl-kraft', image: IMG.kitchen,
      status: 'published', createdBy: 'u3', createdAt: d(30), publishedAt: d(28), deadline: '',
      form: { photo: 'optional', letter: 'optional', cv: 'required', questions: [] } },

    { id: 'j658', ref: '658', title: 'IT-Systemadministrator:in', dept: 'IT', location: 'Sprögnitz',
      hours: 'VZ', start: 'Ab sofort', contract: 'Unbefristet', level: 'Berufserfahrung',
      intro: 'Du sorgst dafür, dass bei uns alles rund läuft – von Microsoft 365 bis zur Produktions-IT. Du bist neugierig, lösungsorientiert und magst Technik mit Sinn?',
      tasks: ['die Betreuung unserer Windows-Server-, Netzwerk- und Microsoft-365-Umgebung', 'den 2nd-Level-Support für unsere Kolleg:innen', 'die Mitarbeit an IT-Projekten und die Weiterentwicklung unserer Infrastruktur', 'IT-Security und Backup-Management'],
      profile: ['deine technische Ausbildung (HTL, FH oder vergleichbar)', 'deine Erfahrung mit Windows Server, Active Directory / Entra ID', 'deine Kommunikationsstärke und Serviceorientierung'],
      offer: ['eine unbefristete Vollzeitbeschäftigung (38,5h) mit Gleitzeit', 'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Mit einem Mindestgehalt von Euro 3.200,- brutto pro Monat. Das tatsächliche Gehalt richtet sich nach deiner Qualifikation und Erfahrung.',
      benefits: BENEFITS.map(b => b.id), contactId: 'u2', managerId: 'u1', templateId: 'tpl-clean', image: IMG.it,
      status: 'review', createdBy: 'u2', createdAt: d(3), publishedAt: '', deadline: '',
      form: { photo: 'optional', letter: 'optional', cv: 'required', questions: ['Gehaltsvorstellung (brutto/Monat)'] } },

    { id: 'j660', ref: '660', title: 'Verkäufer:in im SONNENTOR Geschäft Wien', dept: 'Vertrieb', location: 'Wien',
      hours: 'TZ (25h)', start: 'Ab April', contract: 'Unbefristet', level: 'Einstieg',
      intro: 'Du begeisterst Menschen für Bio-Kräuter und Tee und bist gern Gastgeber:in? In unserem Geschäft in der Wiener Innenstadt bist du das Gesicht von SONNENTOR.',
      tasks: ['die Beratung und den Verkauf an unsere Kund:innen', 'die Warenpräsentation und Dekoration', 'die Kassenführung'],
      profile: ['Freude am Verkauf und Umgang mit Menschen', 'idealerweise Erfahrung im Einzelhandel', 'Flexibilität für Samstagsdienste'],
      offer: ['eine unbefristete Teilzeitbeschäftigung (25h)', 'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Mit einem Mindestgehalt von Euro 2.100,- brutto pro Monat auf Vollzeitbasis (KV Handel).',
      benefits: ['disc', 'edu', 'team', 'sport'], contactId: 'u2', managerId: '', templateId: 'tpl-sun', image: IMG.shop,
      status: 'draft', createdBy: 'u2', createdAt: d(1), publishedAt: '', deadline: '',
      form: { photo: 'optional', letter: 'hidden', cv: 'optional', questions: [] } },

    { id: 'j662', ref: '662', title: 'Lehrling Bürokaufmann / Bürokauffrau', dept: 'Personal', location: 'Sprögnitz',
      hours: 'VZ', start: 'September', contract: 'Lehre (3 Jahre)', level: 'Lehre',
      intro: 'Du hast die Pflichtschule (fast) geschafft und willst einen Beruf mit Zukunft lernen? Bei uns lernst du alle Bereiche eines nachhaltigen Unternehmens kennen.',
      tasks: ['das Kennenlernen aller kaufmännischen Abteilungen', 'die Mitarbeit in Buchhaltung, Einkauf und Personal', 'eigene kleine Projekte im Lehrlingsteam'],
      profile: ['deinen positiven Pflichtschulabschluss', 'deine Neugier und Lernbereitschaft', 'Freude am Umgang mit Menschen und am Computer'],
      offer: ['eine abwechslungsreiche Lehre mit Lehrlingsakademie', 'mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'],
      salary: 'Lehrlingsentschädigung laut KV Handel: 1. Lehrjahr Euro 1.000,- brutto pro Monat.',
      benefits: ['lunch', 'sport', 'edu', 'disc', 'team'], contactId: 'u3', managerId: '', templateId: 'tpl-sun', image: IMG.herbs,
      status: 'closed', createdBy: 'u3', createdAt: d(90), publishedAt: d(88), deadline: '',
      form: { photo: 'optional', letter: 'optional', cv: 'optional', questions: ['Welche Schule besuchst du derzeit?'] } },
  ];

  ST.STAGES = [
    { id: 'new', label: 'Neu', color: '#2563eb' },
    { id: 'review', label: 'In Prüfung', color: '#7c3aed' },
    { id: 'interview', label: 'Gespräch', color: '#d97706' },
    { id: 'offer', label: 'Angebot', color: '#0d9488' },
    { id: 'hired', label: 'Eingestellt', color: '#16a34a' },
    { id: 'rejected', label: 'Abgesagt', color: '#9ca3af' },
  ];

  ST.JOB_STATUS = {
    request: { label: 'Anforderung', color: '#b45309' },
    draft: { label: 'Entwurf', color: '#64748b' },
    review: { label: 'In Freigabe', color: '#7c3aed' },
    published: { label: 'Veröffentlicht', color: '#16a34a' },
    paused: { label: 'Pausiert', color: '#d97706' },
    closed: { label: 'Beendet', color: '#9ca3af' },
  };

  ST.SOURCES = ['SONNENTOR Homepage', 'Online Stellenmärkte', 'Social Media', 'Freunde, Bekannte', 'AMS', 'Internet-Suchmaschine', 'Messeauftritt', 'Zeitung, andere Printmedien', 'Flyer, Informationsbroschüre', 'Sonstiges'];

  const people = [
    ['Frau', 'Lena', 'Huber', 'j643', 'interview', 4, 'Social Media', 5],
    ['Herr', 'David', 'Mayr', 'j643', 'review', 3, 'SONNENTOR Homepage', 2],
    ['Frau', 'Sophie', 'Berger', 'j643', 'new', 4, 'Online Stellenmärkte', 1],
    ['Divers', 'Alex', 'Pichler', 'j643', 'offer', 5, 'Freunde, Bekannte', 11],
    ['Frau', 'Julia', 'Steiner', 'j643', 'rejected', 2, 'Internet-Suchmaschine', 14],
    ['Herr', 'Florian', 'Moser', 'j651', 'new', 0, 'AMS', 0],
    ['Herr', 'Stefan', 'Wimmer', 'j651', 'interview', 4, 'Freunde, Bekannte', 6],
    ['Frau', 'Katharina', 'Eder', 'j651', 'review', 3, 'SONNENTOR Homepage', 2],
    ['Herr', 'Lukas', 'Schwarz', 'j655', 'hired', 5, 'Social Media', 20],
    ['Frau', 'Anna', 'Fuchs', 'j655', 'review', 3, 'Zeitung, andere Printmedien', 4],
    ['Frau', 'Marie', 'Brunner', 'j655', 'new', 0, 'SONNENTOR Homepage', 1],
    ['Herr', 'Tobias', 'Reiter', 'j651', 'rejected', 1, 'Online Stellenmärkte', 9],
  ];
  const APPS = people.map((p, i) => ({
    id: 'a' + (100 + i), salutation: p[0], first: p[1], last: p[2], jobId: p[3], stage: p[4], rating: p[5], source: p[6],
    createdAt: d(p[7]), email: (p[1] + '.' + p[2]).toLowerCase() + '@example.com', phone: '+43 660 ' + (1000000 + i * 7919),
    street: 'Musterstraße ' + (i + 3), zip: ['3910', '3500', '1070', '3100', '4020'][i % 5], city: ['Zwettl', 'Krems', 'Wien', 'St. Pölten', 'Linz'][i % 5], country: 'Österreich',
    files: [{ kind: 'Lebenslauf', name: 'Lebenslauf_' + p[2] + '.pdf', size: 184000 + i * 3100 }].concat(i % 3 === 0 ? [{ kind: 'Motivationsschreiben', name: 'Anschreiben_' + p[2] + '.pdf', size: 92000 }] : []),
    answers: {}, consent: i % 2 ? 'pool' : 'delete', privacy: true,
    comments: i % 4 === 0 ? [{ by: 'u2', at: d(p[7] > 0 ? p[7] - 1 : 0), text: 'Sehr sympathisch am Telefon, Unterlagen vollständig.' }] : [],
    history: [{ at: d(p[7]), text: 'Bewerbung online eingegangen' }],
  }));

  const SETTINGS = {
    company: 'SONNENTOR Kräuterhandelsgesellschaft mbH',
    locations: ['Sprögnitz', 'Zwettl', 'Wien', 'Graz', 'Salzburg'],
    depts: ['Marketing', 'Vertrieb', 'Logistik', 'Produktion', 'Gastronomie', 'IT', 'Personal', 'Einkauf', 'Finanzen', 'Qualitätsmanagement'],
    hours: ['VZ', 'TZ', 'TZ oder VZ', 'Geringfügig'],
    contracts: ['Unbefristet', 'Befristet', 'Lehre (3 Jahre)', 'Praktikum', 'Saisonal'],
    retentionMonths: 6, poolMonths: 24,
    privacyUrl: 'https://www.sonnentor.com/de-at/datenschutz',
    careerUrl: 'https://www.sonnentor.com/de-at/ueber-uns/karriere',
  };

  function seed() {
    return {
      version: 2,
      roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
      users: USERS, jobs: JOBS, apps: APPS, templates: DEFAULT_TEMPLATES, benefits: BENEFITS, settings: SETTINGS,
      audit: [
        { at: d(18), by: 'u2', text: 'Stelle „Mitarbeiter:in für Werbung, Kooperationen & Sponsoring“ veröffentlicht' },
        { at: d(10), by: 'u3', text: 'Stelle „Lagermitarbeiter:in Kommissionierung“ freigegeben' },
        { at: d(3), by: 'u2', text: 'Stelle „IT-Systemadministrator:in“ zur Freigabe eingereicht' },
      ],
      currentUser: null,
    };
  }

  ST.db = null;
  ST.load = function () {
    try { ST.db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { ST.db = null; }
    if (!ST.db || ST.db.version !== 2) { ST.db = seed(); ST.save(); }
  };
  ST.save = function () { try { localStorage.setItem(KEY, JSON.stringify(ST.db)); } catch (e) { console.warn(e); } };
  ST.reset = function () { localStorage.removeItem(KEY); ST.load(); };
  ST.uid = (p) => p + Math.random().toString(36).slice(2, 8);

  /* ---------- Auth / Rechte ---------- */
  ST.me = () => ST.db.users.find(u => u.id === ST.db.currentUser) || null;
  ST.role = (u) => ST.db.roles.find(r => r.id === (u || ST.me() || {}).role);
  ST.can = function (perm) { const r = ST.role(); return !!(r && r.perms.includes(perm)); };

  /* Sichtbarkeit (Datenebene): Führungskräfte sehen nur ihre Stellen */
  ST.canSeeJob = function (job) {
    const me = ST.me(); if (!me) return false;
    if (ST.can('jobs.view_all')) return true;
    if (ST.can('jobs.view_own')) return job.managerId === me.id || job.dept === me.dept || job.createdBy === me.id;
    return false;
  };
  ST.visibleJobs = () => ST.db.jobs.filter(ST.canSeeJob);
  ST.canSeeApp = function (app) {
    if (ST.can('apps.view_all')) return true;
    const job = ST.job(app.jobId);
    return !!(ST.can('apps.view_own') && job && ST.canSeeJob(job));
  };
  ST.visibleApps = () => ST.db.apps.filter(ST.canSeeApp);
  ST.canEditJob = function (job) {
    const me = ST.me();
    if (ST.can('jobs.create')) return true;
    return ST.can('jobs.request') && job.createdBy === me.id && ['request', 'draft'].includes(job.status);
  };

  ST.job = (id) => ST.db.jobs.find(j => j.id === id || j.ref === id);
  ST.user = (id) => ST.db.users.find(u => u.id === id);
  ST.template = (id) => ST.db.templates.find(t => t.id === id) || ST.db.templates.find(t => t.isDefault) || ST.db.templates[0];
  ST.benefit = (id) => ST.db.benefits.find(b => b.id === id);

  ST.log = function (text) {
    ST.db.audit.unshift({ at: new Date().toISOString(), by: ST.db.currentUser || 'public', text });
    ST.db.audit = ST.db.audit.slice(0, 300);
  };

  ST.newJob = function () {
    const me = ST.me();
    const tpl = ST.template();
    const maxRef = Math.max(...ST.db.jobs.map(j => +j.ref || 0), 600);
    return {
      id: ST.uid('j'), ref: String(maxRef + 1), title: '', dept: me.dept || '', location: 'Sprögnitz', hours: 'VZ', start: 'Ab sofort', contract: 'Unbefristet', level: 'Berufserfahrung',
      intro: '', tasks: [''], profile: [''], offer: ['mit vielen weiteren Vorteilen, mit denen wir Gutes für uns tun'], salary: '',
      benefits: ST.db.benefits.map(b => b.id), contactId: ST.db.users.find(u => u.role === 'recruiter')?.id || me.id,
      managerId: ST.role().id === 'manager' ? me.id : '', templateId: tpl.id, image: IMG.herbs,
      status: ST.can('jobs.create') ? 'draft' : 'request', createdBy: me.id, createdAt: new Date().toISOString(), publishedAt: '', deadline: '',
      form: { photo: 'optional', letter: 'optional', cv: 'required', questions: [] },
    };
  };
})(window.ST);
