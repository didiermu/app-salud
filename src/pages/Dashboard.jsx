import { useState } from 'react';
import { useUserStore, useHistoryStore, useRoutineStore } from '../store/useStore';
import { Activity, Dumbbell, History as HistoryIcon, TrendingUp, Trash2, Play, Calendar, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import CoachWidget from '../components/CoachWidget';
import clsx from 'clsx';

const Dashboard = () => {
  const { profile } = useUserStore();
  const { routines } = useRoutineStore();
  const { history, deleteSession, addSession } = useHistoryStore();
  
  const [modal, setModal] = useState({ isOpen: false, sessionId: null });
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regRoutineId, setRegRoutineId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegister = () => {
    if (!regRoutineId) return;
    const routine = routines.find(r => r.id === regRoutineId);
    addSession({
      routineName: routine.name,
      date: new Date(regDate + 'T12:00:00').toISOString(),
      exercisesCount: routine.exercises?.length || 0,
      status: 'Completado',
    });
    setRegRoutineId('');
    setShowSuccess(true);
    setShowAllHistory(false);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const sortedHistory = [...history].reverse();
  const visibleHistory = showAllHistory ? sortedHistory : sortedHistory.slice(0, 5);
  const hiddenCount = sortedHistory.length - 5;

  const stats = [
    { label: 'Peso Actual', value: `${profile.weight || 0} kg`, icon: <Activity className="text-neutral-500" /> },
    { label: 'Rutinas Creadas', value: routines.length, icon: <Dumbbell className="text-neutral-500" /> },
    { label: 'Sesiones Totales', value: history.length, icon: <HistoryIcon className="text-neutral-500" /> },
    { label: 'Estado IMC', value: profile.imcStatus || 'N/A', icon: <TrendingUp className="text-neutral-500" /> },
  ];

  const handleDeleteClick = (id) => {
    setModal({ isOpen: true, sessionId: id });
  };

  const confirmDelete = () => {
    if (modal.sessionId) {
      deleteSession(modal.sessionId);
    }
    setModal({ isOpen: false, sessionId: null });
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <header>
        <h2 className="text-4xl font-black text-neutral-900 uppercase tracking-tighter">Bienvenido, {profile.name || 'Atleta'}</h2>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">Aquí tienes un resumen de tu actividad.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 border-2 border-neutral-100 rounded-[2rem] flex items-center gap-6 shadow-sm hover:border-neutral-900 transition-colors">
            <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-900">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Registro de sesión */}
      <div className="bg-white border-2 border-neutral-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
            <Plus size={18} className="text-white" />
          </div>
          <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Registrar Sesión</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-1">Fecha</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ml-1">Rutina</label>
            <div className="relative">
              <Dumbbell size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <select
                value={regRoutineId}
                onChange={(e) => setRegRoutineId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-2xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors appearance-none"
              >
                <option value="">Seleccionar...</option>
                {routines.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleRegister}
            disabled={!regRoutineId}
            className={clsx(
              "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
              regRoutineId
                ? "bg-neutral-900 text-white hover:scale-105 active:scale-95 shadow-neutral-200"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
          >
            Registrar Sesión
          </button>
          {showSuccess && (
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 animate-in fade-in duration-300">¡Registrado!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recientes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Actividad Reciente</h3>
          </div>
          
          <div className="bg-white border-2 border-neutral-100 rounded-[2rem] overflow-hidden">
            {history.length > 0 ? (
              <div>
                <div className="divide-y divide-neutral-100">
                  {visibleHistory.map((session) => (
                  <div key={session.id} className="p-6 flex justify-between items-center group hover:bg-neutral-50 transition-colors relative">
                    <div className="flex-1 pr-12">
                      <h4 className="font-black text-neutral-900 text-xl uppercase tracking-tighter">{session.routineName}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm">
                           {new Date(session.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                           {session.exercisesCount} EJERCICIOS
                        </span>
                        <span className={clsx(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          session.status === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        )}>
                          {session.status || 'Completado'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteClick(session.id)}
                      className="absolute right-6 p-3 bg-white border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                      title="Eliminar registro"
                    >                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                </div>
                {hiddenCount > 0 && !showAllHistory && (
                  <button
                    onClick={() => setShowAllHistory(true)}
                    className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                  >
                    <ChevronDown size={14} /> Ver más ({hiddenCount} registros más)
                  </button>
                )}
                {showAllHistory && sortedHistory.length > 5 && (
                  <button
                    onClick={() => setShowAllHistory(false)}
                    className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                  >
                    <ChevronUp size={14} /> Ver menos
                  </button>
                )}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-transparent hover:border-neutral-200 transition-colors rounded-[2rem]">
                 <HistoryIcon size={48} className="text-neutral-200 mb-4" />
                 <p className="text-neutral-900 font-bold text-lg mb-1">Sin actividad registrada</p>
                 <p className="text-neutral-400 text-sm font-medium max-w-sm mb-6">Completa tu primera rutina de entrenamiento y tu progreso aparecerá aquí.</p>
                 <Link to="/routines" className="flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-neutral-200">
                    <Play size={14}/> Comenzar Rutina
                 </Link>
              </div>
            )}
          </div>
        </div>

        {/* Info lateral extra */}
        <div className="space-y-6">
          <CoachWidget />
          <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 leading-none">Tu<br/>Evolución</h3>
            <p className="text-neutral-400 font-medium text-sm leading-relaxed mb-8">
              Mantener un registro constante de tus entrenamientos es la clave para alcanzar tus objetivos. 
              ¡Sigue así!
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex-1 text-center border border-white/5">
                 <p className="text-3xl font-black text-white">{history.filter(h => h.status !== 'Incompleto').length}</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-1">Completas</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex-1 text-center border border-white/5">
                 <p className="text-3xl font-black text-white">{history.reduce((acc, curr) => acc + (curr.exercisesCount || 0), 0)}</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-1">Ejercicios</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación (UI) */}
      <Modal
        isOpen={modal.isOpen}
        type="confirm"
        title="¿Eliminar Registro?"
        message="Esta acción no se puede deshacer. Se borrará permanentemente de tus estadísticas."
        confirmLabel="Sí, Eliminar"
        onConfirm={confirmDelete}
        onClose={() => setModal({ isOpen: false, sessionId: null })}
      />
    </div>
  );
};

export default Dashboard;
