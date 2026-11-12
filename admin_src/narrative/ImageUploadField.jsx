/* Permite elegir, arrastrar, subir o quitar una imagen con estilo CogniJuegos. */
import { useState, useRef } from 'react';
import {
  ImageIcon,
  UploadCloudIcon,
  RefreshIcon,
  CheckIcon,
  AlertTriangleIcon,
  XIcon,
} from '../Icons';
import { fetchNarrativeAdmin } from './api';

// Permite elegir, arrastrar, subir o quitar una imagen.
export default function ImageUploadField({
  label = 'Retrato del Personaje',
  categoria = 'personajes',
  value = '',
  onChange,
  defaultImage = '',
  nullable = false,
}) {
  const fallbackUrl = nullable ? '' : (defaultImage || `/assets/narrative/${categoria}/default.webp`);
  const valorActual = value || fallbackUrl;
  const mostrarRestablecer = nullable ? !!valorActual : valorActual !== fallbackUrl;

  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [infoSubida, setInfoSubida] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef(null);

  // Valida y prepara la imagen elegida para subirla.
  const procesarArchivo = async (file) => {
    if (!file) return;

    setError('');
    setInfoSubida(null);

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

      const res = await fetchNarrativeAdmin(`/api/narrative/admin/upload-imagen?categoria=${encodeURIComponent(categoria)}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al procesar y subir la imagen.');
      }

      const data = await res.json();
      if (onChange) {
        onChange(data.url);
      }
      setInfoSubida(`${data.ancho}x${data.alto} px · WebP`);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      setError(err.message || 'Error de conexión con el servidor al subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      procesarArchivo(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const handleDragLeave = () => {
    setArrastrando(false);
  };

  const restablecerPorDefecto = () => {
    if (onChange) {
      onChange(fallbackUrl);
    }
    setInfoSubida(null);
    setError('');
  };

  const quitarImagen = () => {
    if (onChange) {
      onChange('');
    }
    setInfoSubida(null);
    setError('');
  };

  return (
    <div className="flex flex-col items-center sm:items-start gap-2.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Marco de Retrato destacado */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-32 sm:w-36 h-40 sm:h-48 rounded-[12px] overflow-hidden border cursor-pointer transition-all flex items-center justify-center group ${
          arrastrando
            ? 'border-[#ecd098] ring-2 ring-[#ecd098]/40 bg-[#2a394c]'
            : 'border-[#52647b] hover:border-[#ecd098]/80 bg-[#1b2737]'
        }`}
        title="Haz clic o arrastra una imagen para cambiar el retrato"
      >
        {valorActual ? (
          <img
            src={valorActual}
            alt={label}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackUrl;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#c0cbd7] gap-2 p-3 text-center">
            <ImageIcon size={28} className="text-[#ecd098]" />
            <span className="text-[11px] font-semibold text-[#c0cbd7]">Subir retrato</span>
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-[#151e2b]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
          <UploadCloudIcon size={22} className="text-[#ecd098]" />
          <span className="text-[11px] font-bold text-[#f3f6fa]">Cambiar foto</span>
        </div>

        {subiendo && (
          <div className="absolute inset-0 bg-[#151e2b]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#ecd098] border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-[#ecd098]">Optimizando...</span>
          </div>
        )}
      </div>

      {/* Botones de acción directos bajo el retrato */}
      <div className="flex items-center gap-1.5 w-full justify-center sm:justify-start">
        <button
          type="button"
          disabled={subiendo}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a394c] hover:bg-[#2e3c50] text-[#f3f6fa] border border-[#52647b] text-xs font-semibold rounded-[9px] transition-all disabled:opacity-50 cursor-pointer"
        >
          <UploadCloudIcon size={13} className="text-[#ecd098]" />
          <span>Subir foto</span>
        </button>

        {mostrarRestablecer && (
          <button
            type="button"
            disabled={subiendo}
            onClick={nullable ? quitarImagen : restablecerPorDefecto}
            title={nullable ? 'Quitar imagen' : 'Restablecer retrato por defecto'}
            className="p-1.5 text-xs text-[#c0cbd7] hover:text-[#f3f6fa] bg-[#2a394c] hover:bg-[#2e3c50] border border-[#52647b] rounded-[9px] transition-colors cursor-pointer"
          >
            {nullable ? <XIcon size={14} /> : <RefreshIcon size={14} />}
          </button>
        )}
      </div>

      {infoSubida && (
        <div className="flex items-center gap-1 text-[11px] text-[#99dcd1] font-medium">
          <CheckIcon size={12} />
          <span>{infoSubida}</span>
        </div>
      )}

      {error && (
        <div className="p-2 rounded-[9px] bg-[#1b2737] border border-[#f0bb98] text-[#f0bb98] text-[11px] flex items-center gap-1.5">
          <AlertTriangleIcon size={13} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-[#f0bb98] hover:text-[#f3f6fa]"
          >
            <XIcon size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
