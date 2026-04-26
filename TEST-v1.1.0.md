# İks v1.1.0 Test Rehberi

## 🧪 Test Adımları

### 1. Geliştirilmiş Giriş/Kayıt UI Testi

**Test 1.1: Kayıt Ekranı Görünümü**
- [ ] Uygulamayı başlat
- [ ] Animasyonlu gradient arka planı gör
- [ ] Glassmorphism efektini kontrol et
- [ ] Logo animasyonunu izle (glow efekti)

**Test 1.2: Form Etkileşimleri**
- [ ] Input alanlarına tıkla
- [ ] Focus efektlerini kontrol et (mavi glow)
- [ ] Placeholder metinlerini oku
- [ ] Tab tuşları ile geçiş yap

**Test 1.3: Buton Animasyonları**
- [ ] "Kayıt Ol" butonuna hover yap
- [ ] Parıltı efektini gör
- [ ] Butona tıkla ve animasyonu izle

### 2. Otomatik Giriş Testi

**Test 2.1: Yeni Kullanıcı Kaydı**
```
Kullanıcı Adı: testuser1
Email: test1@iks.com
Görünen Ad: Test Kullanıcı 1
Şifre: test123
```
- [ ] Formu doldur
- [ ] "Kayıt Ol" butonuna tıkla
- [ ] Otomatik olarak ana sayfaya yönlendirildiğini kontrol et
- [ ] Manuel giriş ekranı görmediğini doğrula

**Test 2.2: Kullanıcı Bilgileri**
- [ ] Sol sidebar'da kullanıcı adını gör
- [ ] Profil resminin teatube.svg olduğunu kontrol et
- [ ] Profil sayfasına git ve bilgileri kontrol et

### 3. Varsayılan Profil Resmi Testi

**Test 3.1: Yeni Kullanıcı**
- [ ] Yeni kayıt ol
- [ ] Sidebar'da İks logosu gör
- [ ] Ana sayfada yeni iks kutusunda logo gör
- [ ] Profil sayfasında logo gör

**Test 3.2: Tüm Sayfalarda Kontrol**
- [ ] Ana Sayfa: İks paylaşım kutusunda
- [ ] Keşfet: Arama sonuçlarında
- [ ] Mesajlar: Konuşma listesinde
- [ ] Profil: Profil resmi olarak
- [ ] Yorumlar: Yorum avatarı olarak

### 4. İks Düzenleme Testi

**Test 4.1: Kendi İksini Düzenle**
- [ ] Bir iks paylaş: "Bu bir test iksidir #test"
- [ ] İks üzerinde ⋯ butonunu gör
- [ ] Menüye tıkla
- [ ] "Düzenle" seçeneğini gör
- [ ] Tıkla ve prompt'u gör
- [ ] Metni değiştir: "Bu düzenlenmiş bir test iksidir #test"
- [ ] Tamam'a tıkla
- [ ] İksin güncellendiğini kontrol et

**Test 4.2: Başkasının İksini Düzenlemeye Çalış**
- [ ] Başka bir kullanıcı ile giriş yap
- [ ] Önceki kullanıcının iksini gör
- [ ] ⋯ butonunun olmadığını kontrol et
- [ ] Düzenleme seçeneği görmediğini doğrula

### 5. İks Silme Testi

**Test 5.1: Kendi İksini Sil**
- [ ] Bir iks paylaş
- [ ] ⋯ menüsünü aç
- [ ] "Sil" seçeneğini gör (kırmızı)
- [ ] Tıkla
- [ ] Onay dialogunu gör
- [ ] "Tamam" de
- [ ] İksin silindiğini kontrol et

**Test 5.2: Medya ile İks Silme**
- [ ] Fotoğraf/video ile iks paylaş
- [ ] İksi sil
- [ ] uploads klasöründe dosyanın silindiğini kontrol et

### 6. Yorum Sistemi Testi

**Test 6.1: Yorum Yapma**
- [ ] Bir ikse git
- [ ] 💬 butonuna tıkla
- [ ] Yorum alanının açıldığını gör
- [ ] "İlk yorum!" yaz
- [ ] "Gönder" butonuna tıkla
- [ ] Yorumun göründüğünü kontrol et
- [ ] Yorum sayısının 1 olduğunu gör

**Test 6.2: Çoklu Yorum**
- [ ] Aynı ikse 3 farklı yorum yap
- [ ] Tüm yorumların göründüğünü kontrol et
- [ ] Yorum sayısının 3 olduğunu gör
- [ ] Yorumları kapat (💬 tekrar tıkla)
- [ ] Yorumların gizlendiğini gör

**Test 6.3: Yorum Avatarları**
- [ ] Farklı kullanıcılarla yorum yap
- [ ] Her yorumda doğru avatar'ın göründüğünü kontrol et
- [ ] Kullanıcı adlarının doğru olduğunu kontrol et

### 7. Geliştirilmiş Beğeni Sistemi Testi

**Test 7.1: Beğeni/Beğenmeme**
- [ ] Bir ikse beğen (❤️)
- [ ] Kalbin kırmızı olduğunu gör
- [ ] Beğeni sayısının arttığını gör
- [ ] Tekrar tıkla (beğenmeme)
- [ ] Kalbin gri olduğunu gör
- [ ] Beğeni sayısının azaldığını gör

**Test 7.2: Çoklu Kullanıcı Beğenisi**
- [ ] 3 farklı kullanıcı ile aynı iksi beğen
- [ ] Beğeni sayısının 3 olduğunu kontrol et
- [ ] Bir kullanıcı beğeniyi kaldırsın
- [ ] Sayının 2'ye düştüğünü gör

### 8. Entegrasyon Testleri

**Test 8.1: Tam Akış**
1. [ ] Yeni kullanıcı kayıt ol (otomatik giriş)
2. [ ] Profil resminin teatube.svg olduğunu gör
3. [ ] Bir iks paylaş
4. [ ] İksi düzenle
5. [ ] İkse yorum yap
6. [ ] İksi beğen
7. [ ] İksi sil

**Test 8.2: Çoklu Kullanıcı Etkileşimi**
1. [ ] Kullanıcı A: İks paylaş
2. [ ] Kullanıcı B: Yorumla
3. [ ] Kullanıcı C: Beğen
4. [ ] Kullanıcı A: Yorumu gör
5. [ ] Kullanıcı A: İksi düzenle
6. [ ] Kullanıcı B ve C: Güncellenmiş iksi gör

### 9. UI/UX Testleri

**Test 9.1: Responsive Tasarım**
- [ ] Tarayıcı penceresini küçült
- [ ] Mobil görünümü kontrol et
- [ ] Tüm butonların tıklanabilir olduğunu kontrol et
- [ ] Menülerin düzgün açıldığını kontrol et

**Test 9.2: Animasyonlar**
- [ ] Giriş ekranı animasyonlarını izle
- [ ] Buton hover efektlerini kontrol et
- [ ] Menü açılma/kapanma animasyonlarını gör
- [ ] Yorum açılma animasyonunu izle

**Test 9.3: Tema Değiştirme**
- [ ] Ayarlar'a git
- [ ] Açık tema'ya geç
- [ ] Tüm yeni özelliklerin açık temada çalıştığını kontrol et
- [ ] Koyu tema'ya geri dön

### 10. Hata Durumları

**Test 10.1: Boş Yorum**
- [ ] Yorum alanını boş bırak
- [ ] "Gönder" butonuna tıkla
- [ ] Hiçbir şey olmamalı

**Test 10.2: Başkasının İksini Silmeye Çalış**
- [ ] API'yi manuel olarak çağır
- [ ] 403 Forbidden hatası al
- [ ] İksin silinmediğini kontrol et

**Test 10.3: Menü Dışına Tıklama**
- [ ] İks menüsünü aç
- [ ] Menü dışına tıkla
- [ ] Menünün kapandığını kontrol et

## 🎯 Başarı Kriterleri

- [ ] Tüm testler başarılı
- [ ] Hiçbir console hatası yok
- [ ] Animasyonlar smooth çalışıyor
- [ ] Responsive tasarım çalışıyor
- [ ] Veritabanı doğru güncelleniyor

## 🐛 Bilinen Sorunlar

Şu an için bilinen sorun yok.

## 📊 Test Sonuçları

| Test Kategorisi | Durum | Notlar |
|----------------|-------|--------|
| UI/UX | ⏳ | Test edilecek |
| Otomatik Giriş | ⏳ | Test edilecek |
| Varsayılan Avatar | ⏳ | Test edilecek |
| İks Düzenleme | ⏳ | Test edilecek |
| İks Silme | ⏳ | Test edilecek |
| Yorum Sistemi | ⏳ | Test edilecek |
| Beğeni Sistemi | ⏳ | Test edilecek |

## 🚀 Test Ortamı

```bash
# Sunucuyu başlat
cd Iks
npm start

# Tarayıcıda aç
http://localhost:3456
```

## 📝 Test Notları

- Her test sonrası veritabanını kontrol et
- Console loglarını takip et
- Network sekmesinde API çağrılarını izle
- Performans sorunlarını not al

---

**Test Tarihi**: 25 Nisan 2026
**Versiyon**: 1.1.0
**Tester**: -
