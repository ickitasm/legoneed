// --- 1. KONFIGURASI SUPABASE ---
const SUPABASE_URL = "https://oojqtaiuqxrkfabrszmo.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_Dz64PNP292gjLffXo5VXBQ_odKcRbri"; 

// Menggunakan 'supabaseClient' agar tidak bertabrakan dengan variabel global 'supabase' dari CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let activeSeriesId = null;

// --- 2. SISTEM AUTENTIKASI ---
document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleSession(session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });
});

function handleSession(session) {
    const authSection = document.getElementById("auth-section");
    const dashboardSection = document.getElementById("dashboard-section");
    const btnLogout = document.getElementById("btn-logout");
    const statusEl = document.getElementById("user-status");

    if (session) {
        currentUser = session.user;
        authSection.style.display = "none";
        dashboardSection.style.display = "block";
        btnLogout.style.display = "inline-block";
        statusEl.innerText = `Halo, ${currentUser.email}`;
        
        loadSeriesContainers();
        loadTodos();
        loadMedical();
        loadNotes();
    } else {
        currentUser = null;
        authSection.style.display = "block";
        dashboardSection.style.display = "none";
        btnLogout.style.display = "none";
        statusEl.innerText = "Sistem Terkunci";
    }
}

async function signUp() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    if (!email || !password) return alert("Isi email dan password!");
    
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Gagal Daftar: " + error.message);
    else alert("Berhasil! Silakan masuk.");
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Gagal Masuk: " + error.message);
}

async function signOut() {
    await supabaseClient.auth.signOut();
}

async function loginGoogle() {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) alert("Error Google Login: " + error.message);
    } catch (err) {
        alert("Terjadi kesalahan: " + err.message);
    }
}

// --- 3. FUNGSI TAB NAVIGASI ---
function switchTab(event, tabName) {
    document.querySelectorAll(".module").forEach(m => m.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    
    document.getElementById(`mod-${tabName}`).classList.add("active");
    event.currentTarget.classList.add("active");
}

// --- 4. LOGIKA SERIES TRACKER (MASTER-DETAIL) ---
async function createSeriesContainer(e) {
    e.preventDefault();
    const title = document.getElementById("new-series-title").value;

    await supabaseClient.from("series_tracker").insert([{ 
        user_id: currentUser.id, 
        title: title, 
        season: 1, 
        episode: 1 
    }]);
    
    document.getElementById("new-series-title").value = "";
    loadSeriesContainers();
}

async function loadSeriesContainers() {
    const { data } = await supabaseClient.from("series_tracker").select("*").order("updated_at", { ascending: false });
    const list = document.getElementById("list-series-containers");
    if (!list) return;
    list.innerHTML = "";
    
    data?.forEach(s => {
        list.innerHTML += `
            <div class="card clickable" onclick="openSeriesDetail('${s.id}', '${s.title}', ${s.season}, ${s.episode}, '${s.timestamp_marker || ""}')">
                <div class="card-header">
                    <strong>📁 ${s.title}</strong>
                </div>
                <p>Terakhir: S${s.season} E${s.episode}</p>
            </div>`;
    });
}

function openSeriesDetail(id, title, season, episode, timestamp) {
    activeSeriesId = id;
    document.getElementById("series-master").style.display = "none";
    document.getElementById("series-detail").style.display = "block";
    
    document.getElementById("active-series-title").innerText = title;
    document.getElementById("detail-season").value = season;
    document.getElementById("detail-episode").value = episode;
    document.getElementById("detail-timestamp").value = timestamp;
}

function closeSeriesDetail() {
    activeSeriesId = null;
    document.getElementById("series-master").style.display = "block";
    document.getElementById("series-detail").style.display = "none";
}

async function updateSeriesProgress(e) {
    e.preventDefault();
    const season = document.getElementById("detail-season").value;
    const episode = document.getElementById("detail-episode").value;
    const timestamp = document.getElementById("detail-timestamp").value;

    await supabaseClient.from("series_tracker")
        .update({ season, episode, timestamp_marker: timestamp, updated_at: new Date() })
        .eq("id", activeSeriesId);
    
    alert("Progres Tersimpan!");
    loadSeriesContainers();
    closeSeriesDetail();
}

// --- 5. FUNGSI STANDAR (TODO, MEDIS, NOTES) ---
async function addTodo(e) {
    e.preventDefault();
    const task = document.getElementById("todo-task").value;
    const due_date = document.getElementById("todo-date").value;
    await supabaseClient.from("adaptive_todos").insert([{ user_id: currentUser.id, task, due_date }]);
    document.getElementById("form-todo").reset();
    loadTodos();
}

async function loadTodos() {
    const { data } = await supabaseClient.from("adaptive_todos").select("*").order("due_date", { ascending: true });
    const list = document.getElementById("list-todo");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(t => {
        list.innerHTML += `<div class="card"><strong>${t.task}</strong> - ${t.due_date}</div>`;
    });
}

async function addMedical(e) {
    e.preventDefault();
    const subject_name = document.getElementById("med-name").value;
    const record_date = document.getElementById("med-date").value;
    await supabaseClient.from("medical_records").insert([{ user_id: currentUser.id, subject_name, record_date }]);
    document.getElementById("form-medical").reset();
    loadMedical();
}

async function loadMedical() {
    const { data } = await supabaseClient.from("medical_records").select("*").order("record_date", { ascending: false });
    const list = document.getElementById("list-medical");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(m => {
        list.innerHTML += `<div class="card"><strong>${m.subject_name}</strong> - ${m.record_date}</div>`;
    });
}

async function addNote(e) {
    e.preventDefault();
    const title = document.getElementById("note-title").value;
    const content = document.getElementById("note-content").value;
    await supabaseClient.from("general_notes").insert([{ user_id: currentUser.id, title, content }]);
    document.getElementById("form-notes").reset();
    loadNotes();
}

async function loadNotes() {
    const { data } = await supabaseClient.from("general_notes").select("*").order("updated_at", { ascending: false });
    const list = document.getElementById("list-notes");
    if (!list) return;
    list.innerHTML = "";
    data?.forEach(n => {
        list.innerHTML += `<div class="card"><strong>${n.title}</strong><p>${n.content}</p></div>`;
    });
}