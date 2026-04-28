// Helper: get safe profile image URL
function getProfileImage(url) {
    return (url && url !== 'null' && url.trim() !== '') ? url : '/iks.png';
}

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
// Navigation (removed duplicate - using the one below)

// Profile Management Functions
function openEditProfileModal() {
    if (!currentUser) return;
    
    document.getElementById('editDisplayName').value = currentUser.display_name || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editWebsite').value = currentUser.website || '';
    document.getElementById('editLocation').value = currentUser.location || '';
    document.getElementById('editProfileModal').classList.add('active');
}

async function saveProfile() {
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
            
            // Kullanıcı bilgilerini yeniden yükle
            const userResponse = await fetch(`/api/user/${currentUser.id}`);
            const updatedUser = await userResponse.json();
            
            // LocalStorage'ı güncelle - TÜM alanları güncelle
            currentUser = {
                ...currentUser,
                display_name: updatedUser.display_name,
                bio: updatedUser.bio,
                website: updatedUser.website,
                location: updatedUser.location,
                profile_image: updatedUser.profile_image,
                cover_image: updatedUser.cover_image
            };
            localStorage.setItem('iksUser', JSON.stringify(currentUser));
            
            // UI'ı güncelle
            loadUserData();
            
            // Eğer profil sayfasındaysak yenile
            if (document.getElementById('profilePage').classList.contains('active')) {
                loadUserProfile();
            }
            
            // Eğer user profile sayfasındaysak yenile
            if (document.getElementById('userProfilePage').classList.contains('active')) {
                loadUserProfilePage(currentUser.username);
            }
            
            // Feed'i yenile (profil resmi güncellenmiş olabilir)
            if (document.getElementById('homePage').classList.contains('active')) {
                loadFeed();
            }
        } else {
            showNotification(data.error || 'Profil güncellenemedi', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
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
        const userParam = currentUser ? `&userId=${currentUser.id}` : '';
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}${userParam}`);
        const users = await response.json();
        
        if (users.length === 0) {
            resultsContainer.innerHTML = '<div class="search-empty-state">Sonuç bulunamadı</div>';
            return;
        }

        resultsContainer.innerHTML = users.map(user => `
            <div class="user-result" onclick="openUserProfile('${user.username}')">
                <img src="${getProfileImage(user.profile_image)}" alt="${user.display_name}" onerror="this.src='/iks.png'">
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
        
        const container = document.getElementById('userPostsContainer');
        if (!container) return;
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Henüz hiç keklik paylaşılmamış</p></div>';
            return;
        }
        
        container.innerHTML = posts.map(post => createPostHTML(post)).join('');
        addProfileClickListeners();
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
            <img src="${getProfileImage(post.profile_image)}" alt="${post.display_name}" class="post-avatar">
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
            case 'settings':
                if (currentUser) {
                    loadBlockedUsers();
                }
                break;
        }
    }
    
    // Update URL without page reload - use replaceState to avoid adding to history
    let newUrl;
    if (route === 'userProfile' && param) {
        newUrl = `/${param}`;
    } else {
        newUrl = route === 'home' ? '/' : `/${route}`;
    }
    
    // Only update URL if it's different from current URL
    if (window.location.pathname !== newUrl) {
        window.history.replaceState({route, param}, '', newUrl);
    }
}

// Load user profile page - defined later with full implementation

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

// Load user profile (own profile page)
function loadUserProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.display_name;
    document.getElementById('profileUsername').textContent = `@${currentUser.username}`;
    document.getElementById('profileBio').textContent = currentUser.bio || 'Bio eklenmemiş';
    document.getElementById('profileAvatar').src = getProfileImage(currentUser.profile_image);
    
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
        avatarImg.src = getProfileImage(currentUser.profile_image);
        avatarImg.onerror = function() {
            this.src = '/iks.png';
        };
    }
    
    // Update new post avatar
    const newPostAvatar = document.querySelector('.new-keklik-box .user-avatar');
    if (newPostAvatar) {
        newPostAvatar.src = getProfileImage(currentUser.profile_image);
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

async function blockUser() {
    if (!currentUser) return;
    const username = document.getElementById('userProfileUsername').textContent.replace('@', '');
    if (!confirm(`@${username} hesabını engellemek istediğinizden emin misiniz?\n\nEngellenen kişi sizin içeriklerinizi göremez ve size mesaj gönderemez.`)) return;

    try {
        // Kullanıcı id'sini al
        const userRes = await fetch(`/api/user/profile/${username}`);
        const user = await userRes.json();
        if (!user.id) { showNotification('Kullanıcı bulunamadı', 'error'); return; }

        const response = await fetch('/api/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocker_id: currentUser.id, blocked_id: user.id })
        });
        const data = await response.json();
        if (data.success) {
            showNotification(`@${username} hesabı engellendi`, 'success');
            document.getElementById('profileMenuDropdown').classList.remove('active');
            // Profil sayfasından çık
            navigateTo('home');
        } else {
            showNotification(data.error || 'Engelleme başarısız', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
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
        profileImg.src = getProfileImage(user.profile_image);
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

// Media Viewer Functions
function openMedia(url, type) {
    if (type === 'video') {
        openVideoPlayer(url);
    } else {
        openLightbox(url);
    }
}

// Image Lightbox
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    lightboxImage.src = imageUrl;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add keyboard support
    document.addEventListener('keydown', handleLightboxKeyboard);
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleLightboxKeyboard);
}

function handleLightboxKeyboard(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
}

function downloadImage() {
    const imageUrl = document.getElementById('lightboxImage').src;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'keklik-image-' + Date.now() + '.jpg';
    link.click();
}

// Video Player
let currentVideo = null;

function openVideoPlayer(videoUrl) {
    const modal = document.getElementById('videoPlayerModal');
    const video = document.getElementById('modalVideo');
    
    video.querySelector('source').src = videoUrl;
    video.load();
    currentVideo = video;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Setup video events
    video.addEventListener('loadedmetadata', updateVideoDuration);
    video.addEventListener('timeupdate', updateVideoProgress);
    video.addEventListener('ended', onVideoEnded);
    
    // Add keyboard support
    document.addEventListener('keydown', handleVideoKeyboard);
    
    // Auto play
    video.play();
    updatePlayPauseIcon();
}

function closeVideoPlayer() {
    const modal = document.getElementById('videoPlayerModal');
    const video = document.getElementById('modalVideo');
    
    video.pause();
    video.currentTime = 0;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentVideo = null;
    
    document.removeEventListener('keydown', handleVideoKeyboard);
}

function togglePlay() {
    if (!currentVideo) return;
    
    if (currentVideo.paused) {
        currentVideo.play();
    } else {
        currentVideo.pause();
    }
    updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
    const icon = document.getElementById('playPauseIcon');
    if (currentVideo && !currentVideo.paused) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
}

function toggleMute() {
    if (!currentVideo) return;
    
    currentVideo.muted = !currentVideo.muted;
    updateVolumeIcon();
    document.getElementById('volumeSlider').value = currentVideo.muted ? 0 : currentVideo.volume * 100;
}

function updateVolumeIcon() {
    const icon = document.getElementById('volumeIcon');
    if (currentVideo.muted || currentVideo.volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (currentVideo.volume < 0.5) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

function changeVolume(value) {
    if (!currentVideo) return;
    
    currentVideo.volume = value / 100;
    currentVideo.muted = false;
    updateVolumeIcon();
}

function changeSpeed(speed) {
    if (!currentVideo) return;
    currentVideo.playbackRate = parseFloat(speed);
}

function toggleFullscreen() {
    if (!currentVideo) return;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        currentVideo.requestFullscreen();
    }
}

function updateVideoDuration() {
    if (!currentVideo) return;
    
    const duration = formatTime(currentVideo.duration);
    document.getElementById('duration').textContent = duration;
}

function updateVideoProgress() {
    if (!currentVideo) return;
    
    const progress = (currentVideo.currentTime / currentVideo.duration) * 100;
    document.getElementById('videoProgress').style.width = progress + '%';
    document.getElementById('currentTime').textContent = formatTime(currentVideo.currentTime);
}

function onVideoEnded() {
    updatePlayPauseIcon();
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleVideoKeyboard(e) {
    if (!currentVideo) return;
    
    switch(e.key) {
        case 'Escape':
            closeVideoPlayer();
            break;
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowLeft':
            currentVideo.currentTime = Math.max(0, currentVideo.currentTime - 5);
            break;
        case 'ArrowRight':
            currentVideo.currentTime = Math.min(currentVideo.duration, currentVideo.currentTime + 5);
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentVideo.volume = Math.min(1, currentVideo.volume + 0.1);
            document.getElementById('volumeSlider').value = currentVideo.volume * 100;
            updateVolumeIcon();
            break;
        case 'ArrowDown':
            e.preventDefault();
            currentVideo.volume = Math.max(0, currentVideo.volume - 0.1);
            document.getElementById('volumeSlider').value = currentVideo.volume * 100;
            updateVolumeIcon();
            break;
        case 'f':
            toggleFullscreen();
            break;
        case 'm':
            toggleMute();
            break;
    }
}

// Progress bar click
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.querySelector('.video-progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (!currentVideo) return;
            
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            currentVideo.currentTime = pos * currentVideo.duration;
        });
    }
});

// Load Trending Posts
async function loadTrendingPosts() {
    try {
        const response = await fetch('/api/posts/trending');
        const posts = await response.json();
        
        const container = document.getElementById('trendingPosts');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px; text-align: center;">Henüz trend keklik yok</p>';
            return;
        }
        
        container.innerHTML = posts.slice(0, 5).map(post => `
            <div class="trending-post-item" onclick="openUserProfile('${post.username}')">
                <div class="trending-post-header">
                    <img src="${getProfileImage(post.profile_image)}" alt="${post.display_name}" class="trending-post-avatar">
                    <div class="trending-post-user">
                        <div class="trending-post-name">${post.display_name}</div>
                        <div class="trending-post-username">@${post.username}</div>
                    </div>
                </div>
                <div class="trending-post-content">${formatPostText(post.content)}</div>
                <div class="trending-post-stats">
                    <span class="trending-post-stat">
                        <i class="fas fa-heart"></i> ${post.likes || 0}
                    </span>
                    <span class="trending-post-stat">
                        <i class="fas fa-comment"></i> ${post.replies || 0}
                    </span>
                    <span class="trending-post-stat">
                        <i class="fas fa-retweet"></i> ${post.retweets || 0}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading trending posts:', error);
    }
}

// Load trending posts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingPosts();
    // Refresh trending posts every 5 minutes
    setInterval(loadTrendingPosts, 5 * 60 * 1000);
});

// Update like button to show red color
async function likePost(postId) {
    if (!currentUser) {
        showNotification('Beğenmek için giriş yapın', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });

        const data = await response.json();
        
        if (data.success) {
            // Update UI
            const likeBtn = document.querySelector(`[data-post-id="${postId}"].like-btn`);
            if (likeBtn) {
                if (data.action === 'liked') {
                    likeBtn.classList.add('liked');
                    likeBtn.querySelector('i').className = 'fas fa-heart';
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.querySelector('i').className = 'far fa-heart';
                }
                
                // Update like count
                const likeCount = likeBtn.querySelector('span');
                const currentCount = parseInt(likeCount.textContent) || 0;
                likeCount.textContent = data.action === 'liked' ? currentCount + 1 : Math.max(0, currentCount - 1);
            }
            
            // Reload trending posts
            loadTrendingPosts();
        }
    } catch (error) {
        console.error('Like error:', error);
    }
}


// Repost Functions
let currentRepostPostId = null;
let currentRepostButton = null;

function showRepostMenu(postId, button) {
    if (!currentUser) {
        showNotification('Repost yapmak için giriş yapın', 'error');
        return;
    }
    
    currentRepostPostId = postId;
    currentRepostButton = button;
    
    const menu = document.getElementById('repostMenuModal');
    const rect = button.getBoundingClientRect();
    
    menu.style.display = 'block';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeRepostMenuOnClickOutside);
    }, 100);
}

function closeRepostMenuOnClickOutside(e) {
    const menu = document.getElementById('repostMenuModal');
    if (!menu.contains(e.target) && !e.target.closest('.repost-btn')) {
        closeRepostMenu();
    }
}

function closeRepostMenu() {
    const menu = document.getElementById('repostMenuModal');
    menu.style.display = 'none';
    document.removeEventListener('click', closeRepostMenuOnClickOutside);
}

async function doRepost() {
    if (!currentUser || !currentRepostPostId) return;
    
    closeRepostMenu();
    
    try {
        const response = await fetch(`/api/posts/${currentRepostPostId}/repost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUser.id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.action === 'reposted') {
                showNotification('Keklik repost edildi!', 'success');
                if (currentRepostButton) {
                    currentRepostButton.classList.add('reposted');
                    const count = currentRepostButton.querySelector('span');
                    count.textContent = parseInt(count.textContent) + 1;
                }
            } else {
                showNotification('Repost kaldırıldı', 'success');
                if (currentRepostButton) {
                    currentRepostButton.classList.remove('reposted');
                    const count = currentRepostButton.querySelector('span');
                    count.textContent = Math.max(0, parseInt(count.textContent) - 1);
                }
            }
            loadTrendingPosts();
        } else {
            showNotification(data.error || 'Repost yapılamadı', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

async function openQuoteModal() {
    if (!currentUser || !currentRepostPostId) return;
    
    closeRepostMenu();
    
    try {
        // Get post details
        const response = await fetch(`/api/posts`);
        const posts = await response.json();
        const post = posts.find(p => p.id === currentRepostPostId);
        
        if (!post) {
            showNotification('Keklik bulunamadı', 'error');
            return;
        }
        
        // Show modal
        const modal = document.getElementById('quoteModal');
        const quotedPost = document.getElementById('quotedPost');
        
        quotedPost.innerHTML = `
            <div class="quoted-post-header">
                <img src="${getProfileImage(post.profile_image)}" alt="${post.display_name}" class="quoted-post-avatar">
                <div class="quoted-post-user">
                    <div class="quoted-post-name">${post.display_name}</div>
                    <div class="quoted-post-username">@${post.username}</div>
                </div>
            </div>
            <div class="quoted-post-content">${formatPostText(post.content)}</div>
            ${post.media_url ? `
                <div class="quote-post-media">
                    ${post.media_type === 'video' ? 
                        `<video><source src="${post.media_url}" type="video/mp4"></video>` :
                        `<img src="${post.media_url}" alt="Media">`
                    }
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
        document.getElementById('quoteText').value = '';
        document.getElementById('quoteText').focus();
        
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

function closeQuoteModal() {
    const modal = document.getElementById('quoteModal');
    modal.classList.remove('active');
    document.getElementById('quoteText').value = '';
}

// Post quote button handler
document.getElementById('postQuoteBtn')?.addEventListener('click', async () => {
    const content = document.getElementById('quoteText').value.trim();
    
    if (!content) {
        showNotification('Yorum ekleyin', 'error');
        return;
    }
    
    if (!currentUser || !currentRepostPostId) return;
    
    try {
        const response = await fetch(`/api/posts/${currentRepostPostId}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Alıntı paylaşıldı!', 'success');
            closeQuoteModal();
            loadFeed();
            loadTrendingPosts();
        } else {
            showNotification(data.error || 'Alıntı paylaşılamadı', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
});

// Load reposts for user profile
async function loadUserReposts(userId) {
    try {
        const response = await fetch(`/api/reposts/${userId}`);
        const reposts = await response.json();
        
        return reposts;
    } catch (error) {
        console.error('Error loading reposts:', error);
        return [];
    }
}

// Check repost status for posts
async function checkRepostStatus(postId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}/repost-status/${currentUser.id}`);
        const data = await response.json();
        
        if (data.isReposted) {
            const repostBtn = document.querySelector(`[data-post-id="${postId}"].repost-btn`);
            if (repostBtn) {
                repostBtn.classList.add('reposted');
            }
        }
    } catch (error) {
        console.error('Error checking repost status:', error);
    }
}

// ── ENGELLENENLER ──────────────────────────────────────────────

async function loadBlockedUsers() {
    if (!currentUser) return;
    const container = document.getElementById('blockedUsersList');
    if (!container) return;

    try {
        const res = await fetch(`/api/blocks/${currentUser.id}`);
        const blocked = await res.json();

        if (blocked.length === 0) {
            container.innerHTML = '<div class="blocked-empty">Engellenen kullanıcı yok.</div>';
            return;
        }

        container.innerHTML = blocked.map(user => `
            <div class="blocked-user-item" data-id="${user.id}" data-name="${user.display_name || user.username}" data-username="${user.username}">
                <img src="${getProfileImage(user.profile_image)}" alt="${user.display_name}" onerror="this.src='/iks.png'" class="blocked-user-avatar">
                <div class="blocked-user-info">
                    <div class="blocked-user-name">${user.display_name || user.username}</div>
                    <div class="blocked-user-username">@${user.username}</div>
                </div>
                <button class="btn-unblock-user" onclick="unblockUser(${user.id}, '${user.username}')">
                    <i class="fas fa-unlock"></i> Engeli Kaldır
                </button>
            </div>
        `).join('');

        // Arama filtresi
        const searchInput = document.getElementById('blockedSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.toLowerCase();
                document.querySelectorAll('.blocked-user-item').forEach(item => {
                    const name = (item.dataset.name || '').toLowerCase();
                    const username = (item.dataset.username || '').toLowerCase();
                    item.style.display = (name.includes(q) || username.includes(q)) ? '' : 'none';
                });
            });
        }
    } catch (error) {
        if (container) container.innerHTML = '<div class="blocked-empty">Yüklenemedi.</div>';
    }
}

async function unblockUser(blockedId, username) {
    if (!currentUser) return;
    if (!confirm(`@${username} engelini kaldırmak istediğinizden emin misiniz?`)) return;

    try {
        const res = await fetch('/api/block', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocker_id: currentUser.id, blocked_id: blockedId })
        });
        const data = await res.json();
        if (data.success) {
            showNotification(`@${username} engeli kaldırıldı`, 'success');
            loadBlockedUsers(); // Listeyi yenile
        } else {
            showNotification(data.error || 'Engel kaldırılamadı', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}
