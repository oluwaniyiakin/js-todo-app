// Globals
let tasks = [];
let lastAction = null;
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const categoryInput = document.getElementById("category");
const progressText = document.getElementById("progressText");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const darkToggle = document.getElementById("darkToggle");

// Load tasks on startup
window.onload = () => {
  loadTasks();
  renderTasks();
  startReminderChecker();
};

// Add Task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTask = {
    id: Date.now(),
    name: taskInput.value.trim(),
    dueDate: dueDateInput.value || null,
    completed: false,
    priority: priorityInput.value,
    category: categoryInput.value.trim(),
    subtasks: [],
  };
  if (newTask.name === "") return;

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskForm.reset();
});

// Undo
document.getElementById("undoBtn").addEventListener("click", () => {
  if (!lastAction) return;
  if (lastAction.type === "delete") {
    tasks.push(lastAction.task);
  } else if (lastAction.type === "complete") {
    const task = tasks.find((t) => t.id === lastAction.task.id);
    if (task) task.completed = false;
  }
  lastAction = null;
  saveTasks();
  renderTasks();
});

// Export
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(tasks)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-tasks.json";
  a.click();
});

// Import
document.getElementById("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedTasks = JSON.parse(reader.result);
      tasks = importedTasks;
      saveTasks();
      renderTasks();
    } catch (err) {
      alert("Invalid file format.");
    }
  };
  reader.readAsText(file);
});

// Search & Filter
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("todo-tasks", JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
  const stored = localStorage.getItem("todo-tasks");
  if (stored) tasks = JSON.parse(stored);
}

// Render all tasks
function renderTasks() {
  taskList.innerHTML = "";
  const query = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  const filtered = tasks.filter((task) => {
    const matchText = task.name.toLowerCase().includes(query);
    const matchFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed);
    return matchText && matchFilter;
  });

  filtered.forEach((task) => taskList.appendChild(createTaskElement(task)));
  updateProgress();
}

// Create DOM structure for a task
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task ${task.completed ? "completed" : ""}`;

  // Due date handling
  const now = new Date().toISOString().split("T")[0];
  if (task.dueDate && task.dueDate < now) {
    li.classList.add("overdue");
  } else if (task.dueDate === now) {
    li.classList.add("due-today");
  }

  li.innerHTML = `
    <input type="checkbox" ${task.completed ? "checked" : ""} />
    <span>${task.name}</span>
    <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
    <span class="tag">${task.category}</span>
    <span class="due">${task.dueDate ? "📅 " + task.dueDate : ""}</span>
    <button class="delete">🗑</button>
  `;

  li.querySelector("input").addEventListener("change", () => {
    task.completed = !task.completed;
    lastAction = { type: "complete", task: { ...task } };
    saveTasks();
    renderTasks();
  });

  li.querySelector(".delete").addEventListener("click", () => {
    lastAction = { type: "delete", task };
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
    renderTasks();
  });

  return li;
}

// Progress Tracker
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  progressText.textContent = `Progress: ${completed}/${total} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`;
}

// Reminder Checker (due soon)
function startReminderChecker() {
  setInterval(() => {
    const now = new Date().toISOString().split("T")[0];
    const dueToday = tasks.filter((t) => t.dueDate === now && !t.completed);
    if (dueToday.length > 0) {
      alert(`⏰ You have ${dueToday.length} task(s) due today!`);
    }
  }, 60000); // every 1 min
}

// Initialize SortableJS
new Sortable(taskList, {
  animation: 150,
  onEnd: () => {
    const reordered = [];
    taskList.querySelectorAll("li").forEach((li) => {
      const name = li.querySelector("span").textContent;
      const found = tasks.find((t) => t.name === name);
      if (found) reordered.push(found);
    });
    tasks = reordered;
    saveTasks();
  },
});
