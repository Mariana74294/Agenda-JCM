"use strict";

const PARALLELOS = {
  "1ro": ["A", "B", "C"], "2do": ["A", "B", "C"], "3ro": ["A", "B", "C"],
  "4to": ["A", "B"], "5to": ["A", "B"], "6to": ["A", "B"]
};

const MATERIAS = {
  "1ro": ["Lenguaje", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Biología", "Religión"],
  "2do": ["Lenguaje", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Biología", "Religión"],
  "3ro": ["Comunicación y Lenguajes", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Física", "Química", "Biología", "Filosofías y Psicologías", "Religión"],
  "4to": ["Comunicación y Lenguajes", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Física", "Química", "Biología", "Filosofías y Psicologías", "Religión"],
  "5to": ["Comunicación y Lenguajes", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Física", "Química", "Biología", "Filosofías y Psicologías", "Religión"],
  "6to": ["Comunicación y Lenguajes", "Lengua Extranjera", "Ciencias Sociales", "Educación Física y Deportes", "Educación Musical", "Artes Plásticas", "Matemáticas", "Técnica Tecnología", "Física", "Química", "Biología", "Filosofías y Psicologías", "Religión"]
};

const CUENTAS_KEY = "agendaJCM_v2_cuentas";
const TAREAS_KEY = "agendaJCM_v2_tareas";
let cuentas = JSON.parse(localStorage.getItem(CUENTAS_KEY) || "[]");
let tareas = JSON.parse(localStorage.getItem(TAREAS_KEY) || "[]");
let usuarioActual = null;
let materiaSeleccionada = null;

const $ = id => document.getElementById(id);
const guardarCuentas = () => localStorage.setItem(CUENTAS_KEY, JSON.stringify(cuentas));
const guardarTareas = () => localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
const grupoDe = user => `${user.curso}-${user.paralelo}`;
const mismoGrupo = (a, b) => a.curso === b.curso && a.paralelo === b.paralelo;
const esAdmin = user => user.rol === "admin";
const escapar = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fechaBonita = value => {
  if (!value) return "Sin fecha";
  const [y,m,d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-BO", {day:"numeric", month:"short", year:"numeric"});
};
function mostrarMensaje(id, texto, error=false) {
  const el = $(id); el.textContent = texto; el.classList.toggle("error", error);
}
function cambiarPestana(tab) {
  const login = tab === "login";
  $("loginForm").classList.toggle("hidden", !login);
  $("registerForm").classList.toggle("hidden", login);
  $("loginTab").classList.toggle("active", login);
  $("registerTab").classList.toggle("active", !login);
  mostrarMensaje("loginMessage", ""); mostrarMensaje("registerMessage", "");
}
$("loginTab").addEventListener("click", () => cambiarPestana("login"));
$("registerTab").addEventListener("click", () => cambiarPestana("register"));

$("regCourse").addEventListener("change", () => {
  const curso = $("regCourse").value;
  $("regParallel").innerHTML = '<option value="">Selecciona paralelo</option>';
  (PARALLELOS[curso] || []).forEach(p => $("regParallel").add(new Option(p, p)));
  $("regParallel").disabled = !curso;
});
$("registerForm").addEventListener("submit", event => {
  event.preventDefault();
  const nombre = $("regName").value.trim();
  const usuario = $("regUser").value.trim();
  const correo = $("regEmail").value.trim();
  const curso = $("regCourse").value;
  const paralelo = $("regParallel").value;
  const rol = $("regRole").value;
  const password = $("regPassword").value;

  if (!nombre || !usuario || !curso || !paralelo || password.length < 6) {
    mostrarMensaje("registerMessage", "Revisa los datos y usa una contraseña de al menos 6 caracteres.", true); return;
  }
  if (cuentas.some(c => c.usuario.toLowerCase() === usuario.toLowerCase())) {
    mostrarMensaje("registerMessage", "Ese nombre de usuario ya está registrado.", true); return;
  }
  if (rol === "admin") {
    const admins = cuentas.filter(c => c.rol === "admin" && c.curso === curso && c.paralelo === paralelo);
    if (admins.length >= 2) {
      mostrarMensaje("registerMessage", "Este curso y paralelo ya tiene dos cuentas administradoras.", true); return;
    }
    if (!confirm("Confirma que eres presidente o vicepresidente de este curso. Este prototipo no puede verificar tu cargo de forma segura.")) return;
  }
  cuentas.push({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), nombre, usuario, correo, curso, paralelo, rol, password});
  guardarCuentas();
  $("registerForm").reset();
  $("regParallel").innerHTML = '<option value="">Primero elige curso</option>';
  $("regParallel").disabled = true;
  mostrarMensaje("registerMessage", "Cuenta creada. Ya puedes iniciar sesión.");
  cambiarPestana("login");
  $("loginUser").value = usuario;
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const usuario = $("loginUser").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const encontrado = cuentas.find(c => c.usuario.toLowerCase() === usuario && c.password === password);
  if (!encontrado) { mostrarMensaje("loginMessage", "Usuario o contraseña incorrectos.", true); return; }
  usuarioActual = encontrado;
  mostrarDashboard();
});

function mostrarDashboard() {
  $("authView").classList.add("hidden"); $("dashboardView").classList.remove("hidden");
  $("greeting").textContent = `¡Hola, ${usuarioActual.nombre.split(" ")[0]}!`;
  $("accountInfo").textContent = `${usuarioActual.curso} de secundaria · Paralelo ${usuarioActual.paralelo} · ${esAdmin(usuarioActual) ? "Administrador de curso" : "Estudiante"}`;
  $("adminPanel").classList.toggle("hidden", !esAdmin(usuarioActual));
  $("taskForm").reset();
  materiaSeleccionada = null;
  $("subjectGrid").classList.remove("hidden");
  $("taskList").classList.add("hidden"); $("backSubjects").classList.add("hidden"); $("emptyMessage").classList.add("hidden");
  $("activitiesTitle").textContent = "Materias y actividades";
  $("activitiesSubtitle").textContent = esAdmin(usuarioActual) ? "Selecciona una materia para revisar las tareas de tu curso." : "Selecciona una materia para ver tus actividades.";
  if (esAdmin(usuarioActual)) cargarSelectorMaterias();
  renderMaterias();
}
function cargarSelectorMaterias() {
  const select = $("taskSubject");
  select.innerHTML = '<option value="">Selecciona materia</option>';
  (MATERIAS[usuarioActual.curso] || []).forEach(m => select.add(new Option(m,m)));
}
$("logoutButton").addEventListener("click", () => {
  usuarioActual = null;
  $("dashboardView").classList.add("hidden"); $("authView").classList.remove("hidden");
  $("loginForm").reset(); mostrarMensaje("loginMessage", "");
});

function tareasDelGrupo() {
  return tareas.filter(t => t.curso === usuarioActual.curso && t.paralelo === usuarioActual.paralelo);
}
function pendientesMateria(materia) {
  return tareasDelGrupo().filter(t => t.materia === materia && !t.completada).length;
}
function renderMaterias() {
  const grid = $("subjectGrid"); grid.innerHTML = "";
  (MATERIAS[usuarioActual.curso] || []).forEach((materia, i) => {
    const pendientes = pendientesMateria(materia);
    const button = document.createElement("button");
    button.type = "button"; button.className = "subject-card";
    button.innerHTML = `<div class="subject-icon">${["📘","🌎","🏃","🎵","🎨","📐","🧪","🧬","💻","📖","🌱","🧠","✨"][i % 13]}</div>
      <strong>${escapar(materia)}</strong><small>${pendientes ? `${pendientes} pendiente${pendientes===1?"":"s"}` : "Ver actividades"}</small>
      ${pendientes ? `<span class="badge-count" aria-label="${pendientes} pendientes">${pendientes}</span>` : ""}`;
    button.addEventListener("click", () => abrirMateria(materia));
    grid.appendChild(button);
  });
}
function abrirMateria(materia) {
  materiaSeleccionada = materia;
  $("subjectGrid").classList.add("hidden"); $("taskList").classList.remove("hidden"); $("backSubjects").classList.remove("hidden");
  $("activitiesTitle").textContent = materia;
  $("activitiesSubtitle").textContent = `${usuarioActual.curso} · Paralelo ${usuarioActual.paralelo}`;
  renderTareas();
}
$("backSubjects").addEventListener("click", () => {
  materiaSeleccionada = null; $("subjectGrid").classList.remove("hidden"); $("taskList").classList.add("hidden");
  $("backSubjects").classList.add("hidden"); $("emptyMessage").classList.add("hidden");
  $("activitiesTitle").textContent = "Materias y actividades"; renderMaterias();
});
$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!esAdmin(usuarioActual)) return;
  const materia = $("taskSubject").value;
  const titulo = $("taskTitle").value.trim();
  const fecha = $("taskDue").value;
  if (!(MATERIAS[usuarioActual.curso] || []).includes(materia)) {
    mostrarMensaje("taskMessage", "Selecciona una materia válida para tu curso.", true); return;
  }
  if (!titulo || !fecha) { mostrarMensaje("taskMessage", "Completa el título y la fecha.", true); return; }
  tareas.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    titulo, descripcion: $("taskDescription").value.trim(), materia,
    tipo: $("taskType").value, fecha, curso: usuarioActual.curso,
    paralelo: usuarioActual.paralelo, creador: usuarioActual.usuario,
    completada: false, creada: new Date().toISOString()
  });
  guardarTareas(); $("taskForm").reset(); mostrarMensaje("taskMessage", "Actividad publicada para tu curso y paralelo.");
  renderMaterias();
  if (materiaSeleccionada) renderTareas();
});
function renderTareas() {
  const list = $("taskList"); list.innerHTML = "";
  const filtradas = tareasDelGrupo().filter(t => t.materia === materiaSeleccionada)
    .sort((a,b) => a.fecha.localeCompare(b.fecha));
  $("emptyMessage").classList.toggle("hidden", filtradas.length > 0);
  filtradas.forEach(t => {
    const card = document.createElement("article"); card.className = "task-card";
    card.innerHTML = `<div class="task-card-top"><h3>${escapar(t.titulo)}</h3><span class="type-tag">${escapar(t.tipo)}</span></div>
      ${t.descripcion ? `<p>${escapar(t.descripcion)}</p>` : ""}
      <div class="task-meta"><span>📅 Entrega: ${escapar(fechaBonita(t.fecha))}</span><span>${t.completada ? "✓ Completada" : "● Pendiente"}</span></div>
      <div class="task-actions">${!esAdmin(usuarioActual) ? `<button class="small-btn ${t.completada?"done":""}" data-action="toggle" data-id="${escapar(t.id)}">${t.completada?"Marcar pendiente":"Marcar completada"}</button>` : ""}
      ${esAdmin(usuarioActual) && t.creador === usuarioActual.usuario ? `<button class="small-btn delete" data-action="delete" data-id="${escapar(t.id)}">Eliminar actividad</button>` : ""}</div>`;
    list.appendChild(card);
  });
}
$("taskList").addEventListener("click", event => {
  const btn = event.target.closest("button[data-action]"); if (!btn) return;
  const task = tareas.find(t => t.id === btn.dataset.id); if (!task) return;
  if (btn.dataset.action === "toggle" && !esAdmin(usuarioActual)) task.completada = !task.completada;
  if (btn.dataset.action === "delete" && esAdmin(usuarioActual) && task.creador === usuarioActual.usuario) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    tareas = tareas.filter(t => t.id !== task.id);
  }
  guardarTareas(); renderMaterias(); renderTareas();
});

// Fecha mínima: hoy.
$("taskDue").min = new Date().toISOString().slice(0,10);
