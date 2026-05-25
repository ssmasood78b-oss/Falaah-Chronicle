// FALAAH PORTAL - main.js

const SUPABASE_URL      = window.FALAAH_CONFIG ? window.FALAAH_CONFIG.SUPABASE_URL      : 'https://hqhwphrckizfnkthdzfx.supabase.co';
const SUPABASE_ANON_KEY = window.FALAAH_CONFIG ? window.FALAAH_CONFIG.ANON_KEY : 'sb_publishable_A_uHsj9_CSvnNbMzaA74vA_qey-gTRu';

let supabaseClient;
let NGO_DATA = [];

let currentPage    = 'home';
let activeCategory = 'all';
let searchQuery    = '';
let activeProvince = 'All Provinces';

const CATEGORIES = [
  { name: 'All Categories',                        id: 'all'         },
  { name: 'Healthcare and Medical Services',        id: 'healthcare'  },
  { name: 'Education and Literacy',                 id: 'education'   },
  { name: 'Poverty Alleviation and Microfinance',   id: 'poverty'     },
  { name: 'Women Empowerment and Gender Equality',  id: 'women'       },
  { name: 'Human Rights and Legal Aid',             id: 'rights'      },
  { name: 'Disaster Relief and Humanitarian Aid',   id: 'disaster'    },
  { name: 'Environment and Climate Action',         id: 'environment' },
  { name: 'Child Welfare and Protection',           id: 'children'    },
  { name: 'Rural Development and Community Uplift', id: 'rural'       },
  { name: 'Disability and Special Needs',           id: 'disability'  },
];

const PROVINCES = [
  'All Provinces', 'Sindh', 'Punjab', 'KPK',
  'Balochistan', 'Islamabad (Federal)', 'Gilgit-Baltistan', 'AJK',
];

const CAT_ID_TO_NAME = {
  1:  'Healthcare and Medical Services',
  2:  'Education and Literacy',
  3:  'Poverty Alleviation and Microfinance',
  4:  'Women Empowerment and Gender Equality',
  5:  'Human Rights and Legal Aid',
  6:  'Disaster Relief and Humanitarian Aid',
  7:  'Environment and Climate Action',
  8:  'Child Welfare and Protection',
  9:  'Rural Development and Community Uplift',
  10: 'Disability and Special Needs',
};

function initSupabase() {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  loadNGOs();
}

async function loadNGOs() {
  var list = document.getElementById('ngoList');
  if (list) {
    list.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-muted)"><p>Loading organisations...</p></div>';
  }

  var result = await supabaseClient
    .from('ngos')
    .select('*, categories(name)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (result.error) {
    console.error('Database error:', result.error);
    showToast('Could not connect to the database. Please check your internet connection.');
    NGO_DATA = [];
  } else {
    NGO_DATA = (result.data || []).map(function(ngo) {
      return Object.assign({}, ngo, {
        category: (ngo.categories && ngo.categories.name) || CAT_ID_TO_NAME[ngo.category_id] || 'Uncategorised',
      });
    });
  }

  renderCategoryCards();
  renderSidebarCats();
  renderNGOList();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active'); });

  var target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  var navLink = document.querySelector('.nav-links a[data-page="' + pageId + '"]');
  if (navLink) navLink.classList.add('active');

  currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileMenu();

  if (pageId === 'directory') {
    renderCategoryCards();
    renderSidebarCats();
    renderNGOList();
  }
}

function toggleMobileMenu() {
  var menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.body.style.overflow = '';
}

function getInitials(name) {
  var words = name.split(' ').filter(function(w) { return w.length > 2; }).slice(0, 2);
  return words.length > 0
    ? words.map(function(w) { return w[0]; }).join('').toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function catById(id) {
  return CATEGORIES.find(function(c) { return c.id === id; });
}

function ngoCountForCat(catId) {
  if (catId === 'all') return NGO_DATA.length;
  var cat = catById(catId);
  return cat ? NGO_DATA.filter(function(n) { return n.category === cat.name; }).length : 0;
}

function renderSidebarCats() {
  var el = document.getElementById('sidebarCats');
  if (!el) return;

  el.innerHTML = CATEGORIES.map(function(cat) {
    var isActive = activeCategory === cat.id;
    return '<button class="sidebar-cat-btn' + (isActive ? ' active' : '') + '" onclick="selectCategory(\'' + cat.id + '\',\'' + cat.name + '\')">' +
      '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + cat.name + '</span>' +
      '<span class="badge">' + ngoCountForCat(cat.id) + '</span>' +
      '</button>';
  }).join('');
}

function renderCategoryCards() {
  var el = document.getElementById('categoriesGrid');
  if (!el) return;

  el.innerHTML = CATEGORIES.filter(function(c) { return c.id !== 'all'; }).map(function(cat) {
    var count    = ngoCountForCat(cat.id);
    var isActive = activeCategory === cat.id;
    return '<div class="cat-card' + (isActive ? ' active' : '') + '" onclick="selectCategory(\'' + cat.id + '\',\'' + cat.name + '\')">' +
      '<div class="cat-name">' + cat.name + '</div>' +
      '<div class="cat-count">' + count + ' NGO' + (count !== 1 ? 's' : '') + '</div>' +
      '</div>';
  }).join('');
}

function selectCategory(catId, catName) {
  activeCategory = catId;
  renderSidebarCats();
  renderCategoryCards();
  renderNGOList();
  var h = document.getElementById('ngoSectionTitle');
  if (h) h.textContent = catId === 'all' ? 'All NGOs' : catName;
  showPage('directory');
}

function toggleNGO(id) {
  var card   = document.getElementById('ngo-' + id);
  var isOpen = card.classList.contains('open');
  document.querySelectorAll('.ngo-card.open').forEach(function(c) { c.classList.remove('open'); });
  if (!isOpen) card.classList.add('open');
}

function renderNGOCard(ngo) {
  var id       = ngo.id;
  var name     = ngo.name          || '';
  var category = ngo.category      || '';
  var location = ngo.location_hq   || '';
  var focal    = ngo.focal_person   || 'To be updated';
  var contact  = ngo.contact_info   || 'To be updated';
  var founded  = ngo.founded        ? String(ngo.founded) : 'Not recorded';
  var desc     = ngo.description    || '';
  var website  = ngo.website        || '';
  var logo     = ngo.logo_url       || null;

  var websiteLink = website
    ? '<a href="' + website + '" target="_blank" rel="noopener">' + website.replace(/https?:\/\//, '') + '</a>'
    : '<span style="color:var(--text-light)">Not available</span>';

  var logoHtml = logo
    ? '<img src="' + logo + '" alt="' + name + ' logo">'
    : '<span class="ngo-logo-placeholder">' + getInitials(name) + '</span>';

  var visitBtn = website
    ? '<a href="' + website + '" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:0.82rem;padding:9px 18px">Visit Website</a>'
    : '';

  return '<div class="ngo-card" id="ngo-' + id + '">' +
    '<div class="ngo-card-header" onclick="toggleNGO(\'' + id + '\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')toggleNGO(\'' + id + '\')">' +
    '<div class="ngo-logo">' + logoHtml + '</div>' +
    '<div class="ngo-card-meta">' +
    '<div class="ngo-name">' + name + '</div>' +
    '<div class="ngo-tags">' +
    '<span class="ngo-tag">' + category + '</span>' +
    (location ? '<span class="ngo-loc-tag">' + location + '</span>' : '') +
    '</div>' +
    '</div>' +
    '<div class="ngo-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>' +
    '</div>' +
    '<div class="ngo-card-body">' +
    '<p class="ngo-desc">' + desc + '</p>' +
    '<div class="ngo-info-grid">' +
    '<div><div class="info-label">Focal Person</div><div class="info-value">' + focal + '</div></div>' +
    '<div><div class="info-label">Contact</div><div class="info-value">' + contact + '</div></div>' +
    '<div><div class="info-label">Founded</div><div class="info-value">' + founded + '</div></div>' +
    '<div><div class="info-label">Website</div><div class="info-value">' + websiteLink + '</div></div>' +
    '</div>' +
    '<div class="ngo-card-footer">' + visitBtn +
    '<button class="btn btn-ghost" style="font-size:0.82rem;padding:9px 18px" onclick="toggleNGO(\'' + id + '\')">Close</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function renderNGOList() {
  var container = document.getElementById('ngoList');
  var countEl   = document.getElementById('ngoCount');
  if (!container) return;

  var filtered = NGO_DATA.slice();

  if (activeCategory !== 'all') {
    var cat = catById(activeCategory);
    if (cat) {
      filtered = filtered.filter(function(n) { return n.category === cat.name; });
    }
  }

  if (activeProvince !== 'All Provinces') {
    filtered = filtered.filter(function(n) {
      return (n.location_hq || '').toLowerCase().indexOf(activeProvince.toLowerCase()) !== -1;
    });
  }

  if (searchQuery.trim()) {
    var q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(function(n) {
      return (n.name         || '').toLowerCase().indexOf(q) !== -1 ||
             (n.description  || '').toLowerCase().indexOf(q) !== -1 ||
             (n.category     || '').toLowerCase().indexOf(q) !== -1 ||
             (n.location_hq  || '').toLowerCase().indexOf(q) !== -1 ||
             (n.focal_person || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  if (countEl) {
    countEl.textContent = filtered.length + ' result' + (filtered.length !== 1 ? 's' : '');
  }

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="no-results">' +
      '<p>No NGOs match your current search or filter.</p>' +
      '<p style="margin-top:8px">Try different keywords or clear the filters.</p>' +
      '<button class="btn btn-outline" style="margin-top:18px" onclick="clearFilters()">Clear all filters</button>' +
      '</div>';
  } else {
    container.innerHTML = filtered.map(renderNGOCard).join('');
  }
}

function clearFilters() {
  searchQuery    = '';
  activeCategory = 'all';
  activeProvince = 'All Provinces';
  var s = document.getElementById('mainSearch');
  var p = document.getElementById('provinceFilter');
  if (s) s.value = '';
  if (p) p.value = 'All Provinces';
  renderSidebarCats();
  renderCategoryCards();
  renderNGOList();
  var h = document.getElementById('ngoSectionTitle');
  if (h) h.textContent = 'All NGOs';
}

function initSearchBar() {
  var si = document.getElementById('mainSearch');
  var pf = document.getElementById('provinceFilter');

  if (si) {
    var t;
    si.addEventListener('input', function(e) {
      clearTimeout(t);
      t = setTimeout(function() { searchQuery = e.target.value; renderNGOList(); }, 260);
    });
  }

  if (pf) {
    pf.addEventListener('change', function(e) { activeProvince = e.target.value; renderNGOList(); });
  }
}

function populateFilters() {
  var pf = document.getElementById('provinceFilter');
  if (pf) {
    pf.innerHTML = PROVINCES.map(function(p) {
      return '<option value="' + p + '">' + p + '</option>';
    }).join('');
  }

  var sc = document.getElementById('submitCategory');
  if (sc) {
    sc.innerHTML = '<option value="">Select a Category</option>' +
      CATEGORIES.filter(function(c) { return c.id !== 'all'; }).map(function(c) {
        return '<option value="' + c.name + '">' + c.name + '</option>';
      }).join('');
  }
}

async function handleSubmitForm(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Submitting...';
  btn.disabled    = true;

  var catName  = document.getElementById('submitCategory') ? document.getElementById('submitCategory').value : '';
  var catEntry = Object.entries(CAT_ID_TO_NAME).find(function(entry) { return entry[1] === catName; });

  var payload = {
    name:               document.getElementById('ngoName')        ? document.getElementById('ngoName').value.trim()        : null,
    category_id:        catEntry ? parseInt(catEntry[0]) : null,
    description:        document.getElementById('ngoDesc')        ? document.getElementById('ngoDesc').value.trim()        : null,
    focal_person:       document.getElementById('focalPerson')    ? document.getElementById('focalPerson').value.trim()    : null,
    contact_info:       document.getElementById('contactNumber')  ? document.getElementById('contactNumber').value.trim()  : null,
    website:            document.getElementById('ngoWebsite')     ? document.getElementById('ngoWebsite').value.trim()     : null,
    location_hq:        document.getElementById('ngoLocation')    ? document.getElementById('ngoLocation').value.trim()    : null,
    submitted_by_email: document.getElementById('submitterEmail') ? document.getElementById('submitterEmail').value.trim() : null,
    is_active: false,
    verified:  false,
  };

  var result = await supabaseClient.from('ngos').insert([payload]);

  if (result.error) {
    console.error(result.error);
    showToast('Submission failed. Please try again or email us at info@sqwf.org.');
  } else {
    showToast('Your submission has been received. Our team will review it shortly.');
    e.target.reset();
  }

  btn.textContent = 'Submit for Review';
  btn.disabled    = false;
}

function handleContactForm(e) {
  e.preventDefault();
  showToast('Message sent. We will get back to you soon.');
  e.target.reset();
}

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent    = msg;
  t.style.display  = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(function() { t.style.display = 'none'; }, 4500);
}

function toggleLang() {
  showToast('Urdu mode is coming soon.');
}

function initLogoUpload() {
  var area  = document.querySelector('.upload-area');
  var input = document.getElementById('logoUpload');
  if (!area || !input) return;

  area.addEventListener('click', function() { input.click(); });

  area.addEventListener('dragover', function(e) {
    e.preventDefault();
    area.style.borderColor = 'var(--navy)';
  });

  area.addEventListener('dragleave', function() {
    area.style.borderColor = '';
  });

  area.addEventListener('drop', function(e) {
    e.preventDefault();
    area.style.borderColor = '';
    var f = e.dataTransfer.files[0];
    if (f) area.querySelector('p').textContent = f.name + ' is ready to upload';
  });

  input.addEventListener('change', function(e) {
    if (e.target.files[0]) {
      area.querySelector('p').textContent = e.target.files[0].name + ' is ready to upload';
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  populateFilters();
  initSearchBar();
  initLogoUpload();

  var submitForm = document.getElementById('submitNGOForm');
  if (submitForm) submitForm.addEventListener('submit', handleSubmitForm);

  var contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContactForm);

  showPage('home');

  var script     = document.createElement('script');
  script.src     = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload  = initSupabase;
  script.onerror = function() {
    showToast('Failed to load the database library. Please check your internet connection and reload the page.');
  };
  document.head.appendChild(script);
});

async function handleContactForm(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  var payload = {
    name:    document.getElementById('cName')    ? document.getElementById('cName').value.trim()    : null,
    email:   document.getElementById('cEmail')   ? document.getElementById('cEmail').value.trim()   : null,
    subject: document.getElementById('cSubject') ? document.getElementById('cSubject').value        : null,
    message: document.getElementById('cMsg')     ? document.getElementById('cMsg').value.trim()     : null,
  };

  var result = await supabaseClient.from('contact_messages').insert([payload]);

  if (result.error) {
    console.error(result.error);
    showToast('Message could not be sent. Please email us directly at info@sqwf.org.');
  } else {
    showToast('Message sent. We will get back to you soon.');
    e.target.reset();
  }

  btn.textContent = 'Send Message';
  btn.disabled = false;
}
