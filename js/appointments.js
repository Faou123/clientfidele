
"use strict";

const CLIENTS_KEY = "clientfidele_clients";
const APPOINTMENTS_KEY = "clientfidele_appointments";

const form = document.querySelector("#appointmentForm");
const clientSelect = document.querySelector("#appointmentClient");
const serviceInput = document.querySelector("#appointmentService");
const dateInput = document.querySelector("#appointmentDate");
const timeInput = document.querySelector("#appointmentTime");
const durationInput = document.querySelector("#appointmentDuration");
const feedback = document.querySelector("#appointmentFeedback");
const filterSelect = document.querySelector("#appointmentFilter");
const tableBody = document.querySelector("#appointmentsTable");
const emptyState = document.querySelector("#appointmentsEmpty");

let clients = loadData(CLIENTS_KEY);
let appointments = loadData(APPOINTMENTS_KEY);

function loadData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAppointments() {
  localStorage.setItem(
    APPOINTMENTS_KEY,
    JSON.stringify(appointments)
  );
}

function getClientName(clientId) {
  const client = clients.find(
    (item) => String(item.id) === String(clientId)
  );

  return client ? client.name : "Client introuvable";
}

function populateClients() {
  clients = loadData(CLIENTS_KEY);
  clientSelect.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Choisir un client";
  clientSelect.append(defaultOption);

  clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = String(client.id);
    option.textContent = client.name;
    clientSelect.append(option);
  });
}

function isUpcoming(appointment) {
  const appointmentDate = new Date(
    `${appointment.date}T${appointment.time}`
  );

  return appointmentDate.getTime() >= Date.now();
}

function formatDate(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function renderAppointments() {
  const filter = filterSelect.value;

  const filteredAppointments = appointments
    .filter((appointment) => {
      if (filter === "upcoming") {
        return isUpcoming(appointment);
      }

      if (filter === "past") {
        return !isUpcoming(appointment);
      }

      return true;
    })
    .sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(
        `${b.date}T${b.time}`
      )
    );

  tableBody.replaceChildren();

  filteredAppointments.forEach((appointment) => {
    const row = document.createElement("tr");

    const values = [
      getClientName(appointment.clientId),
      appointment.service,
      formatDate(appointment.date),
      appointment.time,
      `${appointment.duration} min`
    ];

    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "appointment-delete";
    deleteButton.textContent = "Supprimer";

    deleteButton.addEventListener("click", () => {
      deleteAppointment(appointment.id);
    });

    actionCell.append(deleteButton);
    row.append(actionCell);
    tableBody.append(row);
  });

  emptyState.hidden = filteredAppointments.length > 0;

  document.querySelector("#totalAppointments").textContent =
    appointments.length;

  document.querySelector("#upcomingAppointments").textContent =
    appointments.filter(isUpcoming).length;
}

function deleteAppointment(id) {
  const confirmed = window.confirm(
    "Veux-tu vraiment supprimer ce rendez-vous ?"
  );

  if (!confirmed) return;

  const previousAppointments = appointments;

  appointments = appointments.filter(
    (appointment) => appointment.id !== id
  );

  try {
    saveAppointments();
    feedback.textContent = "Rendez-vous supprimé.";
    renderAppointments();
  } catch {
    appointments = previousAppointments;
    feedback.textContent =
      "La suppression n'a pas pu être enregistrée.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  populateClients();

  const clientId = clientSelect.value;
  const service = serviceInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  const duration = Number(durationInput.value);

  if (!clients.some(
    (client) => String(client.id) === clientId
  )) {
    feedback.textContent =
      "Ajoute d'abord un client dans la page Clients.";
    return;
  }

  if (
    !service ||
    !date ||
    !time ||
    !Number.isFinite(duration) ||
    duration < 15
  ) {
    feedback.textContent =
      "Vérifie les informations du rendez-vous.";
    return;
  }

  const selectedDate = new Date(`${date}T${time}`);

  if (
    Number.isNaN(selectedDate.getTime()) ||
    selectedDate.getTime() < Date.now()
  ) {
    feedback.textContent =
      "Choisis une date et une heure futures.";
    return;
  }

  const appointment = {
    id: crypto.randomUUID(),
    clientId,
    service,
    date,
    time,
    duration
  };

  const previousAppointments = appointments;
  appointments = [...appointments, appointment];

  try {
    saveAppointments();
  } catch {
    appointments = previousAppointments;
    feedback.textContent =
      "Impossible d'enregistrer le rendez-vous.";
    return;
  }

  form.reset();
  durationInput.value = "30";

  feedback.textContent = "Rendez-vous ajouté avec succès.";
  renderAppointments();
});

filterSelect.addEventListener("change", renderAppointments);

populateClients();
renderAppointments();

