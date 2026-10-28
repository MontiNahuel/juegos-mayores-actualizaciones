import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-expect-error Componente administrativo en JSX
import NarrativeAdminModal from '../../../admin_src/narrative/NarrativeAdminModal';

export default function NarrativoAdminPage() {
  const [abierto, setAbierto] = useState(true);
  const navigate = useNavigate();

  const handleCerrar = () => {
    setAbierto(false);
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <NarrativeAdminModal
        abierto={abierto}
        onCerrar={handleCerrar}
      />
    </div>
  );
}
