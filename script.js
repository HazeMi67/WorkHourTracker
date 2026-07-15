// script.js

let records = [];
let weeklyTarget = 40;

// ==============================
// Utility Functions
// ==============================

function populateDropdown(select, max) {
  for (let i = 0; i <= max; i++) {
    const option = document.createElement("option");
    option.value = option.textContent = i.toString().padStart(2, "0");
    select.appendChild(option);
  }
}

function getTimeString(hourId, minuteId) {
  const hour = document.getElementById(hourId).value;
  const minute = document.getElementById(minuteId).value;
  return `${hour}:${minute}`;
}

// ==============================
// Record Management
// ==============================

function sortRecords() {
  records.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    const timeA = new Date(`1970-01-01T${a.start}`);
    const timeB = new Date(`1970-01-01T${b.start}`);
    return timeA - timeB;
  });
}

function calculateHours(record) {
  const start = new Date(`1970-01-01T${record.start}`);
  const end = new Date(`1970-01-01T${record.end}`);
  let worked = (end - start) / (1000 * 60 * 60);
  worked -= record.break ? parseFloat(record.break) : 0;
  return worked < 0 ? 0 : worked;
}

function renderTable(filteredRecords = records) {
  const tbody = document.getElementById("recordsTableBody");
  tbody.innerHTML = "";
  filteredRecords.forEach((record, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.date}</td>
      <td>${record.start}</td>
      <td>${record.end}</td>
      <td>${record.break}</td>
      <td>${calculateHours(record).toFixed(2)}</td>
      <td>${record.remarks || ""}</td>
      <td>
        <button onclick="editRecord(${index})">✏️ Edit</button>
        <button onclick="deleteRecord(${index})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  updateDashboard();
}

function updateDashboard() {
  const totalWorked = records.reduce((sum, r) => sum + calculateHours(r), 0);
  const remaining = weeklyTarget - totalWorked;
  const overtime = remaining < 0 ? Math.abs(remaining) : 0;
  document.getElementById("totalWorked").textContent = totalWorked.toFixed(2);
  document.getElementById("remainingHours").textContent = remaining > 0 ? remaining.toFixed(2) : "0.00";
  document.getElementById("overtimeHours").textContent = overtime.toFixed(2);
  document.getElementById("weeklyTarget").value = weeklyTarget;
  const progress = Math.min((totalWorked / weeklyTarget) * 100, 100);
  const fill = document.getElementById("progressFill");
  fill.style.width = `${progress}%`;
  fill.style.backgroundColor = progress < 70 ? "#DC2626" : progress < 100 ? "#F59E0B" : "#16A34A";
}

function saveRecords() {
  localStorage.setItem("records", JSON.stringify(records));
  localStorage.setItem("weeklyTarget", weeklyTarget);
}

function loadRecords() {
  records = JSON.parse(localStorage.getItem("records")) || [];
  weeklyTarget = parseFloat(localStorage.getItem("weeklyTarget")) || weeklyTarget;
  sortRecords();
  renderTable();
}

function addRecord() {
  const date = document.getElementById("date").value;
  const start = getTimeString("startHour", "startMinute");
  const end = getTimeString("endHour", "endMinute");
  const breakTime = document.getElementById("break").value;
  const remarks = document.getElementById("remarks").value;
  if (!date || !start || !end) {
    alert("Date, start, and end times are required.");
    return;
  }
  records.push({ date, start, end, break: breakTime, remarks });
  sortRecords();
  saveRecords();
  renderTable();
}

function editRecord(index) {
  const r = records[index];
  document.getElementById("date").value = r.date;
  const [sh, sm] = r.start.split(":");
  const [eh, em] = r.end.split(":");
  document.getElementById("startHour").value = sh;
  document.getElementById("startMinute").value = sm;
  document.getElementById("endHour").value = eh;
  document.getElementById("endMinute").value = em;
  document.getElementById("break").value = r.break;
  document.getElementById("remarks").value = r.remarks;
  records.splice(index, 1);
  sortRecords();
  saveRecords();
  renderTable();
}

function deleteRecord(index) {
  records.splice(index, 1);
  sortRecords();
  saveRecords();
  renderTable();
}

function clearRecords() {
  if (confirm("Are you sure you want to clear all records?")) {
    records = [];
    saveRecords();
    renderTable();
  }
}

function searchRecords() {
  const searchDate = document.getElementById("searchDate").value;
  if (!searchDate) {
    renderTable();
    return;
  }
  const filtered = records.filter(r => r.date === searchDate);
  renderTable(filtered);
}

function updateWeeklyTarget() {
  const targetInput = document.getElementById("weeklyTarget").value;
  weeklyTarget = parseFloat(targetInput) || weeklyTarget;
  saveRecords();
  updateDashboard();
}

window.onload = () => {
  populateDropdown(document.getElementById("startHour"), 23);
  populateDropdown(document.getElementById("endHour"), 23);
  populateDropdown(document.getElementById("startMinute"), 59);
  populateDropdown(document.getElementById("endMinute"), 59);

  loadRecords();

  document.getElementById("addBtn").addEventListener("click", addRecord);
  document.getElementById("clearBtn").addEventListener("click", clearRecords);
  document.getElementById("searchBtn").addEventListener("click", searchRecords);
  document.getElementById("weeklyTarget").addEventListener("change", updateWeeklyTarget);

  const today = new Date();
  document.getElementById("todayDate").textContent = today.toLocaleDateString();
  document.getElementById("currentWeek").textContent = `Week ${getWeekNumber(today)}`;
  updateTime();
  setInterval(updateTime, 1000);
};

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

function updateTime() {
  document.getElementById("currentTime").textContent = new Date().toLocaleTimeString();
}
