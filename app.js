
const STORAGE_KEY = 'routine_phased_v2';
let currentEditPhase = "";

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadData() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (data && data.phases && Object.keys(data.phases).length) {
    return data;
  }
  return {
    phases: {
      "Phase 1": ["Wake Up", "Brush Teeth"],
      "Phase 2": ["Stretch", "Drink Water"]
    },
    history: {}
  };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderPhases() {
  const data = loadData();
  const today = getTodayKey();
  const container = document.getElementById("phase-container");
  container.innerHTML = "";
  const history = data.history[today] || {};
  let unlock = true;
  let showed = false;

  for (const phase of Object.keys(data.phases)) {
    if (!history[phase]) history[phase] = {};
    const tasks = data.phases[phase];
    const completedAll = tasks.every(t => history[phase][t]);

    if (unlock && !completedAll) {
      const phaseTitle = document.createElement("h3");
      phaseTitle.innerText = phase;
      container.appendChild(phaseTitle);

      const ul = document.createElement("ul");
      tasks.forEach(task => {
        if (!(task in history[phase])) history[phase][task] = false;
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = history[phase][task];
        checkbox.onchange = () => {
          history[phase][task] = checkbox.checked;
          data.history[today] = history;
          saveData(data);
          renderPhases();
        };
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(task));
        ul.appendChild(li);
      });
      container.appendChild(ul);
      showed = true;
      break;
    }
  }

  if (!showed) {
    const doneMsg = document.createElement("h2");
    doneMsg.innerText = "✅ All phases completed today!";
    container.appendChild(doneMsg);
  }

  data.history[today] = history;
  saveData(data);
}

function renderEditList() {
  const data = loadData();
  const dropdown = document.getElementById("edit-phase");
  const editList = document.getElementById("edit-list");
  const selected = dropdown.value;
  currentEditPhase = selected;
  editList.innerHTML = "";

  (data.phases[selected] || []).forEach((task, i) => {
    const li = document.createElement("li");
    li.innerText = task;
    const btn = document.createElement("button");
    btn.innerText = "🗑️";
    btn.onclick = () => {
      data.phases[selected].splice(i, 1);
      saveData(data);
      renderPhases();
      renderEditList();
    };
    li.appendChild(btn);
    editList.appendChild(li);
  });
}

function renderPhaseDropdown() {
  const data = loadData();
  const dropdown = document.getElementById("edit-phase");
  dropdown.innerHTML = "";
  Object.keys(data.phases).forEach(phase => {
    const opt = document.createElement("option");
    opt.value = phase;
    opt.text = phase;
    dropdown.appendChild(opt);
  });
  dropdown.value = currentEditPhase || dropdown.value;
  currentEditPhase = dropdown.value;
}

function toggleEditMode() {
  const section = document.getElementById("edit-section");
  const display = document.getElementById("phase-display");
  const editBtn = document.querySelector('#settings-menu button[onclick="toggleEditMode()"]');
  const isVisible = section.style.display === "block";
  section.style.display = isVisible ? "none" : "block";
  display.style.display = isVisible ? "block" : "none";
  if (editBtn) editBtn.innerText = isVisible ? "Edit Tasks" : "Close Edit";
  if (!isVisible) {
    renderPhaseDropdown();
    renderEditList();
  }
}

function addPhase() {
  const data = loadData();
  let i = 1;
  let name;
  do {
    name = "Phase " + i++;
  } while (data.phases[name]);
  data.phases[name] = [];
  currentEditPhase = name;
  saveData(data);
  renderPhaseDropdown();
  document.getElementById("edit-phase").value = currentEditPhase;
  renderEditList();
  renderPhases();
}

function deletePhase() {
  const data = loadData();
  const dropdown = document.getElementById("edit-phase");
  const name = dropdown.value;
  const keys = Object.keys(data.phases);
  const index = keys.indexOf(name);
  if (confirm(`Delete ${name}?`)) {
    delete data.phases[name];
    Object.keys(data.history).forEach(day => delete data.history[day]?.[name]);
    saveData(data);
    const next = keys[index + 1] || keys[index - 1] || Object.keys(data.phases)[0];
    currentEditPhase = next;
    renderPhaseDropdown();
    document.getElementById("edit-phase").value = currentEditPhase;
    renderEditList();
    renderPhases();
  }
}

function addTask() {
  const data = loadData();
  const task = document.getElementById("new-task").value.trim();
  if (!task) return;
  data.phases[currentEditPhase].push(task);
  saveData(data);
  renderEditList();
  renderPhases();
  document.getElementById("new-task").value = "";
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
}

function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phased_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      alert("Data imported! Reloading...");
      location.reload();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
}

function toggleSettings() {
  const menu = document.getElementById("settings-menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function showReadme() {
  document.getElementById("readme-modal").style.display = "block";
}
function hideReadme() {
  document.getElementById("readme-modal").style.display = "none";
}

window.onload = () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  renderPhases();
  document.querySelectorAll('#settings-menu button, #settings-menu input[type="file"]').forEach(el => {
    el.addEventListener('click', () => {
      const menu = document.getElementById("settings-menu");
      if (menu) menu.style.display = "none";
    });
  });
};
