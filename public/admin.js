// Admin Panel JavaScript

// Check admin authentication
const ADMIN_USERNAME = 'kekliksikenapoyusiker';
const ADMIN_PASSWORD = 'kekliksikenapoyusiker';

// Check if admin is logged in
function checkAdminAuth() {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAuth()) return;
    
    initEventListeners();
    loadDashboard();
});

// Event Listeners
function initEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });
    
    // Logout
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    
    // Add buttons
    document.getElementById('addTrendBtn')?.addEventListener('click', () => openTrendModal());
    document.getElementById('addSuggestionBtn')?.addEventListener('click', () => openSuggestionModal());
    
    // Save buttons
    document.getElementById('saveTrendBtn')?.addEventListener('click', saveTrend);
    document.getElementById('saveSuggestionBtn')?.addEventListener('click', saveSuggestion);
    
    // Search
    document.getElementById('userSearch')?.addEventListener('input', (e) => {
        searchUsers(e.target.value);
    });
    
    document.getElementById('postSearch')?.addEventListener('input', (e) => {
        searchPosts(e.target.value);
    });
}

// Navigation
function navigateToSection(section) {
    // Update nav
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section + 'Section').classList.add('active');
    
    // Load data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'posts':
            loadPosts();
            break;
        case 'trends':
            loadTrends();
            break;
        case 'suggestions':
            loadSuggestions();
            break;
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminAuth');
    window.location.href = '/';
}

// Dashboard
async function loadDashboard() {
    try {
        const [usersRes, postsRes, likesRes] = await Promise.all([
            fetch('/api/admin/stats/users'),
            fetch('/api/admin/stats/posts'),
            fetch('/api/admin/stats/likes')
        ]);
        
        const users = await usersRes.json();
        const posts = await postsRes.json();
        const likes = await likesRes.json();
        
        document.getElementById('totalUsers').textContent = users.total || 0;
        document.getElementById('totalPosts').textContent = posts.total || 0;
        document.getElementById('totalLikes').textContent = likes.total || 0;
        document.getElementById('activeUsers').textContent = users.active || 0;
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>@${user.username}</td>
                <td>${user.email}</td>
                <td>${user.display_name}</td>
                <td>${user.ip_address || 'N/A'}</td>
                <td>${new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
                <td>${user.last_post || 'Hiç paylaşım yok'}</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteUser(${user.id}, '${user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Users load error:', error);
    }
}

function searchUsers(query) {
    const rows = document.querySelectorAll('#usersTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

async function viewUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/details`);
        const data = await response.json();
        
        alert(`Kullanıcı Detayları:\n\nID: ${data.id}\nKullanıcı Adı: ${data.username}\nEmail: ${data.email}\nIP: ${data.ip_address || 'N/A'}\nKayıt: ${new Date(data.created_at).toLocaleString('tr-TR')}\nToplam Keklik: ${data.post_count}\nToplam Beğeni: ${data.like_count}\nTakipçi: ${data.followers}\nTakip: ${data.following}`);
    } catch (error) {
        alert('Kullanıcı detayları yüklenemedi');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Kullanıcı silindi');
            loadUsers();
        } else {
            alert(data.error || 'Kullanıcı silinemedi');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}

// Posts
async function loadPosts() {
    try {
        const response = await fetch('/api/admin/posts');
        const posts = await response.json();
        
        const tbody = document.getElementById('postsTableBody');
        tbody.innerHTML = posts.map(post => `
            <tr>
                <td>${post.id}</td>
                <td>@${post.username}</td>
                <td>${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}</td>
                <td>${post.likes || 0}</td>
                <td>${post.replies || 0}</td>
                <td>${new Date(post.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <button class="btn-action btn-view" onclick="viewPost(${post.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deletePost(${post.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Posts load error:', error);
    }
}

function searchPosts(query) {
    const rows = document.querySelectorAll('#postsTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

async function viewPost(postId) {
    try {
        const response = await fetch(`/api/posts`);
        const posts = await response.json();
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            alert(`Keklik Detayları:\n\nID: ${post.id}\nKullanıcı: @${post.username}\nİçerik: ${post.content}\nBeğeni: ${post.likes || 0}\nYorum: ${post.replies || 0}\nTarih: ${new Date(post.created_at).toLocaleString('tr-TR')}`);
        }
    } catch (error) {
        alert('Keklik detayları yüklenemedi');
    }
}

async function deletePost(postId) {
    if (!confirm('Bu kekliği silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`/api/admin/posts/${postId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Keklik silindi');
            loadPosts();
        } else {
            alert(data.error || 'Keklik silinemedi');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}

// Trends
let trendsData = [];

async function loadTrends() {
    try {
        const response = await fetch('/api/admin/trends');
        trendsData = await response.json();
        
        const grid = document.getElementById('trendsGrid');
        grid.innerHTML = trendsData.map(trend => `
            <div class="trend-card">
                <div class="card-actions">
                    <button class="btn-icon btn-edit" onclick="editTrend(${trend.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-remove" onclick="deleteTrend(${trend.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="trend-category">${trend.category}</div>
                <div class="trend-title" style="font-size: 18px; font-weight: 700; margin: 8px 0;">${trend.title}</div>
                <div class="trend-count" style="color: var(--text-secondary);">${trend.count}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Trends load error:', error);
        trendsData = [];
        document.getElementById('trendsGrid').innerHTML = '<p style="color: var(--text-secondary);">Henüz trend eklenmemiş</p>';
    }
}

function openTrendModal(trendId = null) {
    const modal = document.getElementById('trendModal');
    const title = document.getElementById('trendModalTitle');
    
    if (trendId) {
        const trend = trendsData.find(t => t.id === trendId);
        title.textContent = 'Trend Düzenle';
        document.getElementById('trendId').value = trend.id;
        document.getElementById('trendCategory').value = trend.category;
        document.getElementById('trendTitle').value = trend.title;
        document.getElementById('trendCount').value = trend.count;
    } else {
        title.textContent = 'Yeni Trend Ekle';
        document.getElementById('trendForm').reset();
        document.getElementById('trendId').value = '';
    }
    
    modal.classList.add('active');
}

function closeTrendModal() {
    document.getElementById('trendModal').classList.remove('active');
}

function editTrend(id) {
    openTrendModal(id);
}

async function saveTrend() {
    const id = document.getElementById('trendId').value;
    const category = document.getElementById('trendCategory').value;
    const title = document.getElementById('trendTitle').value;
    const count = document.getElementById('trendCount').value;
    
    if (!category || !title || !count) {
        alert('Tüm alanları doldurun');
        return;
    }
    
    try {
        const url = id ? `/api/admin/trends/${id}` : '/api/admin/trends';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, title, count })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(id ? 'Trend güncellendi' : 'Trend eklendi');
            closeTrendModal();
            loadTrends();
        } else {
            alert(data.error || 'İşlem başarısız');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}

async function deleteTrend(id) {
    if (!confirm('Bu trendi silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`/api/admin/trends/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Trend silindi');
            loadTrends();
        } else {
            alert(data.error || 'Trend silinemedi');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}

// Suggestions
let suggestionsData = [];

async function loadSuggestions() {
    try {
        const response = await fetch('/api/admin/suggestions');
        suggestionsData = await response.json();
        
        const grid = document.getElementById('suggestionsGrid');
        grid.innerHTML = suggestionsData.map(sug => `
            <div class="suggestion-card">
                <div class="card-actions">
                    <button class="btn-icon btn-edit" onclick="editSuggestion(${sug.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-remove" onclick="deleteSuggestion(${sug.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 32px;">
                    <img src="${sug.avatar || '/iks.png'}" style="width: 48px; height: 48px; border-radius: 50%;" onerror="this.src='/iks.png'">
                    <div>
                        <div style="font-weight: 700;">${sug.name}</div>
                        <div style="color: var(--text-secondary);">@${sug.username}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Suggestions load error:', error);
        suggestionsData = [];
        document.getElementById('suggestionsGrid').innerHTML = '<p style="color: var(--text-secondary);">Henüz öneri eklenmemiş</p>';
    }
}

function openSuggestionModal(suggestionId = null) {
    const modal = document.getElementById('suggestionModal');
    const title = document.getElementById('suggestionModalTitle');
    
    if (suggestionId) {
        const sug = suggestionsData.find(s => s.id === suggestionId);
        title.textContent = 'Öneri Düzenle';
        document.getElementById('suggestionId').value = sug.id;
        document.getElementById('suggestionUsername').value = sug.username;
        document.getElementById('suggestionName').value = sug.name;
        document.getElementById('suggestionAvatar').value = sug.avatar || '';
    } else {
        title.textContent = 'Yeni Öneri Ekle';
        document.getElementById('suggestionForm').reset();
        document.getElementById('suggestionId').value = '';
    }
    
    modal.classList.add('active');
}

function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('active');
}

function editSuggestion(id) {
    openSuggestionModal(id);
}

async function saveSuggestion() {
    const id = document.getElementById('suggestionId').value;
    const username = document.getElementById('suggestionUsername').value.replace('@', '');
    const name = document.getElementById('suggestionName').value;
    const avatar = document.getElementById('suggestionAvatar').value;
    
    if (!username || !name) {
        alert('Kullanıcı adı ve görünen ad zorunludur');
        return;
    }
    
    try {
        const url = id ? `/api/admin/suggestions/${id}` : '/api/admin/suggestions';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, avatar })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(id ? 'Öneri güncellendi' : 'Öneri eklendi');
            closeSuggestionModal();
            loadSuggestions();
        } else {
            alert(data.error || 'İşlem başarısız');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}

async function deleteSuggestion(id) {
    if (!confirm('Bu öneriyi silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`/api/admin/suggestions/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Öneri silindi');
            loadSuggestions();
        } else {
            alert(data.error || 'Öneri silinemedi');
        }
    } catch (error) {
        alert('Bir hata oluştu');
    }
}
