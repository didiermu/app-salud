/**
 * Servicio de Subida de Medios a Cloudinary.
 * Los videos y banners se suben a Cloudinary y solo se guarda la URL
 * en Firestore. Esto evita que los documentos excedan el límite
 * de 1MB de Firestore (que causaba fallos silenciosos de sincronización
 * y pérdida de datos al limpiar la caché).
 *
 * Requiere un "unsigned upload preset" creado en tu cuenta de Cloudinary:
 *   Console > Settings > Upload > Upload presets > Add preset
 *   (modo "Unsigned") y configurarlo en el archivo .env:
 *   VITE_CLOUDINARY_PRESET=tu_preset_aqui
 */
const CLOUD_NAME = 'do6yhkekc';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || '';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/**
 * Sube un archivo a Cloudinary y devuelve su URL segura.
 *
 * @param {File} file                 - Archivo (video o imagen) a subir.
 * @param {string} [folder='media']   - Carpeta destino en Cloudinary.
 * @returns {Promise<string>}         - URL pública del archivo.
 * @throws {Error}                    - Si falta el preset o falla la subida.
 */
export const uploadToCloudinary = async ({ file, folder = 'media' }) => {
  if (!UPLOAD_PRESET) {
    throw new Error('Falta el upload preset de Cloudinary (VITE_CLOUDINARY_PRESET)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });

  if (!res.ok) {
    throw new Error(`Cloudinary respondió con el código ${res.status}`);
  }

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary no devolvió una URL válida');
  }

  return data.secure_url;
};
