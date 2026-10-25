
'use strict';

const STORAGE_KEY = 'clientfidele_clients';

const initialClients = [
  {
    id: '1',
    name: 'Aminata Diallo',
    phone: '0600000001',
    email: 'aminata@example.com',
    lastVisit: getDateDaysAgo(12)
  },
  {
    id: '2',
    name: 'Sarah Martin',
    phone: '0600000002',
    email: 'sarah@example.com',
    lastVisit: getDateDaysAgo(25)
  },
  {
    id: '3',
    name: 'Amélie Moreau',
    phone: '0600000003',
    email: 'amelie@example.com',
    lastVisit: getDateDaysAgo(52)
  }
];

const form = document.querySelector('#clientForm');
const tableBody = document.querySelector('#clientTableBody');
const searchInput = document.querySelector('#searchClient');
const filterSelect = document.querySelector('#clientFilter');
const emptyState = document.querySelector('#emptyClients');
const formFeedback = document.querySelector('#formFeedback');

let clients = loadClients();

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function loadClients() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [...initialClients];
    }
  } catch (error) {
    console.error('Impossible de lire les clients :', error);
  }

  return [...initialClients];
}

function saveClients() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    return true;
  } catch (error) {
    console.error('Impossible de sauvegarder les clients :', error);
    formFeedback.textContent = 'Erreur de sauvegarde dans le navigateur.';
    return false;
  }
}

function getDaysSinceVisit(lastVisit) {
  if (!lastVisit) return Infinity;

  const visitDate = new Date(`${lastVisit}T00:00:00`);
  if (Number.isNaN(visitDate.getTime())) return Infinity;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.floor((today - visitDate) / 86400000);
}

function isInactive(client) {
  return getDaysSinceVisit(client.lastVisit) > 45;
}

function formatDate(date) {
  if (!date) return 'Non renseignée';

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return 'Non renseignée';

  return new Intl.DateTimeFormat('fr-FR').format(parsed);
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function renderClients() {
  const search = searchInput.value.trim().toLocaleLowerCase('fr');
  const filter = filterSelect.value;

  const filteredClients = clients.filter((client) => {
    const searchableText = [
      client.name,
      client.email,
      client.phone
    ].join(' ').toLocaleLowerCase('fr');

    const matchesSearch = searchableText.includes(search);
    const inactive = isInactive(client);

    const matchesFilter =
      filter === 'all' ||
      (filter === 'inactive' && inactive) ||
      (filter === 'active' && !inactive);

    return matchesSearch && matchesFilter;
  });

  tableBody.replaceChildren();

  filteredClients.forEach((client) => {
    const row = document.createElement('tr');
    const nameCell = createCell(client.name);
    const phoneCell = createCell(client.phone);
    const visitCell = createCell(formatDate(client.lastVisit));
    const statusCell = document.createElement('td');
    const status = document.createElement('span');

    status.className = `status ${isInactive(client) ? 'pending' : 'confirmed'}`;
    status.textContent = isInactive(client) ? 'À relancer' : 'Récent';
    statusCell.append(status);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'table-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'table-button';
    editButton.textContent = 'Modifier';
    editButton.addEventListener('click', () => editClient(client.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'table-button danger';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => deleteClient(client.id));

    actionsCell.append(editButton, deleteButton);
    row.append(nameCell, phoneCell, visitCell, statusCell, actionsCell);
    tableBody.append(row);
  });

  document.querySelector('#totalClients').textContent = clients.length;
  document.querySelector('#inactiveClients').textContent =
    clients.filter(isInactive).length;

  emptyState.hidden = filteredClients.length > 0;
}

function openForm(client = null) {
  form.reset();
  formFeedback.textContent = '';
  document.querySelector('#clientId').value = client?.id ?? '';
  document.querySelector('#formTitle').textContent =
    client ? 'Modifier un client' : 'Ajouter un client';

  if (client) {
    document.querySelector('#clientName').value = client.name;
    document.querySelector('#clientPhone').value = client.phone;
    document.querySelector('#clientEmail').value = client.email ?? '';
    document.querySelector('#clientLastVisit').value = client.lastVisit ?? '';
  }

  form.hidden = false;
  document.querySelector('#clientName').focus();
}

function editClient(id) {
  const client = clients.find((item) => item.id === id);
  if (client) openForm(client);
}

function deleteClient(id) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;

  const confirmed = window.confirm(
    `Voulez-vous vraiment supprimer ${client.name} ?`
  );

  if (!confirmed) return;

  const previousClients = clients;
  clients = clients.filter((item) => item.id !== id);

  if (!saveClients()) {
    clients = previousClients;
    return;
  }

  renderClients();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const id = document.querySelector('#clientId').value;
  const name = document.querySelector('#clientName').value.trim();
  const phone = document.querySelector('#clientPhone').value.trim();
  const email = document.querySelector('#clientEmail').value.trim();
  const lastVisit = document.querySelector('#clientLastVisit').value;

  if (!name || !phone) {
    formFeedback.textContent = 'Le nom et le téléphone sont obligatoires.';
    return;
  }

  const previousClients = clients;

  if (id) {
    clients = clients.map((client) =>
      client.id === id
        ? { ...client, name, phone, email, lastVisit }
        : client
    );
  } else {
    clients = [
      ...clients,
      {
        id: crypto.randomUUID(),
        name,
        phone,
        email,
        lastVisit
      }
    ];
  }

  if (!saveClients()) {
    clients = previousClients;
    return;
  }

  form.hidden = true;
  renderClients();
});

document.querySelector('#openClientForm').addEventListener('click', () => {
  openForm();
});

document.querySelector('#cancelClientForm').addEventListener('click', () => {
  form.hidden = true;
  formFeedback.textContent = '';
});

searchInput.addEventListener('input', renderClients);
filterSelect.addEventListener('change', renderClients);

renderClients();
