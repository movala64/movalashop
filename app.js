/* =========================================================
   Lógica de la web: lee los productos desde el Google Sheet
   (publicado como CSV) y pinta el catálogo, filtros, modal
   y enlaces de WhatsApp.

   La hoja de Google Sheets debe tener estas columnas (en este
   orden, con estos nombres exactos en la primera fila):
   Nombre | Precio | Categoria | Descripcion | Foto | Disponible

   "Disponible" debe ser "Si" o "No". Las filas con "No" no se
   muestran en la web.
   ========================================================= */

(function applyColors(){
  const c = SHOP_CONFIG.colors;
  const root = document.documentElement.style;
  root.setProperty('--primary', c.primary);
  root.setProperty('--primary-dark', c.primaryDark);
  root.setProperty('--bg', c.background);
  root.setProperty('--text', c.text);
})();

document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('shopName').textContent = SHOP_CONFIG.shopName;
document.getElementById('shopNameFooter').textContent = SHOP_CONFIG.shopName;
document.title = SHOP_CONFIG.shopName;

function waLink(message){
  const msg = encodeURIComponent(message || SHOP_CONFIG.whatsappDefaultMessage);
  return `https://wa.me/${SHOP_CONFIG.whatsappNumber}?text=${msg}`;
}

['headerWhatsapp','heroWhatsapp','contactWhatsapp','floatingWhatsapp'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.href = waLink();
});

/* ---------- Menú móvil ---------- */
const navToggle = document.getElementById('navToggle');
const nav = document.querySelector('.nav');
navToggle.addEventListener('click', ()=> nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=> nav.classList.remove('open')));

/* ---------- Parseo de CSV (soporta comas dentro de comillas) ---------- */
function parseCSV(text){
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for(let i=0;i<text.length;i++){
    const c = text[i], next = text[i+1];
    if(inQuotes){
      if(c === '"' && next === '"'){ field += '"'; i++; }
      else if(c === '"'){ inQuotes = false; }
      else { field += c; }
    } else {
      if(c === '"'){ inQuotes = true; }
      else if(c === ','){ row.push(field); field=''; }
      else if(c === '\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else if(c === '\r'){ /* ignore */ }
      else { field += c; }
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  if(!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(v => v && v.trim() !== ''))
    .map(r => {
      const obj = {};
      headers.forEach((h,idx) => obj[h] = (r[idx] || '').trim());
      return obj;
    });
}

function formatPrice(raw){
  if(!raw) return '';
  const cleaned = raw.replace(',', '.').replace(/[^\d.]/g,'');
  const num = parseFloat(cleaned);
  if(isNaN(num)) return raw;
  return num.toLocaleString('es-ES', {minimumFractionDigits: num % 1 === 0 ? 0 : 2}) + ' €';
}

/* ---------- Carga de productos ---------- */
const grid = document.getElementById('productGrid');
const filtersBar = document.getElementById('filters');
const loadingMsg = document.getElementById('loadingMsg');
const errorMsg = document.getElementById('errorMsg');

let allProducts = [];
let activeCategory = 'todas';

function render(){
  grid.innerHTML = '';
  const items = activeCategory === 'todas'
    ? allProducts
    : allProducts.filter(p => p.Categoria === activeCategory);

  if(!items.length){
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">Aún no hay piezas en esta categoría.</p>';
    return;
  }

  items.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imgStyle = p.Foto ? `background-image:url('${p.Foto}');background-size:cover;background-position:center;` : '';
    card.innerHTML = `
      <div class="product-img" style="${imgStyle}"></div>
      <div class="product-info">
        <p class="product-cat">${p.Categoria || ''}</p>
        <h3 class="product-name">${p.Nombre || ''}</h3>
        <p class="product-price">${formatPrice(p.Precio)}</p>
        <div class="product-cta">Me interesa</div>
      </div>
    `;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

function buildFilters(){
  const cats = Array.from(new Set(allProducts.map(p => p.Categoria).filter(Boolean)));
  filtersBar.innerHTML = '<button class="filter-chip active" data-cat="todas">Todas</button>';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    filtersBar.appendChild(btn);
  });
  filtersBar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersBar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      render();
    });
  });
}

async function loadProducts(){
  try{
    const url = SHOP_CONFIG.productsCsvUrl;
    if(!url || url.includes('PON_AQUI')){
      throw new Error('CSV no configurado');
    }
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'cachebust=' + Date.now());
    if(!res.ok) throw new Error('No se pudo descargar el CSV');
    const text = await res.text();
    const data = parseCSV(text);
    allProducts = data.filter(p => (p.Disponible || 'si').toLowerCase().startsWith('s'));
    loadingMsg.hidden = true;
    if(!allProducts.length){
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">Todavía no hay piezas publicadas. ¡Vuelve pronto!</p>';
      return;
    }
    buildFilters();
    render();
  } catch(err){
    console.error(err);
    loadingMsg.hidden = true;
    errorMsg.hidden = false;
  }
}
loadProducts();

/* ---------- Modal de producto ---------- */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalImage = document.getElementById('modalImage');
const modalCat = document.getElementById('modalCat');
const modalName = document.getElementById('modalName');
const modalPrice = document.getElementById('modalPrice');
const modalDesc = document.getElementById('modalDesc');
const modalWhatsapp = document.getElementById('modalWhatsapp');

function openModal(p){
  modalImage.style.backgroundImage = p.Foto ? `url('${p.Foto}')` : '';
  modalImage.style.backgroundSize = 'cover';
  modalImage.style.backgroundPosition = 'center';
  modalCat.textContent = p.Categoria || '';
  modalName.textContent = p.Nombre || '';
  modalPrice.textContent = formatPrice(p.Precio);
  modalDesc.textContent = p.Descripcion || '';
  modalWhatsapp.href = waLink(`¡Hola! Me interesa "${p.Nombre}" (${formatPrice(p.Precio)}). ¿Está disponible?`);
  modalBackdrop.classList.add('open');
}
document.getElementById('modalClose').addEventListener('click', () => modalBackdrop.classList.remove('open'));
modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) modalBackdrop.classList.remove('open'); });
