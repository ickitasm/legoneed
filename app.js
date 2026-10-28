// CONFIGURASI SUPABASE
const SUPABASE_URL = "https://oojqtaiuqxrkfabrszmo.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_Dz64PNP292gjLffXo5VXBQ_odKcRbri"; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("user-status");
    if (statusEl) statusEl.innerText = "Sistem Terhubung ke Supabase";
    
    const todoDateEl = document.getElementById("todo-date");
    if (todoDateEl) todoDateEl.valueAsDate = new Date();

    loadSeries();
    loadTodos();
    loadMedical();
    loadNotes();
});

// FUNGSI GANTI TAB
function switchTab(tabName) {
    document.querySelectorAll(".module").forEach(m => m.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    
    const targetModule = document.getElementById(`mod-${tabName}`);
    if (targetModule) targetModule.classList.add("active");

    if (window.event && window.event.target) {
        window.event.target.classList.add("active");
    }
}

/* --- LOGIKA SERIES TRACKER --- */
async function addSeries(e) {
    e.preventDefault();
    const title = document.getElementById("series-title").value;
    const season = parseInt(document.getElementById("series-season").value) || 1;
    const episode = parseInt(document.getElementById("series-episode").value) || 1;
    const timestamp_marker = document.getElementById("series-timestamp").value;

    await supabase.from("series_tracker").insert([{ title, season, episode, timestamp_marker }]);
    document.getElementById("form-series").reset();
    loadSeries();
}

async function loadSeries() {
    const { data } = await supabase.from("series_tracker").select("*").order("updated_at", { ascending: false });
    const list = document.getElementById("list-series");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(s => {
        list.innerHTML += `
            <div class="card">
                <div class="card-header">
                    <strong>${s.title}</strong>
                    <button class="btn-action" onclick="incrementEpisode('${s.id}', ${s.season}, ${s.episode})">+1 Episode</button>
                </div>
                <p>Season ${s.season} | Episode ${s.episode} ${s.timestamp_marker ? `(${s.timestamp_marker})` : ""}</p>
            </div>`;
    });
}

async function incrementEpisode(id, currentSeason, currentEpisode) {
    await supabase.from("series_tracker").update({ episode: currentEpisode + 1, updated_at: new Date() }).eq("id", id);
    loadSeries();
}

/* --- LOGIKA ADAPTIVE TO-DO LIST --- */
async function addTodo(e) {
    e.preventDefault();
    const task = document.getElementById("todo-task").value;
    const due_date = document.getElementById("todo-date").value;

    await supabase.from("adaptive_todos").insert([{ task, due_date }]);
    document.getElementById("form-todo").reset();
    document.getElementById("todo-date").valueAsDate = new Date();
    loadTodos();
}

async function loadTodos() {
    const { data } = await supabase.from("adaptive_todos").select("*").order("due_date", { ascending: true });
    const list = document.getElementById("list-todo");
    if (!list) return;
    list.innerHTML = "";
    
    const today = new Date().toISOString().split("T")[0];

    data?.forEach(t => {
        const isOverdue = t.due_date < today && !t.is_completed;
        list.innerHTML += `
            <div class="card ${isOverdue ? "overdue" : ""}">
                <div class="card-header">
                    <span style="${t.is_completed ? "text-decoration: line-through;" : ""}">${t.task}</span>
                    <button class="btn-action" onclick="toggleTodo('${t.id}', ${!t.is_completed})">${t.is_completed ? "Batal" : "Selesai"}</button>
                </div>
                <small>${t.due_date} ${isOverdue ? "(Terlewat - Adaptif)" : ""}</small>
            </div>`;
    });
}

async function toggleTodo(id, status) {
    await supabase.from("adaptive_todos").update({ is_completed: status }).eq("id", id);
    loadTodos();
}

/* --- LOGIKA REKAM MEDIS --- */
async function addMedical(e) {
    e.preventDefault();
    const subject_name = document.getElementById("med-name").value;
    const subject_type = document.getElementById("med-type").value;
    const record_date = document.getElementById("med-date").value;
    const diagnosis_notes = document.getElementById("med-notes").value;
    const medication = document.getElementById("med-prescription").value;

    await supabase.from("medical_records").insert([{ subject_name, subject_type, record_date, diagnosis_notes, medication }]);
    document.getElementById("form-medical").reset();
    loadMedical();
}

async function loadMedical() {
    const { data } = await supabase.from("medical_records").select("*").order("record_date", { ascending: false });
    const list = document.getElementById("list-medical");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(m => {
        list.innerHTML += `
            <div class="card">
                <strong>${m.subject_name} (${m.subject_type})</strong> - <small>${m.record_date}</small>
                <p><strong>Diagnosa:</strong> ${m.diagnosis_notes || "-"}</p>
                <p><strong>Obat:</strong> ${m.medication || "-"}</p>
            </div>`;
    });
}

/* --- LOGIKA NOTES --- */
async function addNote(e) {
    e.preventDefault();
    const title = document.getElementById("note-title").value;
    const content = document.getElementById("note-content").value;

    await supabase.from("general_notes").insert([{ title, content }]);
    document.getElementById("form-notes").reset();
    loadNotes();
}

async function loadNotes() {
    const { data } = await supabase.from("general_notes").select("*").order("updated_at", { ascending: false });
    const list = document.getElementById("list-notes");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(n => {
        list.innerHTML += `
            <div class="card">
                <strong>${n.title}</strong>
                <p>${n.content || ""}</p>
            </div>`;
    });
}