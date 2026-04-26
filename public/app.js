// Global state
let currentUser = null;
let selectedMedia = null;
let currentConversation = null;
let isGuest = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initEventListeners();
});

// Check authentication
function checkAuth() {
    const savedUser = localStorage.getItem('iksUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isGuest = false;
        hideGuestBanner();
        showMainApp();
        showUserSpecificElements();
        loadUserData();
        loadFeed();
    } else {
        // Misafir modunu etkinleştir
        enableGuestMode();
    }
}

function enableGuestMode() {
    isGuest = true;
    showMainApp();
    showGuestBanner();
    loadPublicFeed();
    hideUserSpecificElements();
}

function showGuestBanner() {
    document.getElementById('guestBanner').style.display = 'block';
    document.body.style.paddingTop = '80px';
}

function hideGuestBanner() {
    document.getElementById('guestBanner').style.display = 'none';
    document.body.style.paddingTop = '0';
}

function hideUserSpecificElements() {
    // Giriş yapmamış kullanıcılar için bazı elementleri gizle
    const elementsToHide = [
        '.new-keklik-box',
        '.btn-keklik',
        '#messagesPage .nav-item[data-route="messages"]',
        '#notificationsPage .nav-item[data-route="notifications"]',
        '#bookmarksPage .nav-item[data-route="bookmarks"]'
    ];
    
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = 'none';
    });
}

function showUserSpecificElements() {
    // Giriş yapmış kullanıcılar için elementleri göster
    const elementsToShow = [
        '.new-keklik-box',
        '.btn-keklik',
        '.nav-item[data-route="messages"]',
        '.nav-item[data-route="notifications"]',
        '.nav-item[data-route="bookmarks"]'
    ];
    
    elementsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = '';
    });
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'grid';
}

// Event Listeners
function initEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tabName + 'Form').classList.add('active');
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.dataset.route;
            navigateTo(route);
        });
    });

    // New Keklik
    document.getElementById('newKeklikBtn')?.addEventListener('click', () => {
        document.getElementById('newKeklikModal').classList.add('active');
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Post buttons
    document.getElementById('postKeklikBtn')?.addEventListener('click', postKeklik);
    document.getElementById('modalPostBtn')?.addEventListener('click', postKeklikFromModal);

    // Media upload
    document.getElementById('mediaUpload')?.addEventListener('change', handleMediaUpload);
    document.getElementById('modalMediaUpload')?.addEventListener('change', handleModalMediaUpload);

    // Theme toggle
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            changeTheme(theme);
        });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Search
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);

    // Profile edit
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        openEditProfileModal();
    });

    // Settings buttons
    document.getElementById('changeEmailBtn')?.addEventListener('click', () => {
        document.getElementById('changeEmailModal').classList.add('active');
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        document.getElementById('changePasswordModal').classList.add('active');
    });

    document.getElementById('changeUsernameBtn')?.addEventListener('click', () => {
        document.getElementById('changeUsernameModal').classList.add('active');
    });

    // Save buttons
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('saveEmailBtn')?.addEventListener('click', saveEmail);
    document.getElementById('savePasswordBtn')?.addEventListener('click', savePassword);
    document.getElementById('saveUsernameBtn')?.addEventListener('click', saveUsername);

    // Delete account
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
        document.getElementById('deleteAccountModal').classList.add('active');
    });
    
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', deleteAccount);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        document.getElementById('deleteAccountModal').classList.remove('active');
    });

    // Cancel buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.id.includes('cancel') || btn.id.includes('Cancel')) {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        }
    });

    // Guest banner buttons
    document.getElementById('guestLoginBtn')?.addEventListener('click', () => {
        showAuthScreen();
    });

    document.getElementById('guestRegisterBtn')?.addEventListener('click', () => {
        showAuthScreen();
        document.querySelector('[data-tab="register"]').click();
    });
}

// Auth handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('iksUser', JSON.stringify(data.user));
            isGuest = false;
            hideGuestBanner();
            showMainApp();
            showUserSpecificElements();
            loadUserData();
            loadFeed();
            showNotification('Başarıyla giriş yaptınız!', 'success');
        } else {
            alert(data.error || 'Giriş başarısız');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Giriş yapılırken bir hata oluştu');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const display_name = document.getElementById('regDisplayName').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, display_name, password })
        });

        const data = await response.json();
        
        if (data.success) {
            if (data.autoLogin && data.user) {
                // Otomatik giriş yap
                currentUser = data.user;
                localStorage.setItem('iksUser', JSON.stringify(data.user));
                isGuest = false;
                hideGuestBanner();
                showMainApp();
                showUserSpecificElements();
                loadUserData();
                loadFeed();
                showNotification('Kayıt başarılı! Hoş geldiniz!', 'success');
            } else {
                showNotification('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success');
                document.querySelector('[data-tab="login"]').click();
            }
        } else {
            showNotification(data.error || 'Kayıt başarısız', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Kayıt olurken bir hata oluştu');
    }
}

function logout() {
    localStorage.removeItem('iksUser');
    currentUser = null;
    isGuest = false;
    hideGuestBanner();
    showAuthScreen();
}

// Navigation
function navigateTo(route) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-route="${route}"]`).classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(route + 'Page').classList.add('active');

    // Load page specific data
    switch(route) {
        case 'home':
            loadFeed();
            break;
        case 'messages':
            loadConversations();
            break;
        case 'profile':
            loadUserProfile();
            break;
    }
}

// Load user data
function loadUserData() {
    if (!currentUser) return;

    // Update sidebar user info
    const sidebarUser = document.getElementById('sidebarUser');
    sidebarUser.querySelector('.user-name').textContent = currentUser.display_name;
    sidebarUser.querySelector('.user-username').textContent = '@' + currentUser.username;
    
    if (currentUser.profile_image) {
        sidebarUser.querySelector('.user-avatar').src = currentUser.profile_image;
    } else {
        sidebarUser.querySelector('.user-avatar').src = '/uploads/teatube.svg';
    }

    // Update new iks box avatar
    const newIksAvatar = document.querySelector('.new-iks-box .user-avatar');
    if (newIksAvatar) {
        newIksAvatar.src = currentUser.profile_image || '/uploads/teatube.svg';
    }

    // Apply saved theme
    if (currentUser.theme) {
        applyTheme(currentUser.theme);
    }
}

// Feed functions
async function loadFeed() {
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = '';

        if (posts.length === 0) {
            feedContainer.innerHTML = '<div class="empty-state"><i class="fas fa-comment"></i><p>Henüz hiç keklik yok. İlk kekliği sen paylaş!</p></div>';
            return;
        }

        posts.forEach(post => {
            feedContainer.appendChild(createPostElement(post));
        });
    } catch (error) {
        console.error('Feed load error:', error);
    }
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post.id;

    const timeAgo = getTimeAgo(post.created_at);
    
    // Process hashtags and mentions
    let processedContent = post.content
        .replace(/#(\S+)/g, '<span class="hashtag">#$1</span>')  // # ile başlayan tüm kelimeyi al
        .replace(/@(\w+)/g, '<a href="/$1" class="mention" onclick="event.preventDefault(); openUserProfile(\'$1\')">@$1</a>');  // @ ile etiketleme

    const isOwner = currentUser && currentUser.id === post.user_id;

    postDiv.innerHTML = `
        <img src="${post.profile_image || '/iks.png'}" alt="Profile" class="post-avatar" onclick="openUserProfile('${post.username}')">
        <div class="post-content">
            <div class="post-header">
                <span class="post-name" onclick="openUserProfile('${post.username}')" style="cursor: pointer;">${post.display_name}</span>
                <span class="post-username" onclick="openUserProfile('${post.username}')" style="cursor: pointer;">@${post.username}</span>
                <span class="post-time">· ${timeAgo}</span>
                ${isOwner ? `
                    <div class="post-menu" style="margin-left: auto;">
                        <button class="post-menu-btn" onclick="togglePostMenu(${post.id})">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="post-menu-dropdown" id="menu-${post.id}">
                            <button class="post-menu-item" onclick="editPost(${post.id}, '${post.content.replace(/'/g, "\\'")}')">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                            <button class="post-menu-item danger" onclick="deletePost(${post.id})">
                                <i class="fas fa-trash"></i> Sil
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="post-text">${processedContent}</div>
            ${post.media_url ? `
                <div class="post-media">
                    ${post.media_type === 'video' 
                        ? `<video controls><source src="${post.media_url}" type="video/mp4"></video>`
                        : `<img src="${post.media_url}" alt="Post media">`
                    }
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="post-action comment-btn" data-post-id="${post.id}">
                    <i class="far fa-comment"></i>
                    <span>${post.replies || 0}</span>
                </button>
                <button class="post-action">
                    <i class="fas fa-retweet"></i>
                    <span>${post.retweets || 0}</span>
                </button>
                <button class="post-action like-btn" data-post-id="${post.id}">
                    <i class="far fa-heart"></i>
                    <span>${post.likes || 0}</span>
                </button>
                <button class="post-action">
                    <i class="far fa-bookmark"></i>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comment-input">
                    <input type="text" placeholder="Yorumunu yaz..." id="comment-input-${post.id}">
                    <button onclick="postComment(${post.id})">Gönder</button>
                </div>
                <div id="comments-list-${post.id}"></div>
            </div>
        </div>
    `;

    // Like button handler
    postDiv.querySelector('.like-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        likePost(post.id);
    });

    // Comment button handler
    postDiv.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleComments(post.id);
    });

    return postDiv;
}

// Toggle post menu
function togglePostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    // Close all other menus
    document.querySelectorAll('.post-menu-dropdown').forEach(m => {
        if (m.id !== `menu-${postId}`) m.classList.remove('active');
    });
    menu.classList.toggle('active');
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.post-menu')) {
        document.querySelectorAll('.post-menu-dropdown').forEach(m => {
            m.classList.remove('active');
        });
    }
});

// Delete post
async function deletePost(postId) {
    if (!confirm('Bu kekliği silmek istediğinden emin misin?')) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });

        const data = await response.json();
        
        if (data.success) {
            loadFeed();
        } else {
            alert(data.error || 'Keklik silinemedi');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Keklik silinirken bir hata oluştu');
    }
}

// Edit post
async function editPost(postId, currentContent) {
    const newContent = prompt('Kekliği düzenle:', currentContent);
    if (!newContent || newContent === currentContent) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: currentUser.id,
                content: newContent
            })
        });

        const data = await response.json();
        
        if (data.success) {
            loadFeed();
        } else {
            alert(data.error || 'Keklik düzenlenemedi');
        }
    } catch (error) {
        console.error('Edit error:', error);
        alert('Keklik düzenlenirken bir hata oluştu');
    }
}

// Toggle comments
async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';
    
    if (isVisible) {
        commentsSection.style.display = 'none';
    } else {
        commentsSection.style.display = 'block';
        await loadComments(postId);
    }
}

// Load comments
async function loadComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const comments = await response.json();
        
        const commentsList = document.getElementById(`comments-list-${postId}`);
        commentsList.innerHTML = '';
        
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            commentDiv.innerHTML = `
                <img src="${comment.profile_image || '/uploads/teatube.svg'}" alt="Profile" class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-name">${comment.display_name}</span>
                        <span class="comment-username">@${comment.username}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                </div>
            `;
            commentsList.appendChild(commentDiv);
        });
    } catch (error) {
        console.error('Load comments error:', error);
    }
}

// Post comment
async function postComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                content: content
            })
        });

        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            await loadComments(postId);
            loadFeed(); // Refresh to update comment count
        } else {
            alert(data.error || 'Yorum gönderilemedi');
        }
    } catch (error) {
        console.error('Post comment error:', error);
        alert('Yorum gönderilirken bir hata oluştu');
    }
}

async function postIks() {
    const content = document.getElementById('newIksText').value.trim();
    
    if (!content && !selectedMedia) {
        alert('İks içeriği boş olamaz!');
        return;
    }

    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('content', content);
    
    if (selectedMedia) {
        formData.append('media', selectedMedia);
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('newIksText').value = '';
            document.getElementById('mediaPreview').innerHTML = '';
            selectedMedia = null;
            loadFeed();
        } else {
            alert('İks paylaşılamadı');
        }
    } catch (error) {
        console.error('Post error:', error);
        alert('İks paylaşılırken bir hata oluştu');
    }
}

async function postIksFromModal() {
    const content = document.getElementById('modalIksText').value.trim();
    
    if (!content && !selectedMedia) {
        alert('İks içeriği boş olamaz!');
        return;
    }

    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('content', content);
    
    if (selectedMedia) {
        formData.append('media', selectedMedia);
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('modalIksText').value = '';
            document.getElementById('modalMediaPreview').innerHTML = '';
            selectedMedia = null;
            document.getElementById('newIksModal').classList.remove('active');
            loadFeed();
        } else {
            alert('İks paylaşılamadı');
        }
    } catch (error) {
        console.error('Post error:', error);
        alert('İks paylaşılırken bir hata oluştu');
    }
}

function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedMedia = file;
    const preview = document.getElementById('mediaPreview');
    const reader = new FileReader();

    reader.onload = (e) => {
        const isVideo = file.type.startsWith('video');
        preview.innerHTML = `
            ${isVideo 
                ? `<video controls><source src="${e.target.result}" type="${file.type}"></video>`
                : `<img src="${e.target.result}" alt="Preview">`
            }
            <button class="remove-media" onclick="removeMedia()">×</button>
        `;
    };

    reader.readAsDataURL(file);
}

function handleModalMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedMedia = file;
    const preview = document.getElementById('modalMediaPreview');
    const reader = new FileReader();

    reader.onload = (e) => {
        const isVideo = file.type.startsWith('video');
        preview.innerHTML = `
            ${isVideo 
                ? `<video controls><source src="${e.target.result}" type="${file.type}"></video>`
                : `<img src="${e.target.result}" alt="Preview">`
            }
            <button class="remove-media" onclick="removeMedia('modal')">×</button>
        `;
    };

    reader.readAsDataURL(file);
}

function removeMedia(type = 'main') {
    selectedMedia = null;
    if (type === 'modal') {
        document.getElementById('modalMediaPreview').innerHTML = '';
        document.getElementById('modalMediaUpload').value = '';
    } else {
        document.getElementById('mediaPreview').innerHTML = '';
        document.getElementById('mediaUpload').value = '';
    }
}

async function likePost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });

        const data = await response.json();
        
        if (data.success) {
            loadFeed();
        }
    } catch (error) {
        console.error('Like error:', error);
    }
}

// Messages
async function loadConversations() {
    try {
        const response = await fetch(`/api/messages/${currentUser.id}`);
        const conversations = await response.json();
        
        const container = document.getElementById('conversationsList');
        container.innerHTML = '<div class="page-header"><h1>Mesajlar</h1></div>';

        conversations.forEach(conv => {
            const convDiv = document.createElement('div');
            convDiv.className = 'conversation-item';
            convDiv.innerHTML = `
                <img src="${conv.profile_image || '/uploads/teatube.svg'}" alt="Profile" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${conv.display_name}</div>
                    <div class="user-username">${conv.last_message || ''}</div>
                </div>
            `;
            convDiv.addEventListener('click', () => openConversation(conv.other_user_id, conv));
            container.appendChild(convDiv);
        });
    } catch (error) {
        console.error('Conversations load error:', error);
    }
}

async function openConversation(userId, userData) {
    currentConversation = userId;
    
    // Update header
    const header = document.getElementById('messageHeader');
    header.style.display = 'flex';
    header.querySelector('.user-name').textContent = userData.display_name;
    header.querySelector('.user-avatar').src = userData.profile_image || '/uploads/teatube.svg';

    // Show input
    document.getElementById('messageInput').style.display = 'flex';

    // Load messages
    try {
        const response = await fetch(`/api/messages/${currentUser.id}/${userId}`);
        const messages = await response.json();
        
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message-bubble ${msg.sender_id === currentUser.id ? 'message-sent' : 'message-received'}`;
            msgDiv.textContent = msg.content;
            container.appendChild(msgDiv);
        });

        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Messages load error:', error);
    }

    // Send message handler
    document.getElementById('sendMessageBtn').onclick = sendMessage;
    document.getElementById('newMessageText').onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
}

async function sendMessage() {
    const content = document.getElementById('newMessageText').value.trim();
    if (!content || !currentConversation) return;

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: currentUser.id,
                receiver_id: currentConversation,
                content: content
            })
        });

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('newMessageText').value = '';
            // Reload conversation
            const userData = { display_name: document.querySelector('#messageHeader .user-name').textContent };
            openConversation(currentConversation, userData);
        }
    } catch (error) {
        console.error('Send message error:', error);
    }
}

// Profile
async function loadUserProfile() {
    try {
        const response = await fetch(`/api/posts?user_id=${currentUser.id}`);
        const posts = await response.json();
        
        // Update profile info
        document.querySelector('.profile-name').textContent = currentUser.display_name;
        document.querySelector('.profile-username').textContent = '@' + currentUser.username;
        document.querySelector('.profile-bio').textContent = currentUser.bio || 'Bio henüz eklenmedi';
        
        if (currentUser.profile_image) {
            document.querySelector('.profile-avatar').src = currentUser.profile_image;
        } else {
            document.querySelector('.profile-avatar').src = '/uploads/teatube.svg';
        }

        // Load user posts
        const container = document.getElementById('userPostsContainer');
        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comment"></i><p>Henüz hiç iks paylaşmadın</p></div>';
            return;
        }

        posts.forEach(post => {
            container.appendChild(createPostElement(post));
        });
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Search
let searchTimeout;
async function handleSearch(e) {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const users = await response.json();
            
            const container = document.getElementById('searchResults');
            container.innerHTML = '';

            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-result';
                userDiv.innerHTML = `
                    <img src="${user.profile_image || '/uploads/teatube.svg'}" alt="Profile" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${user.display_name}</div>
                        <div class="user-username">@${user.username}</div>
                    </div>
                `;
                container.appendChild(userDiv);
            });
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Theme
function changeTheme(theme) {
    applyTheme(theme);
    
    // Save to database
    if (currentUser) {
        fetch(`/api/user/${currentUser.id}/theme`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme })
        });
        
        currentUser.theme = theme;
        localStorage.setItem('iksUser', JSON.stringify(currentUser));
    }
}

function applyTheme(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

// Utility functions
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d`;
    if (diffHours < 24) return `${diffHours}s`;
    if (diffDays < 7) return `${diffDays}g`;
    
    return past.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// Profile Management Functions
function openEditProfileModal() {
    if (!currentUser) return;
    
    document.getElementById('editDisplayName').value = currentUser.display_name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editProfileModal').classList.add('active');
}

async function saveProfile() {
    if (!currentUser) return;
    
    const formData = new FormData();
    const displayName = document.getElementById('editDisplayName').value;
    const bio = document.getElementById('editBio').value;
    const profileImage = document.getElementById('editProfileImage').files[0];
    const coverImage = document.getElementById('editCoverImage').files[0];
    
    if (displayName) formData.append('display_name', displayName);
    if (bio !== undefined) formData.append('bio', bio);
    if (profileImage) formData.append('profile_image', profileImage);
    if (coverImage) formData.append('cover_image', coverImage);
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/profile`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Profil başarıyla güncellendi!', 'success');
            document.getElementById('editProfileModal').classList.remove('active');
            loadUserData();
        } else {
            showNotification(data.error || 'Profil güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

async function saveEmail() {
    if (!currentUser) return;
    
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('emailPassword').value;
    
    if (!email || !password) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/email`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Email başarıyla güncellendi!', 'success');
            document.getElementById('changeEmailModal').classList.remove('active');
            currentUser.email = email;
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
        } else {
            showNotification(data.error || 'Email güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

async function savePassword() {
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Yeni şifreler eşleşmiyor', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Yeni şifre en az 6 karakter olmalı', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Şifre başarıyla güncellendi!', 'success');
            document.getElementById('changePasswordModal').classList.remove('active');
            // Clear form
            document.getElementById('changePasswordForm').reset();
        } else {
            showNotification(data.error || 'Şifre güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

async function saveUsername() {
    if (!currentUser) return;
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('usernamePassword').value;
    
    if (!username || !password) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Kullanıcı adı en az 3 karakter olmalı', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/username`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Kullanıcı adı başarıyla güncellendi! ${data.remainingChanges} hakkınız kaldı.`, 'success');
            document.getElementById('changeUsernameModal').classList.remove('active');
            currentUser.username = username;
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
            loadUserData();
        } else {
            showNotification(data.error || 'Kullanıcı adı güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

async function saveUsername() {
    if (!currentUser) return;
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('usernamePassword').value;
    
    if (!username || !password) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Kullanıcı adı en az 3 karakter olmalı', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/username`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Kullanıcı adı başarıyla güncellendi! ${data.remainingChanges} hakkınız kaldı.`, 'success');
            document.getElementById('changeUsernameModal').classList.remove('active');
            currentUser.username = username;
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
            loadUserData();
        } else {
            showNotification(data.error || 'Kullanıcı adı güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Delete account
async function deleteAccount() {
    if (!currentUser) return;
    
    const username = document.getElementById('deleteUsername').value;
    const password = document.getElementById('deletePassword').value;
    
    if (!username || !password) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    if (username !== currentUser.username) {
        showNotification('Kullanıcı adı eşleşmiyor', 'error');
        return;
    }
    
    if (!confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Hesabınız başarıyla silindi. Hoşça kalın!', 'success');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showNotification(data.error || 'Hesap silinemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Follow/Unfollow user
async function toggleFollow(userId) {
    if (!currentUser) {
        showNotification('Takip etmek için giriş yapın', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                follower_id: currentUser.id,
                following_id: userId
            })
        });
        
        const data = await response.json();
        if (data.success) {
            const followBtn = document.getElementById('followBtn');
            if (data.action === 'followed') {
                followBtn.textContent = 'Takip Ediliyor';
                followBtn.classList.add('following');
                showNotification('Kullanıcı takip edildi', 'success');
            } else {
                followBtn.textContent = 'Takip Et';
                followBtn.classList.remove('following');
                showNotification('Takipten çıkıldı', 'success');
            }
            // Takipçi sayısını güncelle
            loadFollowCounts(userId);
        } else {
            showNotification(data.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Load follow counts
async function loadFollowCounts(userId) {
    try {
        const response = await fetch(`/api/follow/counts/${userId}`);
        const data = await response.json();
        
        document.getElementById('userFollowersCount').textContent = data.followers;
        document.getElementById('userFollowingCount').textContent = data.following;
    } catch (error) {
        console.error('Error loading follow counts:', error);
    }
}

// Check follow status
async function checkFollowStatus(userId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/follow/status/${currentUser.id}/${userId}`);
        const data = await response.json();
        
        const followBtn = document.getElementById('followBtn');
        if (data.isFollowing) {
            followBtn.textContent = 'Takip Ediliyor';
            followBtn.classList.add('following');
        } else {
            followBtn.textContent = 'Takip Et';
            followBtn.classList.remove('following');
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

// Search and Profile Functions
async function handleSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const users = await response.json();
        
        resultsContainer.innerHTML = users.map(user => `
            <div class="user-result" onclick="openUserProfile('${user.username}')">
                <img src="${user.profile_image || '/iks.png'}" alt="${user.display_name}">
                <div class="user-result-info">
                    <div class="user-result-name">${user.display_name}</div>
                    <div class="user-result-username">@${user.username}</div>
                    ${user.bio ? `<div class="user-result-bio">${user.bio}</div>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Search error:', error);
    }
}

async function openUserProfile(username) {
    // Direkt profil sayfasına yönlendir
    navigateTo('userProfile', username);
}

async function loadUserPosts(userId) {
    try {
        const response = await fetch(`/api/posts?user_id=${userId}`);
        const posts = await response.json();
        
        const container = document.getElementById('modalUserPosts');
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Henüz hiç keklik paylaşılmamış</p></div>';
            return;
        }
        
        container.innerHTML = posts.map(post => createPostHTML(post)).join('');
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

// Public feed for guests
async function loadPublicFeed() {
    try {
        const response = await fetch('/api/posts/public');
        const posts = await response.json();
        
        const feedContainer = document.getElementById('feedContainer');
        if (posts.length === 0) {
            feedContainer.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Henüz hiç keklik yok</p></div>';
            return;
        }
        
        feedContainer.innerHTML = posts.map(post => createPostHTML(post, true)).join('');
        
        // Add click listeners for profile viewing
        addProfileClickListeners();
    } catch (error) {
        console.error('Error loading public feed:', error);
    }
}

function addProfileClickListeners() {
    // Post avatars and names
    document.querySelectorAll('.post-avatar, .post-name').forEach(element => {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const username = element.closest('.post').dataset.username;
            if (username) {
                openUserProfile(username);
            }
        });
    });
}

function createPostHTML(post, isPublic = false) {
    const timeAgo = getTimeAgo(post.created_at);
    const actionsHTML = isPublic ? '' : `
        <div class="post-actions">
            <button class="post-action" onclick="toggleLike(${post.id})">
                <i class="fas fa-heart"></i>
                <span>${post.likes || 0}</span>
            </button>
            <button class="post-action" onclick="toggleComments(${post.id})">
                <i class="fas fa-comment"></i>
                <span>${post.replies || 0}</span>
            </button>
            <button class="post-action">
                <i class="fas fa-retweet"></i>
                <span>${post.retweets || 0}</span>
            </button>
            <button class="post-action">
                <i class="fas fa-share"></i>
            </button>
        </div>
    `;
    
    return `
        <div class="post" data-username="${post.username}">
            <img src="${post.profile_image || '/iks.png'}" alt="${post.display_name}" class="post-avatar">
            <div class="post-content">
                <div class="post-header">
                    <span class="post-name">${post.display_name}</span>
                    <span class="post-username">@${post.username}</span>
                    <span class="post-time">${timeAgo}</span>
                </div>
                <div class="post-text">${formatPostText(post.content)}</div>
                ${post.media_url ? `
                    <div class="post-media">
                        ${post.media_type === 'video' ? 
                            `<video controls><source src="${post.media_url}" type="video/mp4"></video>` :
                            `<img src="${post.media_url}" alt="Post media">`
                        }
                    </div>
                ` : ''}
                ${actionsHTML}
            </div>
        </div>
    `;
}

function formatPostText(text) {
    return text
        .replace(/#(\S+)/g, '<span class="hashtag">#$1</span>')  // # ile başlayan tüm kelimeyi al
        .replace(/@(\w+)/g, '<a href="/$1" class="mention" onclick="event.preventDefault(); openUserProfile(\'$1\')">@$1</a>');  // @ ile etiketleme
}

function getTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return 'şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}g`;
    return postDate.toLocaleDateString('tr-TR');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Update existing functions to handle guest mode
window.loadFeed = function() {
    if (isGuest) {
        loadPublicFeed();
    } else {
        loadFeed();
    }
};

// Keklik posting functions
async function postKeklik() {
    const content = document.getElementById('newKeklikText').value.trim();
    if (!content && !selectedMedia) {
        showNotification('Keklik içeriği boş olamaz', 'error');
        return;
    }
    
    await submitKeklik(content, selectedMedia, 'newKeklikText', 'mediaPreview');
}

async function postKeklikFromModal() {
    const content = document.getElementById('modalKeklikText').value.trim();
    if (!content && !selectedMedia) {
        showNotification('Keklik içeriği boş olamaz', 'error');
        return;
    }
    
    await submitKeklik(content, selectedMedia, 'modalKeklikText', 'modalMediaPreview');
    document.getElementById('newKeklikModal').classList.remove('active');
}

async function submitKeklik(content, media, textElementId, previewElementId) {
    if (!currentUser) {
        showNotification('Keklik paylaşmak için giriş yapın', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('content', content);
    
    if (media) {
        formData.append('media', media);
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Keklik başarıyla paylaşıldı!', 'success');
            document.getElementById(textElementId).value = '';
            document.getElementById(previewElementId).innerHTML = '';
            selectedMedia = null;
            loadFeed();
        } else {
            showNotification(data.error || 'Keklik paylaşılamadı', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Navigation function
function navigateTo(route, param = null) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`[data-route="${route}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    let targetPage;
    if (route === 'userProfile') {
        targetPage = document.getElementById('userProfilePage');
        if (param) {
            loadUserProfilePage(param);
        }
    } else {
        targetPage = document.getElementById(route + 'Page');
    }
    
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page-specific content
        switch(route) {
            case 'home':
                if (isGuest) {
                    loadPublicFeed();
                } else {
                    loadFeed();
                }
                break;
            case 'profile':
                if (currentUser) {
                    loadUserProfile();
                }
                break;
            case 'messages':
                if (currentUser) {
                    loadConversations();
                }
                break;
            case 'notifications':
                if (currentUser) {
                    loadNotifications();
                }
                break;
            case 'bookmarks':
                if (currentUser) {
                    loadBookmarks();
                }
                break;
        }
    }
    
    // Update URL without page reload
    let newUrl;
    if (route === 'userProfile' && param) {
        newUrl = `/${param}`;
    } else {
        newUrl = route === 'home' ? '/' : `/${route}`;
    }
    window.history.pushState({route, param}, '', newUrl);
}

// Load user profile page
async function loadUserProfilePage(username) {
    try {
        const response = await fetch(`/api/user/profile/${username}`);
        const user = await response.json();
        
        if (user.error) {
            showNotification('Kullanıcı bulunamadı', 'error');
            navigateTo('home');
            return;
        }
        
        // Update page title
        document.getElementById('userProfileTitle').textContent = user.display_name;
        
        // Update profile info
        document.getElementById('userProfileName').textContent = user.display_name;
        document.getElementById('userProfileUsername').textContent = `@${user.username}`;
        document.getElementById('userProfileBio').textContent = user.bio || 'Bio eklenmemiş';
        
        // Set profile image with fallback
        const profileImg = document.getElementById('userProfileAvatar');
        profileImg.src = user.profile_image || '/iks.png';
        profileImg.onerror = function() {
            this.src = '/iks.png';
        };
        
        // Set cover image
        const coverDiv = document.getElementById('userProfileCover');
        if (user.cover_image) {
            coverDiv.style.backgroundImage = `url(${user.cover_image})`;
            coverDiv.style.backgroundSize = 'cover';
            coverDiv.style.backgroundPosition = 'center';
        } else {
            coverDiv.style.backgroundImage = '';
            coverDiv.style.background = 'var(--gradient-primary)';
        }
        
        // Set join date
        const joinDate = new Date(user.created_at);
        document.getElementById('userJoinDate').textContent = 
            joinDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) + ' tarihinde katıldı';
        
        // Show/hide action buttons
        if (currentUser && currentUser.username !== username) {
            const followBtn = document.getElementById('followBtn');
            followBtn.style.display = 'block';
            followBtn.onclick = () => toggleFollow(user.id);
            
            document.getElementById('messageBtn').style.display = 'block';
            
            // Check follow status
            checkFollowStatus(user.id);
        } else {
            document.getElementById('followBtn').style.display = 'none';
            document.getElementById('messageBtn').style.display = 'none';
        }
        
        // Load follow counts
        loadFollowCounts(user.id);
        
        // Load user posts
        loadUserProfilePosts(user.id);
        
        // Update post count in subtitle
        const postsResponse = await fetch(`/api/posts?user_id=${user.id}`);
        const posts = await postsResponse.json();
        document.getElementById('userProfileSubtitle').textContent = `${posts.length} Keklik`;
        
    } catch (error) {
        showNotification('Profil yüklenemedi', 'error');
        navigateTo('home');
    }
}

async function loadUserProfilePosts(userId) {
    try {
        const response = await fetch(`/api/posts?user_id=${userId}`);
        const posts = await response.json();
        
        const container = document.getElementById('userProfilePosts');
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Henüz hiç keklik paylaşılmamış</p></div>';
            return;
        }
        
        container.innerHTML = posts.map(post => createPostHTML(post)).join('');
        addProfileClickListeners();
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

// Load user profile
function loadUserProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.display_name;
    document.getElementById('profileUsername').textContent = `@${currentUser.username}`;
    document.getElementById('profileBio').textContent = currentUser.bio || 'Bio eklenmemiş';
    document.getElementById('profileAvatar').src = currentUser.profile_image || '/iks.png';
    
    if (currentUser.cover_image) {
        document.getElementById('profileCover').style.backgroundImage = `url(${currentUser.cover_image})`;
    }
    
    // Show edit button for own profile
    document.getElementById('editProfileBtn').style.display = 'block';
    
    // Load user posts
    loadUserPosts(currentUser.id);
}

// Load conversations (placeholder)
function loadConversations() {
    const container = document.getElementById('conversationsList');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-envelope"></i><p>Henüz mesajınız yok</p></div>';
}

// Load notifications (placeholder)
function loadNotifications() {
    // Placeholder for notifications
}

// Load bookmarks (placeholder)
function loadBookmarks() {
    // Placeholder for bookmarks
}

// Media upload handlers
function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (file) {
        selectedMedia = file;
        showMediaPreview(file, 'mediaPreview');
    }
}

function handleModalMediaUpload(e) {
    const file = e.target.files[0];
    if (file) {
        selectedMedia = file;
        showMediaPreview(file, 'modalMediaPreview');
    }
}

function showMediaPreview(file, containerId) {
    const container = document.getElementById(containerId);
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const isVideo = file.type.startsWith('video/');
        container.innerHTML = `
            <div class="media-preview">
                ${isVideo ? 
                    `<video controls><source src="${e.target.result}" type="${file.type}"></video>` :
                    `<img src="${e.target.result}" alt="Preview">`
                }
                <button class="remove-media" onclick="removeMedia('${containerId}')">&times;</button>
            </div>
        `;
    };
    
    reader.readAsDataURL(file);
}

function removeMedia(containerId) {
    document.getElementById(containerId).innerHTML = '';
    selectedMedia = null;
}

// Theme management
function changeTheme(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    
    if (currentUser) {
        // Save theme preference to database
        fetch(`/api/user/${currentUser.id}/theme`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme })
        }).then(() => {
            currentUser.theme = theme;
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
            showNotification('Tema tercihiniz kaydedildi', 'success');
        });
    }
}

// Load user data
function loadUserData() {
    if (!currentUser) return;
    
    // Update sidebar user info
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) {
        sidebarUser.querySelector('.user-name').textContent = currentUser.display_name;
        sidebarUser.querySelector('.user-username').textContent = `@${currentUser.username}`;
        const avatarImg = sidebarUser.querySelector('.user-avatar');
        avatarImg.src = currentUser.profile_image || '/iks.png';
        avatarImg.onerror = function() {
            this.src = '/iks.png';
        };
    }
    
    // Update new post avatar
    const newPostAvatar = document.querySelector('.new-keklik-box .user-avatar');
    if (newPostAvatar) {
        newPostAvatar.src = currentUser.profile_image || '/iks.png';
        newPostAvatar.onerror = function() {
            this.src = '/iks.png';
        };
    }
    
    // Set theme
    if (currentUser.theme === 'light') {
        document.body.classList.add('light-theme');
        document.querySelector('[data-theme="light"]').classList.add('active');
        document.querySelector('[data-theme="dark"]').classList.remove('active');
    }
}

// Load feed function
async function loadFeed() {
    if (isGuest) {
        loadPublicFeed();
        return;
    }
    
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        const feedContainer = document.getElementById('feedContainer');
        if (posts.length === 0) {
            feedContainer.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>Henüz hiç keklik yok</p></div>';
            return;
        }
        
        feedContainer.innerHTML = posts.map(post => createPostHTML(post)).join('');
        addProfileClickListeners();
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    const route = e.state?.route || 'home';
    navigateTo(route);
});

// Initialize route on page load
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let route = 'home';
    
    if (path !== '/') {
        route = path.substring(1); // Remove leading slash
    }
    
    // Wait for auth check to complete
    setTimeout(() => {
        if (document.querySelector(`[data-route="${route}"]`)) {
            navigateTo(route);
        }
    }, 100);
});
// Profile menu event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Profile menu toggle
    document.getElementById('profileMenuBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('profileMenuDropdown');
        dropdown.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('profileMenuDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    });

    // Profile menu actions
    document.getElementById('copyLinkBtn')?.addEventListener('click', copyProfileLink);
    document.getElementById('shareProfileBtn')?.addEventListener('click', shareProfile);
    document.getElementById('muteUserBtn')?.addEventListener('click', muteUser);
    document.getElementById('blockUserBtn')?.addEventListener('click', blockUser);
    document.getElementById('reportUserBtn')?.addEventListener('click', reportUser);
    document.getElementById('editOwnProfileBtn')?.addEventListener('click', openEditProfileModal);
});

// Profile menu functions
function copyProfileLink() {
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    const profileUrl = `${window.location.origin}/${username}`;
    
    navigator.clipboard.writeText(profileUrl).then(() => {
        showNotification('Profil bağlantısı kopyalandı!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = profileUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Profil bağlantısı kopyalandı!', 'success');
    });
    
    document.getElementById('profileMenuDropdown').classList.remove('active');
}

function shareProfile() {
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    const displayName = document.getElementById('userProfileName').textContent;
    const profileUrl = `${window.location.origin}/${username}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${displayName} (@${username}) - Keklik'te`,
            text: `${displayName} adlı kullanıcının Keklik profilini inceleyin`,
            url: profileUrl
        });
    } else {
        copyProfileLink();
    }
    
    document.getElementById('profileMenuDropdown').classList.remove('active');
}

function muteUser() {
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    // TODO: Implement mute functionality
    showNotification(`@${username} hesabı sessize alındı`, 'success');
    document.getElementById('profileMenuDropdown').classList.remove('active');
}

function blockUser() {
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    if (confirm(`@${username} hesabını engellemek istediğinizden emin misiniz?`)) {
        // TODO: Implement block functionality
        showNotification(`@${username} hesabı engellendi`, 'success');
        document.getElementById('profileMenuDropdown').classList.remove('active');
    }
}

function reportUser() {
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    if (confirm(`@${username} hesabını şikayet etmek istediğinizden emin misiniz?`)) {
        // TODO: Implement report functionality
        showNotification(`@${username} hesabı şikayet edildi`, 'success');
        document.getElementById('profileMenuDropdown').classList.remove('active');
    }
}

// Update loadUserProfilePage function to handle new fields and menu
async function loadUserProfilePageUpdated(username) {
    try {
        const response = await fetch(`/api/user/profile/${username}`);
        const user = await response.json();
        
        if (user.error) {
            showNotification('Kullanıcı bulunamadı', 'error');
            navigateTo('home');
            return;
        }
        
        // Update page title
        document.getElementById('userProfileTitle').textContent = user.display_name;
        
        // Update profile info
        document.getElementById('userProfileName').textContent = user.display_name;
        document.getElementById('userProfileUsername').textContent = `@${user.username}`;
        document.getElementById('userProfileBio').textContent = user.bio || 'Bio eklenmemiş';
        
        // Update profile links
        const linksContainer = document.getElementById('userProfileLinks');
        linksContainer.innerHTML = '';
        
        if (user.website) {
            const websiteLink = document.createElement('a');
            websiteLink.href = user.website;
            websiteLink.target = '_blank';
            websiteLink.className = 'profile-link';
            websiteLink.innerHTML = `<i class="fas fa-link"></i> ${user.website.replace(/^https?:\/\//, '')}`;
            linksContainer.appendChild(websiteLink);
        }
        
        if (user.location) {
            const locationDiv = document.createElement('div');
            locationDiv.className = 'profile-link';
            locationDiv.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${user.location}`;
            linksContainer.appendChild(locationDiv);
        }
        
        // Set profile image with fallback
        const profileImg = document.getElementById('userProfileAvatar');
        profileImg.src = user.profile_image || '/iks.png';
        profileImg.onerror = function() {
            this.src = '/iks.png';
        };
        
        // Set cover image
        const coverDiv = document.getElementById('userProfileCover');
        if (user.cover_image) {
            coverDiv.style.backgroundImage = `url(${user.cover_image})`;
            coverDiv.style.backgroundSize = 'cover';
            coverDiv.style.backgroundPosition = 'center';
        } else {
            coverDiv.style.backgroundImage = '';
            coverDiv.style.background = 'var(--gradient-primary)';
        }
        
        // Set join date
        const joinDate = new Date(user.created_at);
        document.getElementById('userJoinDate').textContent = 
            joinDate.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) + ' tarihinde katıldı';
        
        // Update menu usernames
        document.getElementById('shareUsername').textContent = user.username;
        document.getElementById('muteUsername').textContent = user.username;
        document.getElementById('blockUsername').textContent = user.username;
        document.getElementById('reportUsername').textContent = user.username;
        
        // Show/hide action buttons based on ownership
        const isOwnProfile = currentUser && currentUser.username === username;
        
        if (isOwnProfile) {
            document.getElementById('editOwnProfileBtn').style.display = 'block';
            document.getElementById('followBtn').style.display = 'none';
            document.getElementById('messageBtn').style.display = 'none';
            document.getElementById('profileMenu').style.display = 'none';
        } else if (currentUser) {
            document.getElementById('editOwnProfileBtn').style.display = 'none';
            document.getElementById('followBtn').style.display = 'block';
            document.getElementById('messageBtn').style.display = 'block';
            document.getElementById('profileMenu').style.display = 'block';
        } else {
            // Guest user
            document.getElementById('editOwnProfileBtn').style.display = 'none';
            document.getElementById('followBtn').style.display = 'none';
            document.getElementById('messageBtn').style.display = 'none';
            document.getElementById('profileMenu').style.display = 'none';
        }
        
        // Load user posts
        loadUserProfilePosts(user.id);
        
        // Update post count in subtitle
        const postsResponse = await fetch(`/api/posts?user_id=${user.id}`);
        const posts = await postsResponse.json();
        document.getElementById('userProfileSubtitle').textContent = `${posts.length} Keklik`;
        
    } catch (error) {
        showNotification('Profil yüklenemedi', 'error');
        navigateTo('home');
    }
}

// Update the existing loadUserProfilePage function
window.loadUserProfilePage = loadUserProfilePageUpdated;

// Update profile edit modal to include new fields
function openEditProfileModalUpdated() {
    if (!currentUser) return;
    
    document.getElementById('editDisplayName').value = currentUser.display_name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editWebsite').value = currentUser.website || '';
    document.getElementById('editLocation').value = currentUser.location || '';
    document.getElementById('editProfileModal').classList.add('active');
}

// Update save profile function
async function saveProfileUpdated() {
    if (!currentUser) return;
    
    const formData = new FormData();
    const displayName = document.getElementById('editDisplayName').value;
    const bio = document.getElementById('editBio').value;
    const website = document.getElementById('editWebsite').value;
    const location = document.getElementById('editLocation').value;
    const profileImage = document.getElementById('editProfileImage').files[0];
    const coverImage = document.getElementById('editCoverImage').files[0];
    
    if (displayName) formData.append('display_name', displayName);
    if (bio !== undefined) formData.append('bio', bio);
    if (website !== undefined) formData.append('website', website);
    if (location !== undefined) formData.append('location', location);
    if (profileImage) formData.append('profile_image', profileImage);
    if (coverImage) formData.append('cover_image', coverImage);
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/profile`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Profil başarıyla güncellendi!', 'success');
            document.getElementById('editProfileModal').classList.remove('active');
            
            // Update current user data
            if (displayName) currentUser.display_name = displayName;
            if (bio !== undefined) currentUser.bio = bio;
            if (website !== undefined) currentUser.website = website;
            if (location !== undefined) currentUser.location = location;
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
            
            loadUserData();
            // Reload profile page if we're on it
            if (window.location.pathname === `/${currentUser.username}` || window.location.pathname === '/profile') {
                loadUserProfilePage(currentUser.username);
            }
        } else {
            showNotification(data.error || 'Profil güncellenemedi', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Override existing functions
window.openEditProfileModal = openEditProfileModalUpdated;
window.saveProfile = saveProfileUpdated;
