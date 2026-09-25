import { useState } from 'react';
import { useUserStore } from '../store/useStore';
import { calculateIMC } from '../utils/healthUtils';
import { User, Scale, Ruler, Calendar, History, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import clsx from 'clsx';

const Profile = () => {
  const { profile, setProfile, healthHistory, deleteHealthRecord } = useUserStore();
  const [formData, setFormData] = useState(profile);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [recordToDelete, setRecordToDelete] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    
    if (name === 'weight' || name === 'height') {
      const { score, status } = calculateIMC(updatedData.weight, updatedData.height);
      updatedData.imc = score;
      updatedData.imcStatus = status;
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.weight || !formData.height) {
        return setModal({
            isOpen: true, type: 'info', title: 'Datos Incompletos',
            message: 'Por favor rellena todos los campos para poder guardar tu progreso.'
        });
    }
    setProfile(formData);
    setModal({
        isOpen: true, type: 'success', title: '¡Actualizado!',
        message: 'Tus datos de salud han sido guardados y registrados en el historial.'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase">Tu Perfil</h2>
        <p className="text-neutral-500 font-medium">Gestiona tus medidas y visualiza tu evolución física.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO IZQUIERDO: FORMULARIO Y ESTADO ACTUAL */}
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IMC Card */}
                <div className="bg-neutral-900 text-white p-8 rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Índice de Masa Corporal</span>
                    <span className="text-7xl font-black tracking-tighter">{formData.imc || '--'}</span>
                    <div className={clsx(
                        "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                        formData.imcStatus === 'Normal' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                    )}>
                        {formData.imcStatus || 'Sin calcular'}
                    </div>
                </div>

                {/* Resumen Rápido */}
                <div className="bg-white border-2 border-neutral-100 p-8 rounded-[2rem] flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
                            <Scale size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Peso Actual</p>
                            <p className="text-2xl font-black text-neutral-900">{formData.weight || '0'} <span className="text-sm font-bold text-neutral-300">kg</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400">
                            <Ruler size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Altura</p>
                            <p className="text-2xl font-black text-neutral-900">{formData.height || '0'} <span className="text-sm font-bold text-neutral-300">cm</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={handleSubmit} className="bg-white border-2 border-neutral-900 p-10 rounded-[2.5rem] shadow-xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-neutral-900" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <User size={14} /> Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 outline-none pb-2 transition-all"
                    placeholder="Ej. Alex Smith"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Calendar size={14} /> Edad
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 outline-none pb-2 transition-all"
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Scale size={14} /> Peso (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 outline-none pb-2 transition-all"
                    placeholder="70.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Ruler size={14} /> Altura (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 outline-none pb-2 transition-all"
                    placeholder="175"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-6 bg-neutral-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Actualizar Datos y Registrar
              </button>
            </form>
        </div>

        {/* LADO DERECHO: HISTORIAL DE REGISTROS */}
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter flex items-center gap-3">
                    <History size={24} className="text-neutral-400" /> Historial
                </h3>
                <span className="text-[10px] font-black text-neutral-400 uppercase bg-neutral-100 px-3 py-1 rounded-full">
                    {healthHistory.length} Registros
                </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {healthHistory.length > 0 ? (
                    healthHistory.map((record) => (
                        <div key={record.date} className="bg-white border border-neutral-100 p-5 rounded-3xl hover:border-neutral-900 transition-all group relative">
                            <button
                                onClick={() => setRecordToDelete(record.date)}
                                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 transition-all bg-neutral-50 hover:bg-red-50 rounded-full"
                            >                                <Trash2 size={14} />
                            </button>
                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-3">
                                {new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-black text-neutral-900">{record.weight}<span className="text-xs ml-1 text-neutral-300">kg</span></p>
                                    <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">Peso registrado</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-neutral-900">{record.imc}</p>
                                    <p className={clsx(
                                        "text-[8px] font-black uppercase tracking-tighter",
                                        record.imcStatus === 'Normal' ? "text-green-500" : "text-orange-500"
                                    )}>{record.imcStatus}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-neutral-50 p-10 rounded-[2rem] text-center border-2 border-dashed border-neutral-200">
                        <Info size={32} className="mx-auto text-neutral-200 mb-4" />
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                            Aquí aparecerá tu evolución física cada vez que actualices tus datos.
                        </p>
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* Modal de Confirmación (UI) */}
      <Modal
        isOpen={Boolean(recordToDelete)}
        type="confirm"
        title="¿Eliminar Registro?"
        message="Esta acción no se puede deshacer. Se borrará permanentemente de tu historial de evolución."
        confirmLabel="Sí, Eliminar"
        onConfirm={() => deleteHealthRecord(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
      />

      {/* Modal UI */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default Profile;
