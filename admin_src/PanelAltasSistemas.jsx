import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  UsersIcon,
  PhoneIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  CopyIcon,
  LogOutIcon,
  ShieldIcon,
  AlertTriangleIcon,
  EditIcon,
  LinkIcon,
  ClockIcon,
  MailIcon,
  RefreshIcon,
  TagIcon,
  CalendarIcon,
  BookOpenIcon,
  CoinsIcon,
  HeartIcon,
  LayersIcon,
} from './Icons';
import NarrativeAdminModal from './narrative/NarrativeAdminModal';
import ModalEconomia from './ModalEconomia';
import ModalAsignarEconomia from './ModalAsignarEconomia';
import ModalDisenadorCrucigrama from './ModalDisenadorCrucigrama';
import { OPERADOR_STORAGE_KEY } from './LoginSistemas';
import { solicitarTicketRetorno } from './ssoService';

export default function PanelAltasSistemas() {
  const navigate = useNavigate();

// Salto SSO al panel central de usuarios
  const [saltandoSSO, setSaltandoSSO] = useState(false);
  const handleIrAAutenticador = async () => {
    if (saltandoSSO) return;
    setSaltandoSSO(true);
    try {
      const data = await solicitarTicketRetorno('autenticador');
      if (data && data.ticket) {
        const defaultAuthUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
          ? 'http://localhost:5173'
          : 'https://autenticador.asistodo.com.ar';
        const authFrontUrl = import.meta.env.VITE_AUTH_FRONTEND_URL || defaultAuthUrl;
        window.location.href = `${authFrontUrl}?ticket=${encodeURIComponent(data.ticket)}`;
      }
    } catch (err) {
      console.error('Error al generar salto a Autenticador:', err);
      showToast(err.message || 'No se pudo iniciar el salto al panel central');
      setSaltandoSSO(false);
    }
  };

  // Operador autenticado
  const [operadorInfo, setOperadorInfo] = useState({ user: 'Operador' });

  // Lista de alumnos y estados cargados desde el backend
  const [alumnos, setAlumnos] = useState([]);
  const [estadosCatalogo, setEstadosCatalogo] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Notificación toast flotante
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Estados para copiar enlace directo (Magic Link) y PIN desde la tabla
  const [copiandoLinkId, setCopiandoLinkId] = useState(null);
  const [copiadoLinkTablaId, setCopiadoLinkTablaId] = useState(null);
  const [copiadoPinTablaId, setCopiadoPinTablaId] = useState(null);
  const [reenviandoEmailId, setReenviandoEmailId] = useState(null);

  // Estado del Modal de Alta
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [esBlack, setEsBlack] = useState(false);
  const [activarInmediato, setActivarInmediato] = useState(true);
  const [enviandoAlta, setEnviandoAlta] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Estado del Modal de Edición
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [alumnoAEditar, setAlumnoAEditar] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [editEsBlack, setEditEsBlack] = useState(false);
  const [editSuscripcion, setEditSuscripcion] = useState('basica');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState('');
  const [exitoEdicion, setExitoEdicion] = useState('');

  // Resultado del alta recién generada en el modal
  const [altaExitosa, setAltaExitosa] = useState(null);
  const [copiadoPin, setCopiadoPin] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Estado para Modal de Catálogo de Estados y cambio de estado
  const [modalEstadosAbierto, setModalEstadosAbierto] = useState(false);
  const [cargandoEstados, setCargandoEstados] = useState(false);
  const [nuevoEstadoNombre, setNuevoEstadoNombre] = useState('');
  const [nuevoEstadoCodigo, setNuevoEstadoCodigo] = useState('');
  const [nuevoEstadoDesc, setNuevoEstadoDesc] = useState('');
  const [nuevoEstadoColor, setNuevoEstadoColor] = useState('indigo');
  const [nuevoEstadoPermiteLogin, setNuevoEstadoPermiteLogin] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState('');
  const [exitoEstado, setExitoEstado] = useState('');
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
  const [togglingEstadoId, setTogglingEstadoId] = useState(null);

  // Estado para Modal de Desafíos Diarios
  const [modalDesafiosAbierto, setModalDesafiosAbierto] = useState(false);
  const [modalDisenadorAbierto, setModalDisenadorAbierto] = useState(false);
  const [desafiosJuego, setDesafiosJuego] = useState('sudoku');
  const [desafiosAnio, setDesafiosAnio] = useState(2026);
  const [mesesDesafios, setMesesDesafios] = useState([]);
  const [cargandoDesafios, setCargandoDesafios] = useState(false);
  const [generandoMes, setGenerandoMes] = useState(null);
  const [errorDesafios, setErrorDesafios] = useState('');
  const [exitoDesafios, setExitoDesafios] = useState('');

  // Estado para Modal del Juego Narrativo
  const [modalNarrativoAbierto, setModalNarrativoAbierto] = useState(false);
  const [modalEconomiaAbierto, setModalEconomiaAbierto] = useState(false);
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState(null);

  const cargarEstadoDesafios = async (anio = desafiosAnio, juego = desafiosJuego) => {
    setCargandoDesafios(true);
    setErrorDesafios('');
    try {
      const res = await fetch(`/api/challenges/admin/status?year=${anio}&game_id=${juego}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMesesDesafios(data.months || []);
      } else {
        setErrorDesafios('No se pudo cargar el estado de desafíos.');
      }
    } catch (e) {
      console.error(e);
      setErrorDesafios('Error al conectar con el servidor.');
    } finally {
      setCargandoDesafios(false);
    }
  };

  const handleGenerarMes = async (mesNumero) => {
    setGenerandoMes(mesNumero);
    setErrorDesafios('');
    setExitoDesafios('');
    try {
      const res = await fetch(
        `/api/challenges/admin/generate-month?year=${desafiosAnio}&month=${mesNumero}&game_id=${desafiosJuego}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setExitoDesafios(`¡Mes de ${data.month_name || mesNumero} generado con éxito (${data.generated_count || 30} desafíos)!`);
        await cargarEstadoDesafios(desafiosAnio, desafiosJuego);
        showToast(`Desafíos de ${data.month_name || 'mes'} generados correctamente.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorDesafios(data.detail || data.message || 'Error al generar los desafíos del mes.');
      }
    } catch (e) {
      console.error(e);
      setErrorDesafios('Error de conexión al generar mes.');
    } finally {
      setGenerandoMes(null);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    try {
      localStorage.removeItem(OPERADOR_STORAGE_KEY);
      sessionStorage.removeItem(OPERADOR_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    navigate('/login', { replace: true });
  };

  // Validar y obtener info del operador al montar
  useEffect(() => {
    try {
      const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
      if (!sesion) {
        handleLogout();
        return;
      }
      const parsed = JSON.parse(sesion);
      const token = parsed?.token;
      const esJwtValido = typeof token === 'string' &&
        token.split('.').length === 3 &&
        !token.startsWith('op_local_');
      const esAdmin = parsed && (parsed.tipoUsuario === 2 || parsed.tipoUsuario === '2');

      if (!esAdmin || !esJwtValido) {
        handleLogout();
        return;
      }

      setOperadorInfo(parsed);
    } catch (e) {
      console.error('Error al inicializar sesión:', e);
      handleLogout();
    }
  }, []);

  // Cabeceras autenticadas
  const getAuthHeaders = () => {
    const sesion = localStorage.getItem(OPERADOR_STORAGE_KEY);
    const token = sesion ? JSON.parse(sesion)?.token : operadorInfo?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Cargar catálogo de estados desde la base de datos
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const res = await fetch('/usuario/estados');
        if (res.ok) {
          const data = await res.json();
          if (data && data.estados) {
            setEstadosCatalogo(data.estados);
          }
        }
      } catch (err) {
        console.error('Error al cargar catálogo de estados:', err);
      }
    };
    cargarEstados();
  }, []);

  // Formatear timestamp de fecha/hora de alta
  const formatearFechaHora = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${anio} ${hora}:${min} hs`;
    } catch {
      return dateStr;
    }
  };

  // Cargar lista de alumnos desde el backend
  const cargarAlumnos = async (offset = 0, query = '', currentLimit = limit) => {
    setCargandoAlumnos(true);
    try {
      const params = new URLSearchParams({
        tipoUsuario: '1',
        limit: currentLimit.toString(),
        skip: offset.toString(),
        orden: 'desc',
      });

      if (query.trim()) {
        params.append('nombre', query.trim());
      }

      const res = await fetch(`/usuario?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAlumnos(data);
          setTotalAlumnos(data.length);
        } else {
          setAlumnos(data.items || []);
          setTotalAlumnos(data.total !== undefined ? data.total : (data.items ? data.items.length : 0));
        }
      }
    } catch (err) {
      console.error('Error al cargar alumnos:', err);
    } finally {
      setCargandoAlumnos(false);
    }
  };

  // Carga inicial y debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkip(0);
      cargarAlumnos(0, busqueda, limit);
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, limit]);

  // Alternar estado activo / suspendido
  const handleToggleActivo = async (usuarioId) => {
    try {
      const res = await fetch(`/usuario/${usuarioId}/toggle-activo`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAlumnos((prev) =>
          prev.map((a) => (a.id === usuarioId ? {
            ...a,
            activo: data.activo,
            estadoId: data.activo ? 2 : 3,
            estadoCodigo: data.activo ? 'ACTIVO' : 'SUSPENDIDO'
          } : a))
        );
        showToast(data.activo ? 'Cuenta activada exitosamente' : 'Cuenta suspendida exitosamente');
      }
    } catch (err) {
      console.error('Error al cambiar estado activo:', err);
    }
  };

  // Cambiar estado dinámico del usuario según el catálogo
  const handleCambiarEstado = async (usuarioId, nuevoEstadoId) => {
    setCambiandoEstadoId(usuarioId);
    try {
      const res = await fetch(`/usuario/${usuarioId}/cambiar-estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado_id: nuevoEstadoId }),
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAlumnos((prev) =>
          prev.map((a) =>
            a.id === usuarioId
              ? {
                  ...a,
                  activo: data.activo,
                  estadoId: data.estado_id,
                  estadoCodigo: data.estado_codigo,
                }
              : a
          )
        );
        showToast(data.message || 'Estado actualizado con éxito');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || 'Error al cambiar estado');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showToast('Error de conexión con el servidor');
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  // Habilitar o inhabilitar un estado en el catálogo
  const handleToggleHabilitadoEstado = async (estadoId) => {
    setTogglingEstadoId(estadoId);
    try {
      const res = await fetch(`/usuario/estados/${estadoId}/toggle-habilitado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setEstadosCatalogo((prev) =>
          prev.map((est) =>
            est.id === estadoId ? { ...est, habilitado: data.habilitado } : est
          )
        );
        showToast(data.message || 'Estado actualizado');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.detail || 'No se pudo modificar el estado');
      }
    } catch (err) {
      console.error('Error al alternar habilitación:', err);
    } finally {
      setTogglingEstadoId(null);
    }
  };

  // Crear un nuevo estado en el catálogo
  const handleCrearEstado = async (e) => {
    e.preventDefault();
    setErrorEstado('');
    setExitoEstado('');
    if (!nuevoEstadoNombre.trim()) {
      setErrorEstado('El nombre del estado es obligatorio.');
      return;
    }
    setGuardandoEstado(true);
    try {
      const res = await fetch('/usuario/estados', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: nuevoEstadoNombre.trim(),
          codigo: nuevoEstadoCodigo.trim() || undefined,
          descripcion: nuevoEstadoDesc.trim(),
          color: nuevoEstadoColor,
          permite_login: nuevoEstadoPermiteLogin,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.estado) {
          setEstadosCatalogo((prev) => [...prev, data.estado]);
        }
        setExitoEstado(data.message || 'Estado creado con éxito');
        setNuevoEstadoNombre('');
        setNuevoEstadoCodigo('');
        setNuevoEstadoDesc('');
        setNuevoEstadoPermiteLogin(false);
        showToast('Nuevo estado agregado al catálogo');
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorEstado(errData.detail || 'Error al crear el estado');
      }
    } catch (err) {
      console.error('Error al crear estado:', err);
      setErrorEstado('Error de conexión con el servidor.');
    } finally {
      setGuardandoEstado(false);
    }
  };

  // Helper de estilos visuales para los badges y selectores
  const getEstadoColorStyles = (estadoId, estadoCodigo) => {
    if (estadoId === 2 || estadoCodigo === 'ACTIVO') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (estadoId === 1 || estadoCodigo === 'PENDIENTE_VERIFICACION') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (estadoId === 3 || estadoCodigo === 'SUSPENDIDO') {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500',
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (estadoCodigo === 'EN_REVISION') {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-500',
        dot: 'bg-blue-500',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
    return {
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-300 focus:ring-indigo-500',
      dot: 'bg-indigo-500',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  };

  // Reenviar código de activación a un alumno pendiente
  const handleReenviarCodigo = async (emailDestino, alumnoId) => {
    if (!emailDestino) return;
    setReenviandoEmailId(alumnoId);
    try {
      const res = await fetch('/api/auth/reenviar-codigo-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDestino }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Código reenviado a ${emailDestino}`);
      } else {
        alert(data.message || 'No se pudo reenviar el código');
      }
    } catch (err) {
      console.error('Error al reenviar código:', err);
      alert('Error de conexión al reenviar el código.');
    } finally {
      setReenviandoEmailId(null);
    }
  };

  // Generar y copiar Magic Link para cualquier alumno de la tabla
  const handleCopiarEnlaceFila = async (item) => {
    if (!item.codigoAcceso) return;
    setCopiandoLinkId(item.id);
    try {
      const res = await fetch('/api/auth/ingresar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: item.codigoAcceso.toString() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        const link = `${window.location.origin}/acceso?token=${data.token}`;
        await navigator.clipboard.writeText(link);
        setCopiadoLinkTablaId(item.id);
        setTimeout(() => setCopiadoLinkTablaId(null), 2000);
      } else {
        alert('No se pudo generar el enlace: ' + (data.message || 'Código inválido'));
      }
    } catch (err) {
      console.error('Error al generar enlace:', err);
      alert('Error de conexión al generar el enlace.');
    } finally {
      setCopiandoLinkId(null);
    }
  };

  // Copiar código PIN
  const handleCopiarPinFila = async (pin, id) => {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopiadoPinTablaId(id);
      setTimeout(() => setCopiadoPinTablaId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado local según estado
  const alumnosFiltrados = alumnos.filter((alumno) => {
    if (filtroEstado === 'TODOS') return true;
    if (filtroEstado === 'PENDIENTE') return alumno.estadoId === 1 || alumno.estadoCodigo === 'PENDIENTE_VERIFICACION';
    if (filtroEstado === 'ACTIVO') return alumno.estadoId === 2 || alumno.estadoCodigo === 'ACTIVO';
    if (filtroEstado === 'SUSPENDIDO') return alumno.estadoId === 3 || alumno.estadoCodigo === 'SUSPENDIDO';
    return true;
  });

  // Estadísticas rápidas
  const totalActivos = alumnos.filter((a) => a.estadoId === 2 || (a.activo && a.estadoId !== 1)).length;
  const totalPendientes = alumnos.filter((a) => a.estadoId === 1 || a.estadoCodigo === 'PENDIENTE_VERIFICACION').length;
  const totalSuspendidos = alumnos.filter((a) => a.estadoId === 3 || (!a.activo && a.estadoId !== 1)).length;

  // Cálculos de paginación
  const totalPaginas = Math.max(1, Math.ceil(totalAlumnos / limit));
  const paginaActual = Math.floor(skip / limit) + 1;

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    const nuevoSkip = (nuevaPagina - 1) * limit;
    setSkip(nuevoSkip);
    cargarAlumnos(nuevoSkip, busqueda, limit);
  };

  // Abrir Modal de Edición
  const handleAbrirModalEditar = (item) => {
    setAlumnoAEditar(item);
    setEditNombre(item.name || '');
    setEditEmail(item.email || '');
    setEditTelefono(item.telefono || '');
    setEditActivo(item.activo !== false);
    setEditEsBlack(Boolean(item.black));
    setEditSuscripcion(item.suscripcion || 'basica');
    setErrorEdicion('');
    setExitoEdicion('');
    setModalEditarAbierto(true);
  };

  // Guardar Cambios de Edición
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!alumnoAEditar) return;
    setGuardandoEdicion(true);
    setErrorEdicion('');
    setExitoEdicion('');

    try {
      const estadoActual = alumnoAEditar.activo !== false;
      if (editActivo !== estadoActual) {
        await fetch(`/usuario/${alumnoAEditar.id}/toggle-activo`, {
          method: 'PUT',
          headers: getAuthHeaders(),
        });
      }

      if (editSuscripcion !== (alumnoAEditar.suscripcion || 'basica')) {
        await fetch(`/api/admin/usuario/${alumnoAEditar.id}/suscripcion`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ suscripcion: editSuscripcion }),
        });
      }

      setExitoEdicion('Cambios guardados con éxito.');
      setTimeout(() => {
        setModalEditarAbierto(false);
        cargarAlumnos(skip, busqueda, limit);
      }, 700);
    } catch (err) {
      console.error('Error al guardar edición:', err);
      setErrorEdicion('Error al actualizar datos en el servidor.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Enviar formulario de Alta
  const handleAltaSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorModal('El nombre y apellido son obligatorios.');
      return;
    }

    setEnviandoAlta(true);
    setErrorModal('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: nombre.trim(),
          telefono: telefono.trim(),
          email: email.trim() || `${Date.now()}@alumno.com`,
          black: esBlack,
          activo: activarInmediato,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        const resultado = {
          id: data.user?.id || '—',
          name: data.user?.name || nombre.trim(),
          email: data.email || data.user?.email || email.trim(),
          codigoAcceso: data.user?.codigoAcceso || 'Recibido por correo',
          estado: data.status === 'PENDIENTE_VERIFICACION' ? 'Pendiente de verificación por email' : 'Activa',
        };

        setAltaExitosa(resultado);
        cargarAlumnos(0, busqueda, limit);
      } else {
        setErrorModal(data.detail || data.message || 'No se pudo crear el usuario.');
      }
    } catch (err) {
      console.error('Error al registrar alumno:', err);
      setErrorModal('Error al comunicarse con el servidor.');
    } finally {
      setEnviandoAlta(false);
    }
  };

  const getAvatarColor = (name) => {
    const colores = [
      'bg-blue-100 text-blue-700',
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-teal-100 text-teal-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colores[sum % colores.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckIcon size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#002B5E] to-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Torre de Control
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Mayores Actualizaciones · Administración Centralizada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAltaExitosa(null);
                setNombre('');
                setEmail('');
                setTelefono('');
                setEsBlack(false);
                setErrorModal('');
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <PlusIcon size={15} />
              <span>Nuevo Usuario</span>
            </button>

            <button
              onClick={() => {
                setErrorEstado('');
                setExitoEstado('');
                setModalEstadosAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <TagIcon size={15} />
              <span>Catálogo de Estados</span>
            </button>

            <button
              onClick={() => {
                setErrorDesafios('');
                setExitoDesafios('');
                setModalDesafiosAbierto(true);
                cargarEstadoDesafios(desafiosAnio, desafiosJuego);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <CalendarIcon size={15} />
              <span>Desafíos Diarios</span>
            </button>

            <button
              onClick={() => setModalEconomiaAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-xs cursor-pointer"
              title="Configuración de Vidas y Economía"
            >
              <CoinsIcon size={15} className="text-amber-600" />
              <span>Economía & Vidas</span>
            </button>

            <button
              onClick={() => {
                setUsuarioParaAsignar(null);
                setModalAsignarAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-800 font-bold text-xs transition shadow-xs cursor-pointer"
              title="Asignar vidas o puntos a un usuario (Herramienta de Testeo)"
            >
              <HeartIcon size={15} className="text-rose-500 fill-rose-500" />
              <span>Asignar Vidas & Puntos</span>
            </button>

            <button
              onClick={() => setModalNarrativoAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <BookOpenIcon size={15} />
              <span>Juego Narrativo</span>
            </button>

<button
              onClick={handleIrAAutenticador}
              disabled={saltandoSSO}
              title="Ir a la Torre de Control Central de Usuarios (SSO)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ShieldIcon size={15} />
              <span>{saltandoSSO ? 'Conectando...' : 'Gestión Central'}</span>
            </button>

            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer"
              title="Volver al menú de juegos"
            >
              <span>🎮 Ir a Juegos</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-red-600 font-semibold text-xs transition cursor-pointer"
            >
              <LogOutIcon size={15} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Registrados
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {totalAlumnos}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UsersIcon size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Cuentas Activas
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {totalActivos}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckIcon size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Pendientes de Email
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {totalPendientes}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MailIcon size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Suspendidas
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {totalSuspendidos}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangleIcon size={20} />
            </div>
          </div>
        </div>

        {/* TABLA DE USUARIOS Y FILTROS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* BARRA SUPERIOR DE FILTROS */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filtros por pestaña de estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setFiltroEstado('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroEstado === 'TODOS'
                    ? 'bg-[#002B5E] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({totalAlumnos})
              </button>
              <button
                onClick={() => setFiltroEstado('ACTIVO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroEstado === 'ACTIVO'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Activas ({totalActivos})
              </button>
              <button
                onClick={() => setFiltroEstado('PENDIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroEstado === 'PENDIENTE'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pendientes ({totalPendientes})
              </button>
              <button
                onClick={() => setFiltroEstado('SUSPENDIDO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filtroEstado === 'SUSPENDIDO'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Suspendidas ({totalSuspendidos})
              </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <SearchIcon size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, email o PIN..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">ALUMNO / JUGADOR</th>
                  <th className="py-3 px-4">EMAIL & CONTACTO</th>
                  <th className="py-3 px-4">FECHA DE ALTA</th>
                  <th className="py-3 px-4">CÓDIGO PIN</th>
                  <th className="py-3 px-4 w-60 min-w-[240px]">ESTADO</th>
                  <th className="py-3 px-5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargandoAlumnos ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-[#002B5E] mb-2"></div>
                      <p className="text-xs font-semibold">Cargando base de datos...</p>
                    </td>
                  </tr>
                ) : alumnosFiltrados.length > 0 ? (
                  alumnosFiltrados.map((item) => {
                    const inicial = (item.name || 'A').trim().charAt(0).toUpperCase();
                    const colorAvatar = getAvatarColor(item.name || '');
                    const esPendiente = item.estadoId === 1 || item.estadoCodigo === 'PENDIENTE_VERIFICACION';
                    const esActivo = item.estadoId === 2 || (item.activo && !esPendiente);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        {/* Alumno */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${colorAvatar} flex-shrink-0`}>
                              {inicial}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID #{item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4">
                          <span className="text-slate-700 block font-medium">
                            {item.email || '—'}
                          </span>
                          {item.telefono && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <PhoneIcon size={10} />
                              {item.telefono}
                            </span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                          {formatearFechaHora(item.dateStart)}
                        </td>

                        {/* PIN */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleCopiarPinFila(item.codigoAcceso, item.id)}
                            title="Clic para copiar PIN"
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-[#002B5E] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            <span>{item.codigoAcceso || '—'}</span>
                            {copiadoPinTablaId === item.id ? (
                              <CheckIcon size={12} className="text-emerald-600" />
                            ) : (
                              <CopyIcon size={12} className="text-slate-400" />
                            )}
                          </button>
                        </td>

                        {/* Estado con selector dinámico sin saltos de layout */}
                        <td className="py-3 px-4 w-60 min-w-[240px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="relative inline-block w-44">
                              <select
                                value={item.estadoId || 2}
                                disabled={cambiandoEstadoId === item.id}
                                onChange={(e) => handleCambiarEstado(item.id, Number(e.target.value))}
                                className={`w-full appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-50 ${
                                  getEstadoColorStyles(item.estadoId, item.estadoCodigo).bg
                                }`}
                              >
                                {estadosCatalogo
                                  .filter((est) => est.habilitado !== false || est.id === item.estadoId)
                                  .map((est) => (
                                    <option
                                      key={est.id}
                                      value={est.id}
                                      className="bg-white text-slate-900 font-semibold py-1"
                                    >
                                      {est.nombre}
                                    </option>
                                  ))}
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>

                            {/* Botón rápido para reenviar PIN si está en estado pendiente de verificación */}
                            {item.estadoId === 1 && (
                              <button
                                onClick={() => handleReenviarCodigo(item.email, item.id)}
                                disabled={reenviandoEmailId === item.id}
                                title="Reenviar código al correo del alumno"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition cursor-pointer flex-shrink-0"
                              >
                                <RefreshIcon
                                  size={13}
                                  className={reenviandoEmailId === item.id ? 'animate-spin' : ''}
                                />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopiarEnlaceFila(item)}
                              title="Copiar enlace de acceso directo (Magic Link)"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            >
                              {copiadoLinkTablaId === item.id ? (
                                <CheckIcon size={14} className="text-emerald-600" />
                              ) : (
                                <LinkIcon size={14} />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setUsuarioParaAsignar(item);
                                setModalAsignarAbierto(true);
                              }}
                              title="Asignar vidas o puntos a este usuario"
                              className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            >
                              <HeartIcon size={14} className="fill-rose-500" />
                            </button>

                            <button
                              onClick={() => handleAbrirModalEditar(item)}
                              title="Editar usuario"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            >
                              <EditIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <UsersIcon size={28} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">No se encontraron alumnos con los criterios seleccionados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* BARRA INFERIOR DE PAGINACIÓN */}
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
            <span>
              Mostrando {alumnosFiltrados.length} de {totalAlumnos} usuarios
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCambiarPagina(paginaActual - 1)}
                disabled={paginaActual <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition cursor-pointer"
              >
                Anterior
              </button>
              <span className="font-bold text-slate-800">
                Pág. {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => handleCambiarPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ALTA DE NUEVO USUARIO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {altaExitosa ? '¡Usuario Creado!' : 'Nuevo Alumno / Usuario'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            {altaExitosa ? (
              <div className="mt-5 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckIcon size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{altaExitosa.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{altaExitosa.email}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Código PIN Asignado
                  </span>
                  <span className="text-2xl font-black font-mono text-[#002B5E] block mt-1 tracking-widest">
                    {altaExitosa.codigoAcceso}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {altaExitosa.estado}
                </p>

                <button
                  onClick={() => setModalAbierto(false)}
                  className="w-full py-2.5 rounded-xl bg-[#002B5E] text-white font-bold text-xs hover:bg-slate-900 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleAltaSubmit} className="mt-5 space-y-4">
                {errorModal && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                    {errorModal}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Marta Gómez"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marta@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 11 4455-6677"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Activar cuenta inmediatamente</span>
                    <span className="text-[10px] text-slate-500 block">Si se desmarca, requerirá confirmar PIN por correo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activarInmediato}
                    onChange={(e) => setActivarInmediato(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Suscripción Black</span>
                    <span className="text-[10px] text-slate-500 block">Habilita contenidos y beneficios exclusivos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={esBlack}
                    onChange={(e) => setEsBlack(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoAlta}
                    className="px-5 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer"
                  >
                    {enviandoAlta ? 'Registrando...' : 'Dar de Alta'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {modalEditarAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Editar Alumno #{alumnoAEditar?.id}
              </h3>
              <button
                onClick={() => setModalEditarAbierto(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="mt-5 space-y-4">
              {errorEdicion && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                  {errorEdicion}
                </div>
              )}
              {exitoEdicion && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-semibold">
                  {exitoEdicion}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#002B5E] focus:outline-none transition"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Cuenta Activa</span>
                  <span className="text-[10px] text-slate-500 block">Habilitada para acceder</span>
                </div>
                <input
                  type="checkbox"
                  checked={editActivo}
                  onChange={(e) => setEditActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Suscripción a Desafíos</span>
                  <span className="text-[10px] text-slate-500 block">
                    {editSuscripcion === 'premium' ? '👑 Acceso total e ilimitado' : 'Básica (históricos con puntos)'}
                  </span>
                </div>
                <select
                  value={editSuscripcion}
                  onChange={(e) => setEditSuscripcion(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#002B5E]"
                >
                  <option value="basica">Básica</option>
                  <option value="premium">👑 Premium</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2 rounded-xl bg-[#002B5E] hover:bg-slate-900 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer"
                >
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATÁLOGO DE ESTADOS DE USUARIO */}
      {modalEstadosAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#002B5E] flex items-center justify-center">
                  <TagIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Catálogo de Estados de Usuario
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gestioná los estados disponibles, habilitá/inhabilitá opciones o creá nuevos estados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEstadosAbierto(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Sección: Crear Nuevo Estado */}
            <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                + Agregar Nuevo Estado al Catálogo
              </h4>
              <form onSubmit={handleCrearEstado} className="space-y-3">
                {errorEstado && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-semibold">
                    {errorEstado}
                  </div>
                )}
                {exitoEstado && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 font-semibold">
                    {exitoEstado}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nombre del Estado *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: En Revisión, En Pausa, Becado..."
                      value={nuevoEstadoNombre}
                      onChange={(e) => {
                        setNuevoEstadoNombre(e.target.value);
                        if (!nuevoEstadoCodigo || nuevoEstadoCodigo === nuevoEstadoNombre.toUpperCase().replace(/[^A-Z0-9_]/g, '_')) {
                          setNuevoEstadoCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-[#002B5E] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Código Técnico (Automático o custom)
                    </label>
                    <input
                      type="text"
                      placeholder="EJ: EN_REVISION"
                      value={nuevoEstadoCodigo}
                      onChange={(e) => setNuevoEstadoCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:border-[#002B5E] focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Breve explicación de cuándo aplica este estado..."
                    value={nuevoEstadoDesc}
                    onChange={(e) => setNuevoEstadoDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-[#002B5E] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={nuevoEstadoPermiteLogin}
                      onChange={(e) => setNuevoEstadoPermiteLogin(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-[11px]">Permite iniciar sesión a la plataforma</span>
                  </label>

                  <button
                    type="submit"
                    disabled={guardandoEstado || !nuevoEstadoNombre.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#002B5E] hover:bg-slate-900 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {guardandoEstado ? 'Guardando...' : 'Crear Estado'}
                  </button>
                </div>
              </form>
            </div>

            {/* Sección: Estados Existentes */}
            <div className="mt-5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Estados Registrados ({estadosCatalogo.length})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">ESTADO / NOMBRE</th>
                      <th className="py-2.5 px-3">CÓDIGO</th>
                      <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                      <th className="py-2.5 px-3 text-center">EN EL SELECT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estadosCatalogo.map((est) => {
                      const esProtegido = est.id === 1 || est.id === 2;
                      const styles = getEstadoColorStyles(est.id, est.codigo);
                      const estaHabilitado = est.habilitado !== false;

                      return (
                        <tr key={est.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            #{est.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${styles.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                              <span>{est.nombre}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] font-bold text-slate-600">
                            {est.codigo}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={est.descripcion}>
                            {est.descripcion || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {esProtegido ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[10px] border border-slate-200" title="Estado esencial del sistema">
                                Sistema
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleHabilitadoEstado(est.id)}
                                disabled={togglingEstadoId === est.id}
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                                  estaHabilitado
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                }`}
                              >
                                {togglingEstadoId === est.id
                                  ? '...'
                                  : estaHabilitado
                                  ? 'Habilitado'
                                  : 'Oculto'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalEstadosAbierto(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DESAFÍOS DIARIOS ================= */}
      {modalDesafiosAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-scale-in">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#002B5E] flex items-center justify-center shadow-xs">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Cobertura de Desafíos Diarios
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Auditoría y generación automática de puzzles mensuales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDesafiosAbierto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Selector de Juego y Año */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDesafiosJuego('sudoku');
                    cargarEstadoDesafios(desafiosAnio, 'sudoku');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    desafiosJuego === 'sudoku'
                      ? 'bg-[#002B5E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🧩 Sudoku
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesafiosJuego('wordle');
                    cargarEstadoDesafios(desafiosAnio, 'wordle');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    desafiosJuego === 'wordle'
                      ? 'bg-[#002B5E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📝 Palabra del Día
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesafiosJuego('sopa_letras');
                    cargarEstadoDesafios(desafiosAnio, 'sopa_letras');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    desafiosJuego === 'sopa_letras'
                      ? 'bg-[#002B5E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🔍 Sopa de Letras
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesafiosJuego('crucigrama');
                    cargarEstadoDesafios(desafiosAnio, 'crucigrama');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    desafiosJuego === 'crucigrama'
                      ? 'bg-[#002B5E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📰 Crucigrama
                </button>
              </div>

              <div className="flex items-center gap-2">
                {desafiosJuego === 'crucigrama' && (
                  <button
                    type="button"
                    onClick={() => setModalDisenadorAbierto(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                    title="Diseñar máscaras de tableros 7x7 y 11x11"
                  >
                    <LayersIcon size={14} />
                    Diseñar máscaras
                  </button>
                )}

                <select
                  value={desafiosAnio}
                  onChange={(e) => {
                    const anio = parseInt(e.target.value, 10);
                    setDesafiosAnio(anio);
                    cargarEstadoDesafios(anio, desafiosJuego);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#002B5E]"
                >
                  <option value={2026}>Año 2026</option>
                  <option value={2027}>Año 2027</option>
                </select>

                <button
                  type="button"
                  onClick={() => cargarEstadoDesafios(desafiosAnio, desafiosJuego)}
                  disabled={cargandoDesafios}
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Refrescar cobertura"
                >
                  <RefreshIcon size={16} className={cargandoDesafios ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Notificaciones */}
            {errorDesafios && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangleIcon size={16} />
                <span>{errorDesafios}</span>
              </div>
            )}
            {exitoDesafios && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckIcon size={16} />
                <span>{exitoDesafios}</span>
              </div>
            )}

            {/* Grilla de los 12 Meses */}
            <div className="flex-1 overflow-y-auto py-4">
              {cargandoDesafios ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Cargando estado de cobertura...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mesesDesafios.map((mes) => {
                    const estaGenerando = generandoMes === mes.month;

                    return (
                      <div
                        key={mes.month}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          mes.is_complete
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : mes.status === 'partial'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-xs text-slate-800">
                            {mes.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              mes.is_complete
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : mes.status === 'partial'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            {mes.is_complete
                              ? `✓ ${mes.generated_count}/${mes.days_in_month}`
                              : `${mes.generated_count}/${mes.days_in_month} días`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60">
                          <span className="text-[11px] text-slate-500">
                            {mes.is_complete ? 'Listo para jugar' : 'Sin publicar'}
                          </span>

                          {desafiosJuego === 'sudoku' || desafiosJuego === 'wordle' || desafiosJuego === 'sopa_letras' || desafiosJuego === 'crucigrama' ? (
                            <button
                              type="button"
                              onClick={() => handleGenerarMes(mes.month)}
                              disabled={estaGenerando || generandoMes !== null}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition shadow-xs cursor-pointer ${
                                estaGenerando
                                  ? 'bg-slate-200 text-slate-500 cursor-wait'
                                  : mes.is_complete
                                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  : 'bg-[#002B5E] text-white hover:bg-slate-900'
                              }`}
                            >
                              {estaGenerando
                                ? 'Generando...'
                                : mes.is_complete
                                ? 'Regenerar'
                                : 'Generar Mes'}
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              Base Sembrada
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                {desafiosJuego === 'crucigrama'
                  ? '💡 Los crucigramas se generan con Backtracking algorítmico, cruces válidos 7x7 y definiciones limpias de la RAE.'
                  : desafiosJuego === 'sudoku'
                  ? '💡 Los tableros de Sudoku se generan con semilla determinista garantizando solución única en sus 3 dificultades.'
                  : desafiosJuego === 'wordle'
                  ? '💡 Las palabras de Wordle se toman del banco ordenado por frecuencia real en español.'
                  : '💡 Las sopas de letras se generan procedimentalmente a partir de más de 60 temas culturales.'}
              </span>
              <button
                type="button"
                onClick={() => setModalDesafiosAbierto(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL JUEGO NARRATIVO */}
      <NarrativeAdminModal
        abierto={modalNarrativoAbierto}
        onCerrar={() => setModalNarrativoAbierto(false)}
      />
      {/* MODAL ECONOMIA & VIDAS */}
      <ModalEconomia
        abierto={modalEconomiaAbierto}
        onCerrar={() => setModalEconomiaAbierto(false)}
        onGuardadoExitoso={() => showToast('Economía actualizada correctamente')}
      />
      {/* MODAL ASIGNAR VIDAS & PUNTOS (TESTEO) */}
      <ModalAsignarEconomia
        abierto={modalAsignarAbierto}
        onCerrar={() => setModalAsignarAbierto(false)}
        usuarioInicial={usuarioParaAsignar}
        onActualizado={(res) => {
          showToast(res.message || 'Vidas y puntos actualizados');
          cargarAlumnos(skip, limit, busqueda, filtroEstado);
        }}
      />
      {/* MODAL DISEÑADOR DE MÁSCARAS DE CRUCIGRAMA */}
      <ModalDisenadorCrucigrama
        abierto={modalDisenadorAbierto}
        onCerrar={() => setModalDisenadorAbierto(false)}
      />
    </div>
  );
}
