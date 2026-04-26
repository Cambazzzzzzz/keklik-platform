const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3456;

// Database ve uploads path - Railway volume için (EN BAŞTA TANIMLA)
const VOLUME_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH || '.';
const dbPath = process.env.DATABASE_PATH || `${VOLUME_PATH}/data/iks.db`;
const dbDir = path.dirname(dbPath);

// Uploads klasörü - Railway volume için
const uploadsPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/uploads`
    : 'uploads';

// Database klasörünü oluştur
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Upload klasörünü oluştur
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsPath));

// Multer yapılandırması - Railway volume uyumlu
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim ve video dosyaları yüklenebilir!'));
    }
});

// Database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database bağlantı hatası:', err);
    } else {
        console.log('Database bağlantısı başarılı:', dbPath);
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Kullanıcılar tablosu
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            display_name TEXT NOT NULL,
            bio TEXT,
            website TEXT,
            location TEXT,
            profile_image TEXT DEFAULT '/iks.png',
            cover_image TEXT,
            theme TEXT DEFAULT 'dark',
            username_changes INTEGER DEFAULT 0,
            last_username_change DATETIME,
            is_guest INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // İksler (postlar) tablosu
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            media_url TEXT,
            media_type TEXT,
            likes INTEGER DEFAULT 0,
            retweets INTEGER DEFAULT 0,
            replies INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Beğeniler tablosu
        db.run(`CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (post_id) REFERENCES posts(id),
            UNIQUE(user_id, post_id)
        )`);

        // Takip tablosu
        db.run(`CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower_id INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (follower_id) REFERENCES users(id),
            FOREIGN KEY (following_id) REFERENCES users(id),
            UNIQUE(follower_id, following_id)
        )`);

        // Mesajlar tablosu
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )`);

        // Yorumlar tablosu
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
    });
}

// AUTH ROUTES
app.post('/api/register', async (req, res) => {
    const { username, email, password, display_name } = req.body;
    
    if (!username || !email || !password || !display_name) {
        return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultAvatar = '/iks.png'; // Default avatar
        
        db.run(
            'INSERT INTO users (username, email, password, display_name, profile_image) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, display_name, defaultAvatar],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Kullanıcı adı veya email zaten kullanılıyor' });
                    }
                    return res.status(500).json({ error: 'Kayıt hatası' });
                }
                
                // Kullanıcıyı otomatik giriş yaptır
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı' });
                    }
                    
                    res.json({ 
                        success: true, 
                        autoLogin: true,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            display_name: user.display_name,
                            bio: user.bio,
                            website: user.website,
                            location: user.location,
                            profile_image: user.profile_image,
                            cover_image: user.cover_image,
                            theme: user.theme
                        }
                    });
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Sunucu hatası' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Hatalı şifre' });
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                display_name: user.display_name,
                bio: user.bio,
                website: user.website,
                location: user.location,
                profile_image: user.profile_image,
                cover_image: user.cover_image,
                theme: user.theme
            }
        });
    });
});

// USER ROUTES
app.get('/api/user/:id', (req, res) => {
    db.get('SELECT id, username, display_name, bio, profile_image, cover_image, created_at FROM users WHERE id = ?', 
        [req.params.id], (err, user) => {
        if (err) return res.status(500).json({ error: 'Sunucu hatası' });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        res.json(user);
    });
});

app.get('/api/user/profile/:username', (req, res) => {
    db.get('SELECT id, username, display_name, bio, profile_image, cover_image, created_at FROM users WHERE username = ?', 
        [req.params.username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Sunucu hatası' });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        res.json(user);
    });
});

app.put('/api/user/:id/profile', upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), (req, res) => {
    const { display_name, bio, website, location } = req.body;
    const userId = req.params.id;
    
    let updateFields = [];
    let updateValues = [];
    
    if (display_name) {
        updateFields.push('display_name = ?');
        updateValues.push(display_name);
    }
    
    if (bio !== undefined) {
        updateFields.push('bio = ?');
        updateValues.push(bio);
    }
    
    if (website !== undefined) {
        updateFields.push('website = ?');
        updateValues.push(website);
    }
    
    if (location !== undefined) {
        updateFields.push('location = ?');
        updateValues.push(location);
    }
    
    if (req.files && req.files.profile_image) {
        updateFields.push('profile_image = ?');
        updateValues.push(`/uploads/${req.files.profile_image[0].filename}`);
    }
    
    if (req.files && req.files.cover_image) {
        updateFields.push('cover_image = ?');
        updateValues.push(`/uploads/${req.files.cover_image[0].filename}`);
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
    }
    
    updateValues.push(userId);
    
    db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues, (err) => {
        if (err) return res.status(500).json({ error: 'Profil güncellenemedi' });
        res.json({ success: true });
    });
});

app.put('/api/user/:id/email', (req, res) => {
    const { email, password } = req.body;
    const userId = req.params.id;
    
    // Önce şifreyi kontrol et
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Sunucu hatası' });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Mevcut şifre hatalı' });
        }
        
        db.run('UPDATE users SET email = ? WHERE id = ?', [email, userId], (err) => {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
                }
                return res.status(500).json({ error: 'Email güncellenemedi' });
            }
            res.json({ success: true });
        });
    });
});

app.put('/api/user/:id/password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Sunucu hatası' });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Mevcut şifre hatalı' });
        }
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Şifre güncellenemedi' });
            res.json({ success: true });
        });
    });
});

app.put('/api/user/:id/username', (req, res) => {
    const { username, password } = req.body;
    const userId = req.params.id;
    
    // Önce şifreyi kontrol et
    db.get('SELECT password, username_changes, last_username_change FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Sunucu hatası' });
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Şifre hatalı' });
        }
        
        // Kullanıcı adı değişim kontrolü
        if (user.username_changes >= 2) {
            const lastChange = new Date(user.last_username_change);
            const now = new Date();
            const daysDiff = (now - lastChange) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 30) {
                const remainingDays = Math.ceil(30 - daysDiff);
                return res.status(400).json({ 
                    error: `Kullanıcı adını değiştirmek için ${remainingDays} gün daha beklemelisiniz` 
                });
            } else {
                // 30 gün geçmişse sayacı sıfırla
                db.run('UPDATE users SET username_changes = 0 WHERE id = ?', [userId]);
            }
        }
        
        db.run('UPDATE users SET username = ?, username_changes = username_changes + 1, last_username_change = CURRENT_TIMESTAMP WHERE id = ?', 
            [username, userId], (err) => {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
                }
                return res.status(500).json({ error: 'Kullanıcı adı güncellenemedi' });
            }
            res.json({ success: true, remainingChanges: 2 - (user.username_changes + 1) });
        });
    });
});

app.put('/api/user/:id/theme', (req, res) => {
    const { theme } = req.body;
    db.run('UPDATE users SET theme = ? WHERE id = ?', [theme, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Tema güncellenemedi' });
        res.json({ success: true });
    });
});

// Misafir erişim için public posts
app.get('/api/posts/public', (req, res) => {
    const query = `
        SELECT p.*, u.username, u.display_name, u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM posts WHERE id = p.id) as retweets
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 50
    `;
    
    db.all(query, (err, posts) => {
        if (err) return res.status(500).json({ error: 'Keklikler yüklenemedi' });
        res.json(posts);
    });
});

// Trending posts - en çok beğenilen ve yorumlanan
app.get('/api/posts/trending', (req, res) => {
    const query = `
        SELECT p.*, u.username, u.display_name, u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as replies,
        (SELECT COUNT(*) FROM posts WHERE id = p.id) as retweets,
        ((SELECT COUNT(*) FROM likes WHERE post_id = p.id) * 2 + 
         (SELECT COUNT(*) FROM comments WHERE post_id = p.id) * 3) as trend_score
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE datetime(p.created_at) > datetime('now', '-7 days')
        ORDER BY trend_score DESC, p.created_at DESC
        LIMIT 10
    `;
    
    db.all(query, (err, posts) => {
        if (err) return res.status(500).json({ error: 'Trend keklikler yüklenemedi' });
        res.json(posts);
    });
});

// POST ROUTES
app.post('/api/posts', upload.single('media'), (req, res) => {
    const { user_id, content } = req.body;
    const media_url = req.file ? `/uploads/${req.file.filename}` : null;
    const media_type = req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : null;
    
    db.run(
        'INSERT INTO posts (user_id, content, media_url, media_type) VALUES (?, ?, ?, ?)',
        [user_id, content, media_url, media_type],
        function(err) {
            if (err) return res.status(500).json({ error: 'Keklik paylaşılamadı' });
            res.json({ success: true, postId: this.lastID });
        }
    );
});

app.get('/api/posts', (req, res) => {
    const { user_id } = req.query;
    
    let query = `
        SELECT p.*, u.username, u.display_name, u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM posts WHERE id = p.id) as retweets
        FROM posts p
        JOIN users u ON p.user_id = u.id
    `;
    
    if (user_id) {
        query += ` WHERE p.user_id = ${user_id}`;
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT 50';
    
    db.all(query, (err, posts) => {
        if (err) return res.status(500).json({ error: 'İksler yüklenemedi' });
        res.json(posts);
    });
});

app.post('/api/posts/:id/like', (req, res) => {
    const { user_id } = req.body;
    const post_id = req.params.id;
    
    db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [user_id, post_id], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                // Unlike
                db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [user_id, post_id], (err) => {
                    if (err) return res.status(500).json({ error: 'Beğeni kaldırılamadı' });
                    res.json({ success: true, action: 'unliked' });
                });
            } else {
                return res.status(500).json({ error: 'Beğeni eklenemedi' });
            }
        } else {
            res.json({ success: true, action: 'liked' });
        }
    });
});

// İks silme
app.delete('/api/posts/:id', (req, res) => {
    const { user_id } = req.body;
    const post_id = req.params.id;
    
    // Önce postun sahibini kontrol et
    db.get('SELECT user_id, media_url FROM posts WHERE id = ?', [post_id], (err, post) => {
        if (err) return res.status(500).json({ error: 'Post bulunamadı' });
        if (!post) return res.status(404).json({ error: 'Post bulunamadı' });
        if (post.user_id !== parseInt(user_id)) {
            return res.status(403).json({ error: 'Bu kekliği silme yetkiniz yok' });
        }
        
        // Medya dosyasını sil
        if (post.media_url) {
            const mediaPath = path.join(uploadsPath, path.basename(post.media_url));
            if (fs.existsSync(mediaPath)) {
                fs.unlinkSync(mediaPath);
            }
        }
        
        // Postu sil (CASCADE ile yorumlar da silinir)
        db.run('DELETE FROM posts WHERE id = ?', [post_id], (err) => {
            if (err) return res.status(500).json({ error: 'Keklik silinemedi' });
            res.json({ success: true });
        });
    });
});

// İks düzenleme
app.put('/api/posts/:id', (req, res) => {
    const { user_id, content } = req.body;
    const post_id = req.params.id;
    
    // Önce postun sahibini kontrol et
    db.get('SELECT user_id FROM posts WHERE id = ?', [post_id], (err, post) => {
        if (err) return res.status(500).json({ error: 'Post bulunamadı' });
        if (!post) return res.status(404).json({ error: 'Post bulunamadı' });
        if (post.user_id !== parseInt(user_id)) {
            return res.status(403).json({ error: 'Bu kekliği düzenleme yetkiniz yok' });
        }
        
        db.run('UPDATE posts SET content = ? WHERE id = ?', [content, post_id], (err) => {
            if (err) return res.status(500).json({ error: 'Keklik düzenlenemedi' });
            res.json({ success: true });
        });
    });
});

// COMMENTS ROUTES
app.get('/api/posts/:id/comments', (req, res) => {
    const post_id = req.params.id;
    
    db.all(`
        SELECT c.*, u.username, u.display_name, u.profile_image
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `, [post_id], (err, comments) => {
        if (err) return res.status(500).json({ error: 'Yorumlar yüklenemedi' });
        res.json(comments);
    });
});

app.post('/api/posts/:id/comments', (req, res) => {
    const { user_id, content } = req.body;
    const post_id = req.params.id;
    
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Yorum boş olamaz' });
    }
    
    db.run(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [post_id, user_id, content],
        function(err) {
            if (err) return res.status(500).json({ error: 'Yorum eklenemedi' });
            
            // Yorum sayısını güncelle
            db.run('UPDATE posts SET replies = replies + 1 WHERE id = ?', [post_id]);
            
            res.json({ success: true, commentId: this.lastID });
        }
    );
});

// MESSAGES ROUTES
app.get('/api/messages/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(`
        SELECT DISTINCT 
            CASE 
                WHEN sender_id = ? THEN receiver_id 
                ELSE sender_id 
            END as other_user_id,
            u.username, u.display_name, u.profile_image,
            (SELECT content FROM messages 
             WHERE (sender_id = ? AND receiver_id = other_user_id) 
                OR (sender_id = other_user_id AND receiver_id = ?)
             ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages 
             WHERE (sender_id = ? AND receiver_id = other_user_id) 
                OR (sender_id = other_user_id AND receiver_id = ?)
             ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM messages m
        JOIN users u ON u.id = CASE 
            WHEN m.sender_id = ? THEN m.receiver_id 
            ELSE m.sender_id 
        END
        WHERE sender_id = ? OR receiver_id = ?
        ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId], (err, conversations) => {
        if (err) return res.status(500).json({ error: 'Mesajlar yüklenemedi' });
        res.json(conversations);
    });
});

app.get('/api/messages/:userId/:otherUserId', (req, res) => {
    const { userId, otherUserId } = req.params;
    
    db.all(`
        SELECT m.*, u.username, u.display_name, u.profile_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `, [userId, otherUserId, otherUserId, userId], (err, messages) => {
        if (err) return res.status(500).json({ error: 'Mesajlar yüklenemedi' });
        res.json(messages);
    });
});

app.post('/api/messages', (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    
    db.run(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [sender_id, receiver_id, content],
        function(err) {
            if (err) return res.status(500).json({ error: 'Mesaj gönderilemedi' });
            res.json({ success: true, messageId: this.lastID });
        }
    );
});

// FOLLOW ROUTES
app.post('/api/follow', (req, res) => {
    const { follower_id, following_id } = req.body;
    
    if (follower_id === following_id) {
        return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
    }
    
    db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', 
        [follower_id, following_id], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                // Unfollow
                db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', 
                    [follower_id, following_id], (err) => {
                    if (err) return res.status(500).json({ error: 'Takipten çıkılamadı' });
                    res.json({ success: true, action: 'unfollowed' });
                });
            } else {
                return res.status(500).json({ error: 'Takip edilemedi' });
            }
        } else {
            res.json({ success: true, action: 'followed' });
        }
    });
});

app.get('/api/follow/status/:follower_id/:following_id', (req, res) => {
    const { follower_id, following_id } = req.params;
    
    db.get('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', 
        [follower_id, following_id], (err, follow) => {
        if (err) return res.status(500).json({ error: 'Durum kontrol edilemedi' });
        res.json({ isFollowing: !!follow });
    });
});

app.get('/api/follow/counts/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    
    db.get('SELECT COUNT(*) as followers FROM follows WHERE following_id = ?', [user_id], (err, followers) => {
        if (err) return res.status(500).json({ error: 'Takipçi sayısı alınamadı' });
        
        db.get('SELECT COUNT(*) as following FROM follows WHERE follower_id = ?', [user_id], (err, following) => {
            if (err) return res.status(500).json({ error: 'Takip edilen sayısı alınamadı' });
            
            res.json({
                followers: followers.followers,
                following: following.following
            });
        });
    });
});

// DELETE ACCOUNT
app.delete('/api/user/:id/delete', async (req, res) => {
    const { username, password } = req.body;
    const userId = req.params.id;
    
    try {
        // Kullanıcıyı kontrol et
        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err) return res.status(500).json({ error: 'Sunucu hatası' });
            if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            
            // Kullanıcı adını doğrula
            if (user.username !== username) {
                return res.status(400).json({ error: 'Kullanıcı adı eşleşmiyor' });
            }
            
            // Şifreyi doğrula
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Şifre hatalı' });
            }
            
            // Kullanıcının medya dosyalarını sil
            db.all('SELECT media_url FROM posts WHERE user_id = ? AND media_url IS NOT NULL', 
                [userId], (err, posts) => {
                if (!err && posts) {
                    posts.forEach(post => {
                        const mediaPath = path.join(uploadsPath, path.basename(post.media_url));
                        if (fs.existsSync(mediaPath)) {
                            fs.unlinkSync(mediaPath);
                        }
                    });
                }
            });
            
            // Kullanıcının profil ve kapak fotoğraflarını sil
            if (user.profile_image && user.profile_image !== '/iks.png') {
                const profilePath = path.join(uploadsPath, path.basename(user.profile_image));
                if (fs.existsSync(profilePath)) {
                    fs.unlinkSync(profilePath);
                }
            }
            
            if (user.cover_image) {
                const coverPath = path.join(uploadsPath, path.basename(user.cover_image));
                if (fs.existsSync(coverPath)) {
                    fs.unlinkSync(coverPath);
                }
            }
            
            // Kullanıcıyı ve ilişkili verileri sil
            db.serialize(() => {
                db.run('DELETE FROM comments WHERE user_id = ?', [userId]);
                db.run('DELETE FROM likes WHERE user_id = ?', [userId]);
                db.run('DELETE FROM follows WHERE follower_id = ? OR following_id = ?', [userId, userId]);
                db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
                db.run('DELETE FROM posts WHERE user_id = ?', [userId]);
                db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Hesap silinemedi' });
                    res.json({ success: true, message: 'Hesap başarıyla silindi' });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// SEARCH
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    
    db.all(`
        SELECT id, username, display_name, profile_image, bio
        FROM users
        WHERE username LIKE ? OR display_name LIKE ?
        LIMIT 20
    `, [`%${q}%`, `%${q}%`], (err, users) => {
        if (err) return res.status(500).json({ error: 'Arama yapılamadı' });
        res.json(users);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Keklik server çalışıyor: http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ROUTE HANDLERS - Her sayfa için ayrı route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/explore', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/bookmarks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/profile/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
