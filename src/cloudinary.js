const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

cloudinary.config({
  cloud_name: 'dahj5lxvv',
  api_key: '357814355274844',
  api_secret: '5xeYrf6y36YL58tlQZwlVO3-WtQ'
});

// Upload signature oluştur (frontend direkt yükleme için)
function generateUploadSignature(folder, resourceType = 'image') {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + '5xeYrf6y36YL58tlQZwlVO3-WtQ')
    .digest('hex');
  return { 
    timestamp, 
    signature, 
    folder, 
    api_key: '357814355274844', 
    cloud_name: 'dahj5lxvv',
    resource_type: resourceType
  };
}

// Profil fotoğrafı yükleme fonksiyonu
async function uploadProfilePhoto(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'keklik/profiles',
        public_id: `profile_${Date.now()}_${filename}`,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// Kapak fotoğrafı yükleme fonksiyonu
async function uploadCoverPhoto(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'keklik/covers',
        public_id: `cover_${Date.now()}_${filename}`,
        transformation: [
          { width: 1500, height: 500, crop: 'fill' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// Keklik medya yükleme fonksiyonu
async function uploadKeklikMedia(fileBuffer, filename, isVideo = false) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? 'video' : 'image',
        folder: isVideo ? 'keklik/videos' : 'keklik/images',
        public_id: `${isVideo ? 'video' : 'image'}_${Date.now()}_${filename}`,
        ...(isVideo ? {
          chunk_size: 6000000,
          timeout: 900000,
          eager: [{ streaming_profile: 'hd', format: 'mp4' }],
          eager_async: true
        } : {
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        })
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadKeklikMedia,
  generateUploadSignature,
  cloudinary
};