// CareerTrack keeps company research and application progress in one place.
// The app is intentionally small: plain functions, one data array, and localStorage.

const STORAGE_KEY = 'careertrack-premium-opportunities-v1';
const STATUSES = ['Interested', 'Applied', 'Interview', 'Offer', 'Rejected'];
const STATUS_COLORS = {
  Interested: '#7159e8',
  Applied: '#d69a30',
  Interview: '#2e9d8c',
  Offer: '#a4c844',
  Rejected: '#d95d76'
};
const LOGO_BACKGROUNDS = [
  'linear-gradient(140deg, #242329, #51485b)',
  'linear-gradient(140deg, #7159e8, #a89bf3)',
  'linear-gradient(140deg, #2e9d8c, #8bcbbc)',
  'linear-gradient(140deg, #e28450, #f5b578)',
  'linear-gradient(140deg, #a4c844, #d6f17a)',
  'linear-gradient(140deg, #d95d76, #f4a0ad)'
];

// These are fictional examples; replace them with your own opportunities.
const DEMO_OPPORTUNITIES = [
  {
    id: 'demo-101', company: 'Northstar Systems', role: 'Junior Web Developer',
    industry: 'Software Development', location: 'Hyderabad', status: 'Applied',
    applicationDate: '2026-09-21', followUpDate: '2026-10-15', website: 'https://example.com',
    notes: 'Sample note: review the role requirements and prepare a short portfolio walkthrough.', updatedAt: 6
  },
  {
    id: 'demo-102', company: 'Orbit Mobility', role: 'IT Support Trainee',
    industry: 'Automotive', location: 'Hyderabad', status: 'Interested',
    applicationDate: '', followUpDate: '2026-10-20', website: 'https://example.com',
    notes: 'Sample note: compare the trainee requirements and application dates.', updatedAt: 5
  },
  {
    id: 'demo-103', company: 'PixelForge Labs', role: 'Frontend Developer Intern',
    industry: 'Software Development', location: 'Remote', status: 'Interview',
    applicationDate: '2026-09-12', followUpDate: '2026-10-12', website: 'https://example.com',
    notes: 'Sample note: practise explaining HTML, CSS, JavaScript, and one finished project.', updatedAt: 4
  },
  {
    id: 'demo-104', company: 'BluePeak Security', role: 'Security Operations Trainee',
    industry: 'Cybersecurity', location: 'Bengaluru', status: 'Applied',
    applicationDate: '2026-09-28', followUpDate: '2026-10-18', website: 'https://example.com',
    notes: 'Sample note: revise networking basics and the login-log analyzer.', updatedAt: 3
  },
  {
    id: 'demo-105', company: 'Evergreen Works', role: 'Maintenance Systems Assistant',
    industry: 'Manufacturing', location: 'Pune', status: 'Offer',
    applicationDate: '2026-08-05', followUpDate: '', website: 'https://example.com',
    notes: 'Sample record only — this is not a real job offer.', updatedAt: 2
  },
  {
    id: 'demo-106', company: 'BrightCircuit R&D', role: 'Technical Support Associate',
    industry: 'Research & Development', location: 'Chennai', status: 'Rejected',
    applicationDate: '2026-08-29', followUpDate: '', website: 'https://example.com',
    notes: 'Sample record showing how the rejected status appears.', updatedAt: 1
  },
  {
    id: 'demo-107', company: 'Maple Cloud Studio', role: 'QA Engineer Intern',
    industry: 'Software Development', location: 'Visakhapatnam', status: 'Interested',
    applicationDate: '', followUpDate: '2026-10-10', website: 'https://example.com',
    notes: 'Sample note: check the company engineering blog and testing requirements.', updatedAt: 7
  }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
let opportunities = loadOpportunities();
let editingId = null;
let activeView = 'overview';
let applicationsLayout = 'board';
let toastTimer = null;
let storageWorks = true;

function copyDemoData() {
  return DEMO_OPPORTUNITIES.map((item) => ({ ...item }));
}

function loadOpportunities() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    storageWorks = false;
    console.warn('Saved opportunities could not be read; sample data is being shown.', error);
  }

  const examples = copyDemoData();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
  } catch (error) {
    storageWorks = false;
    console.warn('This browser could not save sample data.', error);
  }
  return examples;
}

function saveOpportunities(message = 'Changes saved in this browser.') {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
    storageWorks = true;
    setSaveStatus(true);
    renderAll();
    if (message) showToast(message);
  } catch (error) {
    storageWorks = false;
    setSaveStatus(false);
    renderAll();
    showToast('The change is visible, but this browser could not save it.');
    console.warn('Unable to save opportunities to localStorage.', error);
  }
}

function setSaveStatus(isSaved) {
  const status = $('#saveStatus');
  if (!status) return;
  status.classList.toggle('is-warning', !isSaved);
  $('#saveStatusText').textContent = isSaved ? 'Saved locally' : 'Not saved';
  status.title = isSaved ? 'Changes are stored in this browser.' : 'Browser storage is unavailable. Export a CSV backup.';
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function safeWebsite(value) {
  const website = String(value || '').trim();
  if (!website) return '';
  try {
    const normalized = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    const url = new URL(normalized);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch (error) {
    return '';
  }
}

function companyInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

function logoBackground(company) {
  const total = Array.from(String(company || '')).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return LOGO_BACKGROUNDS[total % LOGO_BACKGROUNDS.length];
}

function statusClass(status) {
  return `status-${String(status || '').toLowerCase()}`;
}

function statusBadge(status) {
  return `<span class="status-badge ${statusClass(status)}">${escapeHTML(status || 'Interested')}</span>`;
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shortDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateGap(dateValue) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date(`${todayString()}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function dueLabel(dateValue) {
  const gap = dateGap(dateValue);
  if (gap === null) return { label: 'Date not set', className: '' };
  if (gap < 0) return { label: `${Math.abs(gap)}d overdue`, className: 'overdue' };
  if (gap === 0) return { label: 'Due today', className: 'today' };
  if (gap === 1) return { label: 'Tomorrow', className: '' };
  return { label: `In ${gap} days`, className: '' };
}

function isTerminalStatus(status) {
  return status === 'Offer' || status === 'Rejected';
}

function countStatus(status) {
  return opportunities.filter((item) => item.status === status).length;
}

function getStatusCounts() {
  return STATUSES.map((status) => ({ status, count: countStatus(status), color: STATUS_COLORS[status] }));
}

function sortRecentlyUpdated(items) {
  return items.slice().sort((first, second) => Number(second.updatedAt || 0) - Number(first.updatedAt || 0));
}

function getFilteredOpportunities(searchValue = '', statusValue = 'all', industryValue = 'all') {
  const query = String(searchValue || '').trim().toLowerCase();
  return opportunities.filter((item) => {
    const searchable = [item.company, item.role, item.industry, item.location, item.notes].join(' ').toLowerCase();
    return (!query || searchable.includes(query))
      && (statusValue === 'all' || item.status === statusValue)
      && (industryValue === 'all' || item.industry === industryValue);
  });
}

function companyCell(item) {
  return `<div class="company-cell">
    <span class="company-badge" style="background:${logoBackground(item.company)}">${escapeHTML(companyInitials(item.company))}</span>
    <span class="company-copy"><strong>${escapeHTML(item.company)}</strong><small>${escapeHTML(item.role)}</small></span>
  </div>`;
}

function actionButtons(item) {
  return `<div class="row-actions">
    <button type="button" class="row-action" data-action="edit" data-id="${escapeHTML(item.id)}" aria-label="Edit ${escapeHTML(item.company)}" title="Edit opportunity"><svg class="icon"><use href="#icon-edit"/></svg></button>
    <button type="button" class="row-action delete" data-action="delete" data-id="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.company)}" title="Delete opportunity"><svg class="icon"><use href="#icon-trash"/></svg></button>
  </div>`;
}

function statusOptions(currentStatus) {
  return STATUSES.map((status) => `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`).join('');
}

function statusSelect(item, extraClass = '') {
  return `<label class="select-wrap ${extraClass}"><span class="sr-only">Change status for ${escapeHTML(item.company)}</span><select class="table-select" data-action="status" data-id="${escapeHTML(item.id)}">${statusOptions(item.status)}</select></label>`;
}

function renderStats() {
  const values = {
    totalStat: opportunities.length,
    appliedStat: countStatus('Applied'),
    interviewStat: countStatus('Interview'),
    offersStat: countStatus('Offer'),
    navApplicationCount: opportunities.length,
    donutTotal: opportunities.length
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (!element) return;
    if (element.textContent !== String(value)) {
      element.textContent = String(value);
      if (element.classList.contains('stat-number')) {
        element.classList.remove('bump');
        void element.offsetWidth;
        element.classList.add('bump');
      }
    }
  });
  $('#pipelineSummary').textContent = `${opportunities.length} tracked ${opportunities.length === 1 ? 'opportunity' : 'opportunities'}`;
}

function renderPipelineChart() {
  const counts = getStatusCounts();
  const largest = Math.max(1, ...counts.map((item) => item.count));
  $('#pipelineChart').innerHTML = counts.map((item, index) => {
    const height = item.count === 0 ? 4 : Math.max(8, (item.count / largest) * 100);
    return `<div class="pipeline-stage" title="${escapeHTML(item.status)}: ${item.count}">
      <strong class="pipeline-stage-count">${item.count}</strong>
      <div class="pipeline-stage-track"><div class="pipeline-stage-fill" style="height:${height}%;background:${item.color};animation-delay:${index * 55}ms"></div></div>
      <span class="pipeline-stage-label">${escapeHTML(item.status)}</span>
    </div>`;
  }).join('');
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function getMonthlyApplicationCounts() {
  const today = new Date();
  const months = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const count = opportunities.filter((item) => {
      if (!item.applicationDate) return false;
      const applied = new Date(`${item.applicationDate}T12:00:00`);
      return !Number.isNaN(applied.getTime()) && applied.getFullYear() === year && applied.getMonth() === month;
    }).length;
    months.push({ label: monthLabel(date), count, year, month });
  }
  return months;
}

function renderActivityChart() {
  const months = getMonthlyApplicationCounts();
  const width = 560;
  const height = 165;
  const padding = { top: 16, right: 15, bottom: 26, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(3, ...months.map((item) => item.count));
  const points = months.map((item, index) => ({
    x: padding.left + (months.length === 1 ? chartWidth / 2 : index * chartWidth / (months.length - 1)),
    y: padding.top + chartHeight - (item.count / maxValue) * chartHeight,
    ...item
  }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const baseline = padding.top + chartHeight;
  const area = `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  const gridLines = [0, 0.5, 1].map((fraction) => {
    const y = padding.top + chartHeight * fraction;
    return `<line class="chart-gridline" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
  }).join('');
  const xLabels = points.map((point) => `<text x="${point.x}" y="${height - 6}" text-anchor="middle">${escapeHTML(point.label)}</text>`).join('');
  const circles = points.map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"><title>${escapeHTML(point.label)}: ${point.count} application${point.count === 1 ? '' : 's'}</title></circle>`).join('');
  const total = months.reduce((sum, item) => sum + item.count, 0);
  $('#activityChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${total} applications across the last six months">
    <defs><linearGradient id="careerAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7159e8" stop-opacity=".22"/><stop offset="100%" stop-color="#7159e8" stop-opacity="0"/></linearGradient></defs>
    ${gridLines}<path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>${circles}${xLabels}
  </svg>`;
  $('#activityTotal').textContent = `${total} application${total === 1 ? '' : 's'} dated`;
}

function renderStatusDonut() {
  const counts = getStatusCounts();
  const total = opportunities.length;
  let angle = 0;
  const segments = counts.map((item) => {
    const start = angle;
    angle += total ? item.count / total * 360 : 0;
    return `${item.color} ${start}deg ${angle}deg`;
  });
  $('#statusDonut').style.background = total ? `conic-gradient(${segments.join(', ')})` : '#eee7dc';
  $('#statusDonut').setAttribute('aria-label', total ? `Application status distribution across ${total} opportunities` : 'No opportunities tracked');
  $('#statusLegend').innerHTML = counts.map((item) => `<div class="legend-row"><i style="background:${item.color}"></i><span>${escapeHTML(item.status)}</span><strong>${item.count}</strong></div>`).join('');
}

function renderFollowUps() {
  const items = opportunities
    .filter((item) => item.followUpDate && !isTerminalStatus(item.status))
    .sort((first, second) => first.followUpDate.localeCompare(second.followUpDate))
    .slice(0, 4);
  const list = $('#followupList');
  $('#followupEmpty').classList.toggle('hidden', items.length > 0);
  list.classList.toggle('hidden', items.length === 0);
  list.innerHTML = items.map((item) => {
    const due = dueLabel(item.followUpDate);
    const date = new Date(`${item.followUpDate}T12:00:00`);
    const day = Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit' });
    const month = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { month: 'short' });
    return `<article class="followup-item">
      <span class="followup-date-box"><b>${day}</b><small>${month}</small></span>
      <span class="followup-copy"><strong>${escapeHTML(item.company)}</strong><small>${escapeHTML(item.role)} · ${escapeHTML(item.status)}</small></span>
      <span class="followup-when ${due.className}">${escapeHTML(due.label)}</span>
      <button type="button" class="followup-edit" data-action="edit" data-id="${escapeHTML(item.id)}" aria-label="Edit ${escapeHTML(item.company)} follow-up"><svg class="icon"><use href="#icon-edit"/></svg></button>
    </article>`;
  }).join('');
}

function renderOverviewRows() {
  const search = $('#overviewSearch').value;
  const status = $('#overviewStatusFilter').value;
  const items = sortRecentlyUpdated(getFilteredOpportunities(search, status)).slice(0, 5);
  $('#overviewRows').innerHTML = items.map((item) => `<tr>
    <td>${companyCell(item)}</td>
    <td><span class="industry-chip">${escapeHTML(item.industry || 'Other')}</span></td>
    <td>${statusBadge(item.status)}</td>
    <td class="date-cell">${item.followUpDate ? formatDate(item.followUpDate) : '<span class="muted-dash">Not set</span>'}</td>
    <td class="align-right">${actionButtons(item)}</td>
  </tr>`).join('');
  $('#overviewEmpty').classList.toggle('hidden', items.length > 0);
}

function renderIndustryOptions() {
  const industries = [...new Set(opportunities.map((item) => String(item.industry || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  [['applicationsIndustryFilter', 'All industries'], ['companiesIndustryFilter', 'All industries']].forEach(([id, label]) => {
    const select = document.getElementById(id);
    const previous = select.value || 'all';
    select.innerHTML = `<option value="all">${label}</option>${industries.map((industry) => `<option value="${escapeHTML(industry)}">${escapeHTML(industry)}</option>`).join('')}`;
    select.value = industries.includes(previous) ? previous : 'all';
  });
}

function getApplicationViewItems() {
  return sortRecentlyUpdated(getFilteredOpportunities(
    $('#applicationsSearch').value,
    $('#applicationsStatusFilter').value,
    $('#applicationsIndustryFilter').value
  ));
}

function syncApplicationEmptyState(visibleCount) {
  const isEmpty = visibleCount === 0;
  const emptyState = $('#applicationsEmpty');
  emptyState.classList.toggle('hidden', !isEmpty);
  $('#boardScroller').classList.toggle('hidden', applicationsLayout !== 'board' || isEmpty);
  $('#listLayout').classList.toggle('hidden', applicationsLayout !== 'list' || isEmpty);

  const title = $('#applicationsEmpty strong');
  const description = $('#applicationsEmpty p');
  if (opportunities.length === 0) {
    title.textContent = 'Your workspace is ready for a new opportunity';
    description.textContent = 'Add a role to start building your pipeline.';
  } else {
    title.textContent = 'No opportunities match these filters';
    description.textContent = 'Try another search or filter, or add a new opportunity.';
  }
}

function renderApplicationsList() {
  const items = getApplicationViewItems();
  $('#applicationsRows').innerHTML = items.map((item) => `<tr>
    <td>${companyCell(item)}</td>
    <td><span class="industry-chip">${escapeHTML(item.industry || 'Other')}</span><div class="company-copy"><small>${escapeHTML(item.location || 'Location not set')}</small></div></td>
    <td>${statusSelect(item)}</td>
    <td class="date-cell">${formatDate(item.applicationDate)}</td>
    <td class="date-cell">${formatDate(item.followUpDate)}</td>
    <td class="align-right">${actionButtons(item)}</td>
  </tr>`).join('');
  $('#applicationCountLabel').textContent = `Showing ${items.length} of ${opportunities.length} ${opportunities.length === 1 ? 'opportunity' : 'opportunities'}`;
  syncApplicationEmptyState(items.length);
}

function renderKanbanBoard() {
  const items = getApplicationViewItems();
  $('#kanbanBoard').innerHTML = STATUSES.map((status, index) => {
    const stageItems = sortRecentlyUpdated(items.filter((item) => item.status === status));
    const cards = stageItems.length ? stageItems.map((item, cardIndex) => `<article class="kanban-card" style="animation-delay:${Math.min(cardIndex * 35, 175)}ms">
      <div class="kanban-card-top"><span class="company-badge" style="background:${logoBackground(item.company)}">${escapeHTML(companyInitials(item.company))}</span><span class="company-roles-count">${escapeHTML(item.industry || 'Other')}</span></div>
      <h3 class="kanban-role">${escapeHTML(item.role)}</h3><p class="kanban-company">${escapeHTML(item.company)}</p>
      <div class="kanban-meta"><span>${escapeHTML(item.location || 'Location not set')}</span><span>${item.followUpDate ? `<svg class="icon"><use href="#icon-calendar"/></svg> ${escapeHTML(shortDate(item.followUpDate))}` : 'No follow-up'}</span></div>
      <div class="kanban-card-controls">${statusSelect(item)}${actionButtons(item)}</div>
    </article>`).join('') : '<div class="kanban-empty">Nothing here yet.<br>Move an opportunity into this stage.</div>';
    return `<section class="kanban-column"><div class="kanban-column-head"><span class="kanban-column-title"><i class="column-dot" style="background:${STATUS_COLORS[status]}"></i>${escapeHTML(status)}</span><span class="column-count">${stageItems.length}</span></div><div class="kanban-cards">${cards}</div></section>`;
  }).join('');
  $('#applicationCountLabel').textContent = `Showing ${items.length} of ${opportunities.length} ${opportunities.length === 1 ? 'opportunity' : 'opportunities'}`;
  syncApplicationEmptyState(items.length);
}

function groupByCompany(items) {
  const grouped = new Map();
  items.forEach((item) => {
    const key = String(item.company || '').trim().toLowerCase();
    if (!grouped.has(key)) grouped.set(key, { company: item.company, items: [] });
    grouped.get(key).items.push(item);
  });
  return Array.from(grouped.values()).sort((a, b) => a.company.localeCompare(b.company));
}

function renderCompanies() {
  const query = $('#companiesSearch').value.trim().toLowerCase();
  const industry = $('#companiesIndustryFilter').value;
  const groups = groupByCompany(opportunities).filter((group) => {
    const matchesText = !query || group.company.toLowerCase().includes(query) || group.items.some((item) => [item.industry, item.role, item.location, item.notes].join(' ').toLowerCase().includes(query));
    const matchesIndustry = industry === 'all' || group.items.some((item) => item.industry === industry);
    return matchesText && matchesIndustry;
  });
  $('#uniqueCompanyCount').textContent = `${new Set(opportunities.map((item) => item.company.trim().toLowerCase())).size} ${new Set(opportunities.map((item) => item.company.trim().toLowerCase())).size === 1 ? 'company' : 'companies'}`;
  $('#companyGrid').innerHTML = groups.map((group, index) => {
    const latest = sortRecentlyUpdated(group.items)[0];
    const website = safeWebsite(latest.website);
    const statuses = [...new Set(group.items.map((item) => item.status))];
    const statusMarkup = statuses.length === 1 ? statusBadge(statuses[0]) : `<span class="industry-chip">${statuses.length} status types</span>`;
    return `<article class="company-card" style="animation-delay:${Math.min(index * 35, 210)}ms">
      <div class="company-card-top"><span class="company-badge" style="background:${logoBackground(group.company)}">${escapeHTML(companyInitials(group.company))}</span><div class="company-card-heading"><h3>${escapeHTML(group.company)}</h3><p>${escapeHTML(latest.industry || 'Industry not set')}</p></div><span class="company-roles-count">${group.items.length} ${group.items.length === 1 ? 'role' : 'roles'}</span></div>
      <div class="company-card-details"><span><svg class="icon"><use href="#icon-building"/></svg>${escapeHTML(latest.location || 'Location not set')}</span><span><svg class="icon"><use href="#icon-list"/></svg>${statuses.length} ${statuses.length === 1 ? 'stage' : 'stages'}</span></div>
      <p class="company-card-notes">${escapeHTML(latest.notes || 'No research notes yet. Add an opportunity note to keep useful details here.')}</p>
      <div class="company-card-foot">${statusMarkup}<button type="button" class="link-button" data-action="company-view" data-company="${escapeHTML(group.company)}">View roles <svg class="icon"><use href="#icon-arrow"/></svg></button></div>
      ${website ? `<div class="company-card-site"><a class="company-web-link" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">Visit website <svg class="icon"><use href="#icon-external"/></svg></a></div>` : ''}
    </article>`;
  }).join('');
  $('#companiesEmpty').classList.toggle('hidden', groups.length > 0);
}

function renderAll() {
  renderStats();
  renderPipelineChart();
  renderActivityChart();
  renderStatusDonut();
  renderFollowUps();
  renderOverviewRows();
  renderIndustryOptions();
  renderKanbanBoard();
  renderApplicationsList();
  renderCompanies();
}

function switchView(viewName) {
  if (!['overview', 'applications', 'companies'].includes(viewName)) return;
  activeView = viewName;
  $$('.view').forEach((view) => view.classList.toggle('is-active', view.id === `${viewName}View`));
  $$('.nav-link').forEach((button) => button.classList.toggle('is-active', button.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function setApplicationsLayout(layout) {
  applicationsLayout = layout === 'list' ? 'list' : 'board';
  $$('[data-layout]').forEach((button) => button.classList.toggle('is-selected', button.dataset.layout === applicationsLayout));
  renderKanbanBoard();
  renderApplicationsList();
}

function showToast(message) {
  const toast = $('#toast');
  $('#toastMessage').textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2700);
}

function openOpportunityModal(id = null) {
  editingId = id;
  const form = $('#opportunityForm');
  form.reset();
  const item = id ? opportunities.find((opportunity) => String(opportunity.id) === String(id)) : null;
  $('#modalEyebrow').textContent = item ? 'UPDATE YOUR WORKSPACE' : 'ADD TO YOUR WORKSPACE';
  $('#modalTitle').textContent = item ? 'Edit opportunity' : 'Add an opportunity';
  $('#saveOpportunityButton').innerHTML = item ? 'Save changes <svg class="icon"><use href="#icon-check"/></svg>' : 'Save opportunity <svg class="icon"><use href="#icon-arrow"/></svg>';

  if (item) {
    $('#companyInput').value = item.company || '';
    $('#roleInput').value = item.role || '';
    $('#industryInput').value = item.industry || '';
    $('#locationInput').value = item.location || '';
    $('#statusInput').value = item.status || 'Interested';
    $('#websiteInput').value = item.website || '';
    $('#applicationDateInput').value = item.applicationDate || '';
    $('#followUpDateInput').value = item.followUpDate || '';
    $('#notesInput').value = item.notes || '';
  } else {
    $('#statusInput').value = 'Interested';
  }
  $('#opportunityModal').showModal();
  window.setTimeout(() => $('#companyInput').focus(), 40);
}

function closeOpportunityModal() {
  $('#opportunityModal').close();
  editingId = null;
}

function normalizeWebsite(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const result = safeWebsite(text);
  if (!result) throw new Error('Enter a valid website address, such as https://example.com.');
  return result;
}

function handleOpportunitySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  let website = '';
  try {
    website = normalizeWebsite($('#websiteInput').value);
  } catch (error) {
    $('#websiteInput').setCustomValidity(error.message);
    $('#websiteInput').reportValidity();
    $('#websiteInput').setCustomValidity('');
    return;
  }

  const current = editingId ? opportunities.find((item) => String(item.id) === String(editingId)) : null;
  const record = {
    id: current ? current.id : `opp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    company: $('#companyInput').value.trim(),
    role: $('#roleInput').value.trim(),
    industry: $('#industryInput').value.trim() || 'Other',
    location: $('#locationInput').value.trim(),
    status: $('#statusInput').value,
    website,
    applicationDate: $('#applicationDateInput').value,
    followUpDate: $('#followUpDateInput').value,
    notes: $('#notesInput').value.trim(),
    updatedAt: Date.now()
  };

  if (!record.company || !record.role) {
    showToast('Add both a company name and a role.');
    return;
  }

  if (current) {
    opportunities = opportunities.map((item) => String(item.id) === String(editingId) ? record : item);
  } else {
    opportunities.push(record);
  }
  closeOpportunityModal();
  saveOpportunities(current ? 'Opportunity updated.' : 'Opportunity added.');
}

function updateStatus(id, newStatus) {
  if (!STATUSES.includes(newStatus)) return;
  const item = opportunities.find((opportunity) => String(opportunity.id) === String(id));
  if (!item || item.status === newStatus) return;
  opportunities = opportunities.map((opportunity) => String(opportunity.id) === String(id)
    ? { ...opportunity, status: newStatus, updatedAt: Date.now() }
    : opportunity);
  saveOpportunities(`${item.company} moved to ${newStatus}.`);
}

function deleteOpportunity(id) {
  const item = opportunities.find((opportunity) => String(opportunity.id) === String(id));
  if (!item) return;
  if (!window.confirm(`Delete the opportunity for ${item.company} — ${item.role}?`)) return;
  opportunities = opportunities.filter((opportunity) => String(opportunity.id) !== String(id));
  saveOpportunities('Opportunity deleted.');
}

function restoreDemoData() {
  if (!window.confirm('Replace the current list with the fictional sample records? Export a CSV first if you need a backup.')) return;
  opportunities = copyDemoData();
  saveOpportunities('Sample opportunities restored.');
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCSV(items = opportunities, filename = 'careertrack-opportunities.csv') {
  const columns = [
    ['Company', 'company'], ['Role', 'role'], ['Industry', 'industry'], ['Location', 'location'],
    ['Status', 'status'], ['Company Website', 'website'], ['Application Date', 'applicationDate'],
    ['Follow-up Date', 'followUpDate'], ['Research Notes', 'notes']
  ];
  const rows = [columns.map(([heading]) => csvCell(heading)).join(','), ...items.map((item) => columns.map(([, key]) => csvCell(item[key])).join(','))];
  const blob = new Blob(['\uFEFF', rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`CSV exported (${items.length} records).`);
}

function handleActionClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === 'edit') openOpportunityModal(id);
  if (action === 'delete') deleteOpportunity(id);
  if (action === 'company-view') {
    $('#applicationsSearch').value = button.dataset.company || '';
    $('#applicationsStatusFilter').value = 'all';
    $('#applicationsIndustryFilter').value = 'all';
    setApplicationsLayout('board');
    switchView('applications');
    renderKanbanBoard();
    showToast(`Showing roles for ${button.dataset.company}.`);
  }
}

// Navigation is shared by the top links and the small calls to action.
$$('[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$$('[data-go-view]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  switchView(link.dataset.goView);
}));

$('#addOpportunityTop').addEventListener('click', () => openOpportunityModal());
$('#addOpportunityApplications').addEventListener('click', () => openOpportunityModal());
$('#addOpportunityCompanies').addEventListener('click', () => openOpportunityModal());
$('#openApplications').addEventListener('click', () => switchView('applications'));
$('#viewAllRecent').addEventListener('click', () => switchView('applications'));
$('#addFromEmpty').addEventListener('click', () => openOpportunityModal());
$('#exportCsv').addEventListener('click', () => exportCSV());
$('#exportCsvOverview').addEventListener('click', () => exportCSV());
$('#exportCompanies').addEventListener('click', () => exportCSV());
$('#restoreDemo').addEventListener('click', restoreDemoData);
$('#restoreDemoApplications').addEventListener('click', restoreDemoData);
$('#dismissDemo').addEventListener('click', () => $('#demoNotice').classList.add('hidden'));
$('#closeModal').addEventListener('click', closeOpportunityModal);
$('#cancelModal').addEventListener('click', closeOpportunityModal);
$('#opportunityForm').addEventListener('submit', handleOpportunitySubmit);
$('#helpButton').addEventListener('click', () => $('#helpModal').showModal());
$('#closeHelp').addEventListener('click', () => $('#helpModal').close());
$('#gotItHelp').addEventListener('click', () => $('#helpModal').close());
$$('[data-layout]').forEach((button) => button.addEventListener('click', () => setApplicationsLayout(button.dataset.layout)));

$('#overviewSearch').addEventListener('input', renderOverviewRows);
$('#overviewStatusFilter').addEventListener('change', renderOverviewRows);
$('#applicationsSearch').addEventListener('input', () => { renderKanbanBoard(); renderApplicationsList(); });
$('#applicationsStatusFilter').addEventListener('change', () => { renderKanbanBoard(); renderApplicationsList(); });
$('#applicationsIndustryFilter').addEventListener('change', () => { renderKanbanBoard(); renderApplicationsList(); });
$('#companiesSearch').addEventListener('input', renderCompanies);
$('#companiesIndustryFilter').addEventListener('change', renderCompanies);

document.addEventListener('click', handleActionClick);
document.addEventListener('change', (event) => {
  const select = event.target.closest('select[data-action="status"]');
  if (select) updateStatus(select.dataset.id, select.value);
});

$('#opportunityModal').addEventListener('click', (event) => {
  if (event.target === $('#opportunityModal')) closeOpportunityModal();
});
$('#helpModal').addEventListener('click', (event) => {
  if (event.target === $('#helpModal')) $('#helpModal').close();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if ($('#opportunityModal').open) closeOpportunityModal();
    if ($('#helpModal').open) $('#helpModal').close();
  }
});

setSaveStatus(storageWorks);
renderAll();
