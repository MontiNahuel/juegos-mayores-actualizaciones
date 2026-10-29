/* Permite elegir, arrastrar, subir o quitar una imagen. */
import { useState, useRef } from 'react';
import {
  ImageIcon,
  UploadCloudIcon,
  RefreshIcon,
  CheckIcon,
  AlertTriangleIcon,
  XIcon,
} from '../Icons';

// Permite elegir, arrastrar, subir o quitar una imagen.
export default function ImageUploadField({
  label = 'Imagen',
  categoria = 'eventos',
  value = '',
  onChange,
  defaultImage = '',
  helperText = '',
  nullable = false,
}) {
  const fallbackUrl = nullable ? '' : (defaultImage || `/assets/narrative/${categoria}/default.webp`);
  const valorActual = value || fallbackUrl;
  const mostrarRestablecer = nullable ? !!valorActual : valorActual !== fallbackUrl;

  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [infoSubida, setInfoSubida] = useState(null);
  const [modoManual, setModoManual] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef(null);

  // Valida y prepara la imagen elegida para subirla.
  const procesarArchivo = async (file) => {
    if (!file) return;

    setError('');
    setInfoSubida(null);

    // Validación básica en cliente
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
    if (!formatosPermitidos.includes(file.type)) {
      setError(`Formato "${file.type || 'desconocido'}" no soportado. Usá JPG, PNG o WebP.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado pesada. El límite máximo es 10 MB.');
      return;
    }

    setSubiendo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/narrative/admin/upload-imagen?categoria=${encodeURIComponent(categoria)}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(/* Maneja el fallo de esta operación. */ () => ({}));
        throw new Error(errData.detail || 'Error al procesar y subir la imagen.');
      }

      const data = await res.json();
      if (onChange) {
        onChange(data.url);
      }
      setInfoSubida(`${data.ancho}x${data.alto} px · ${data.tamanio_kb} KB (WebP optimizado)`);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      setError(err.message || 'Error de conexión con el servidor al subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  // Toma la imagen elegida en el selector de archivos.
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
    // Limpiar input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  // Recoge la imagen que se soltó en el campo.
  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
  };

  // Permite soltar la imagen y marca la zona activa.
  const handleDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  // Quita la marca cuando la imagen sale del campo.
  const handleDragLeave = () => {
    setArrastrando(false);
  };

  // Vuelve a usar la imagen predeterminada.
  const restablecerPorDefecto = () => {
    if (onChange) {
      onChange(fallbackUrl);
    }
    setInfoSubida(null);
    setError('');
  };

  // Quita la imagen del formulario.
  const quitarImagen = () => {
    if (onChange) {
      onChange('');
    }
    setInfoSubida(null);
    setError('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1.5">
          <ImageIcon size={14} className="text-slate-500" />
          {label}
        </label>
        <button
          type="button"
          onClick={/* Responde a click desde este control. */ () => setModoManual(!modoManual)}
          className="text-[10px] text-blue-600 hover:text-blue-800 underline transition-colors"
        >
          {modoManual ? 'Volver a subida asistida' : 'Editar URL manual'}
        </button>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}

      {/* Modo URL Manual (para usuarios avanzados o URLs externas) */}
      {modoManual ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={valorActual}
              onChange={/* Responde a change desde este control. */ (e) => onChange && onChange(e.target.value)}
              placeholder="/assets/narrative/... o https://..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {mostrarRestablecer && (
              <button
                type="button"
                onClick={nullable ? quitarImagen : restablecerPorDefecto}
                title={nullable ? 'Quitar imagen' : 'Restablecer imagen por defecto'}
                className="px-2 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {nullable ? <XIcon size={14} /> : <RefreshIcon size={14} />}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Modo Visual Asistido (Drag & Drop + Preview + WebP Auto) */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-3 transition-all ${
            arrastrando
              ? 'border-blue-500 bg-blue-50/60'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            {/* Thumbnail Preview */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 shadow-xs flex items-center justify-center">
              {valorActual ? (
                <img
                  src={valorActual}
                  alt={label}
                  onError={/* Responde a error desde este control. */ (e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackUrl;
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-slate-400">
                  <ImageIcon size={22} />
                </div>
              )}
              {subiendo && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Info y Acciones */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={subiendo}
                  onClick={/* Responde a click desde este control. */ () => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <UploadCloudIcon size={14} />
                  {subiendo ? 'Comprimiendo WebP...' : 'Seleccionar foto'}
                </button>

                {mostrarRestablecer && (
                  <button
                    type="button"
                    disabled={subiendo}
                    onClick={nullable ? quitarImagen : restablecerPorDefecto}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {nullable ? <XIcon size={12} /> : <RefreshIcon size={12} />}
                    {nullable ? 'Quitar' : 'Usar por defecto'}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                Arrastrá una imagen o hacé clic. Auto-conversión a WebP optimizado.
              </p>

              {infoSubida && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
                  <CheckIcon size={12} />
                  <span>{infoSubida}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          <AlertTriangleIcon size={14} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={/* Responde a click desde este control. */ () => setError('')}
            className="text-rose-500 hover:text-rose-700"
          >
            <XIcon size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
