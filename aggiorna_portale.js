const fs = require('fs');
const path = require('path');

// Costanti
const DIRECTORY_ESAMI = path.join(__dirname, 'esami');
const OUTPUT_HTML = path.join(__dirname, 'index.html');
const OUTPUT_ROBOTS = path.join(__dirname, 'robots.txt');

console.log('🔄 Ricerca degli esami in corso...');

// Verifica che la cartella "esami" esista
if (!fs.existsSync(DIRECTORY_ESAMI)) {
  console.error('❌ ERRORE: La cartella "esami" non è stata trovata in questa directory.');
  console.error(`=> Assicurati che lo script si trovi nella stessa cartella di "esami/" (percorso cercato: ${DIRECTORY_ESAMI})`);
  process.exit(1);
}

// 1. Scansiona le cartelle (10, 20, 80...)
const categorie = fs.readdirSync(DIRECTORY_ESAMI, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

// 2. Per ogni categoria, scansiona i file html
const mappaEsami = {};
let fileTrovati = 0;

categorie.forEach(cat => {
  const catPath = path.join(DIRECTORY_ESAMI, cat);
  const filesInfo = fs.readdirSync(catPath)
    .filter(file => file.endsWith('.html'))
    .map(file => {
      const filePath = path.join(catPath, file);
      const stats = fs.statSync(filePath);
      return { file, time: stats.birthtimeMs || stats.mtimeMs };
    });
  
  if (filesInfo.length > 0) {
    // Ordina per data di creazione (il più vecchio è prima), poi alfabeticamente a parità di tempo
    filesInfo.sort((a, b) => a.time - b.time || a.file.localeCompare(b.file));
    mappaEsami[cat] = filesInfo.map(info => info.file);
    fileTrovati += filesInfo.length;
  }
});

console.log(`✅ Trovate ${Object.keys(mappaEsami).length} cartelle con un totale di ${fileTrovati} esami.`);

// Generazione dell'HTML per i contenuti e per la navigazione rapida
let mainContentHtml = '';
let quickNavHtml = '';

if (Object.keys(mappaEsami).length === 0) {
  mainContentHtml = '<div class="empty-state">Nessun esame trovato nella cartella "esami".</div>';
} else {
  for (const cat of Object.keys(mappaEsami)) {
    let nomeCategoria = cat;
    if (/^\d+$/.test(cat)) {
      nomeCategoria = "Esami da " + cat + " domande";
    }

    let cardsHtml = '';
    let counter = 1;
    for (const file of mappaEsami[cat]) {
      let nomeEsame = `Simulazione #${counter++}`;
      
      cardsHtml += `
        <div class="card-wrapper" data-id="${cat}/${file}" data-title="${nomeEsame.toLowerCase()}" data-cat="${cat}">
          <a href="esami/${cat}/${file}" class="card-link">
            <div class="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            </div>
            <div class="card-content">
              <span class="card-title" title="${file}">${nomeEsame}</span>
            </div>
          </a>
          <button class="check-btn" title="Segna come fatto">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </div>
      `;
    }

    quickNavHtml += `<button onclick="document.getElementById('section-${cat}').scrollIntoView({behavior: 'smooth'})" class="nav-btn">${cat}</button>`;

    mainContentHtml += `
      <section class="category-section" id="section-${cat}" data-cat="${cat}">
        <h2 class="category-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13h4.5a2 2 0 0 1 1.9 1.3"/><path d="M9 13H4.5a2 2 0 0 0-1.9 1.3"/><path d="M15 17h.01"/><path d="M9 17h.01"/></svg>
          ${nomeCategoria}
        </h2>
        <div class="grid">
          ${cardsHtml}
        </div>
      </section>
    `;
  }
}

// 3. Genera l'HTML finale
const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portale Esami SFP</title>
  
  <meta name="robots" content="noindex, nofollow, noarchive">
  
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", roboto, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 1024px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .icon-logo {
      width: 64px;
      height: 64px;
      color: #4f46e5;
      background-color: #eef2ff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .icon-logo svg { width: 32px; height: 32px; }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: #0f172a;
    }
    /* QUICK NAV */
    .quick-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .quick-nav-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #64748b;
      margin-right: 0.25rem;
    }
    .nav-btn {
      background: white;
      border: 2px solid #e2e8f0;
      color: #475569;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-btn:hover {
      border-color: #818cf8;
      color: #4f46e5;
      background: #eef2ff;
    }

    /* SEARCH BAR */
    .search-container {
      position: sticky;
      top: 1rem;
      z-index: 10;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 1rem;
      padding: 0.75rem 1.25rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 2px solid #e2e8f0;
      transition: border-color 0.2s;
    }
    .search-container:focus-within { border-color: #4f46e5; }
    .search-container svg { color: #64748b; margin-right: 0.75rem; }
    .search-container input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1.1rem;
      color: #334155;
      background: transparent;
      font-weight: 500;
    }
    .search-container input::placeholder { color: #94a3b8; }
    
    /* SECTIONS */
    .category-section {
      background: #ffffff;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border-top: 4px solid #4f46e5;
    }
    .category-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
    }
    .category-title svg { color: #4f46e5; width: 20px; height: 20px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.75rem;
    }
    
    /* CARDS */
    .card-wrapper {
      display: flex;
      align-items: stretch;
      background-color: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      overflow: hidden;
    }
    .card-wrapper:hover {
      border-color: #818cf8;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .card-link {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0.75rem;
      text-decoration: none;
      color: #334155;
      font-weight: 600;
      min-width: 0; /* allows text truncation */
    }
    .card-link:hover { background-color: #f8fafc; }
    
    .card-icon {
      flex-shrink: 0;
      background-color: #e0e7ff;
      color: #4f46e5;
      width: 32px;
      height: 32px;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
    }
    
    .card-content {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-title { font-size: 0.95rem; }
    
    .check-btn {
      width: 48px;
      border: none;
      background: transparent;
      border-left: 1px solid #e2e8f0;
      color: #cbd5e1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .check-btn:hover { background: #f1f5f9; color: #475569; }
    
    /* COMPLETED STATE */
    .card-wrapper.completed {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
      opacity: 0.7;
    }
    .card-wrapper.completed .card-icon {
      background-color: #cbd5e1;
      color: #64748b;
    }
    .card-wrapper.completed .card-title {
      text-decoration: line-through;
      color: #64748b;
    }
    .card-wrapper.completed .check-btn {
      background-color: #22c55e;
      color: white;
      border-left-color: #22c55e;
      opacity: 1;
    }
    .card-wrapper.completed:hover { opacity: 0.9; }
    
    .empty-state { text-align: center; padding: 3rem; background: white; border-radius: 1rem; color: #64748b; font-weight: 500; }
    
    @media (max-width: 640px) {
      .container { padding: 1rem; }
      .category-section { padding: 1rem; }
      .search-container { position: static; margin-bottom: 1.5rem; }
      h1 { font-size: 1.75rem; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="icon-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
      </div>
      <h1>Simulazioni SFP</h1>
    </header>

    ${quickNavHtml ? `
      <div class="quick-nav">
        <span class="quick-nav-label">Numero domande:</span>
        ${quickNavHtml}
      </div>
    ` : ''}

    <div class="search-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="searchInput" placeholder="Cerca rapidamente un esame...">
    </div>

    <main id="mainContent">
      ${mainContentHtml}
    </main>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // 1. GESTIONE LOCAL STORAGE (PROGRESSI)
      const STORAGE_KEY = 'sfp_esami_completati';
      let completedExams = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      
      const cards = document.querySelectorAll('.card-wrapper');
      
      cards.forEach(card => {
        const id = card.getAttribute('data-id');
        const btn = card.querySelector('.check-btn');
        
        // Inizializza lo stato se era stato salvato in precedenza
        if (completedExams.includes(id)) {
          card.classList.add('completed');
        }
        
        // Toggle completamento al click del bottone (non del link)
        btn.addEventListener('click', (e) => {
          e.preventDefault(); // Evita scroll strani o comportamenti imprevisti
          const isNowCompleted = card.classList.toggle('completed');
          
          if (isNowCompleted) {
            if (!completedExams.includes(id)) completedExams.push(id);
          } else {
            completedExams = completedExams.filter(item => item !== id);
          }
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(completedExams));
        });
      });

      // 2. GESTIONE RICERCA (SEARCH BAR)
      const searchInput = document.getElementById('searchInput');
      const sections = document.querySelectorAll('.category-section');
      
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        sections.forEach(section => {
          let visibleCards = 0;
          const sectionCards = section.querySelectorAll('.card-wrapper');
          
          sectionCards.forEach(card => {
            const title = card.getAttribute('data-title');
            if (title.includes(term)) {
              card.style.display = 'flex';
              visibleCards++;
            } else {
              card.style.display = 'none';
            }
          });
          
          // Nascondi intera sezione se nessun esame trovato all'interno
          section.style.display = visibleCards > 0 ? 'block' : 'none';
        });
      });
    });
  </script>
</body>
</html>`;

// 4. Salva il file index.html
try {
  fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf-8');
  console.log('✅ File "index.html" generato con successo. Motori di ricerca bloccati (<meta noindex>). UI super-potenziata.');
} catch (err) {
  console.error('❌ ERRORE durante il salvataggio di index.html:', err);
}

// 5. Crea/Sovrascrivi robots.txt
const robotsContent = `User-agent: *
Disallow: /
`;

try {
  fs.writeFileSync(OUTPUT_ROBOTS, robotsContent, 'utf-8');
  console.log('✅ File "robots.txt" confermato.');
} catch (err) {
  console.error('❌ ERRORE durante il salvataggio di robots.txt:', err);
}

console.log('🎉 Finito! Ora puoi avviare index.html nel tuo browser per goderti la nuova UI.');
