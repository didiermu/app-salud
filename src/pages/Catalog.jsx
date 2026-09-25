import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchAllExercises } from '../services/exerciseService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { Search, Info, Plus, Loader2, X, Dumbbell, Trophy, Edit2, CheckCircle2, RotateCw, Video } from 'lucide-react';
import { useRoutineStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import clsx from 'clsx';

const Catalog = () => {
  const navigate = useNavigate();
  const [apiExercises, setApiExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', description: '', target: '', bodyPart: '', equipment: '', imageUrl: '', videoUrl: '' });
  const [editingCustomId, setEditingCustomId] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "", onConfirm: null });
  
  const loaderRef = useRef(null);
  const { toggleSelection, selectedExercises, customExercises, addCustomExercise, deleteCustomExercise, editCustomExercise } = useRoutineStore();
  const ITEMS_PER_PAGE = 12;

  const isSelected = (id) => selectedExercises.some(e => e.id === id);

  // Unificamos ejercicios de la API y los personalizados
  const allExercises = useMemo(() => {
    return [...customExercises, ...apiExercises];
  }, [customExercises, apiExercises]);

  // 1. Carga inicial de todo el catálogo masivo
  const load = async () => {
    setLoading(true);
    setError(false);
    const data = await fetchAllExercises();
    if (data.length === 0) {
      setError(true);
    } else {
      setApiExercises(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, []);

  // 2. BÚSQUEDA GLOBAL: Filtramos sobre la lista completa 'allExercises'
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allExercises;
    
    return allExercises.filter(ex => 
      (ex.name || '').toLowerCase().includes(term) ||
      (ex.target || '').toLowerCase().includes(term) ||
      (ex.bodyPart || '').toLowerCase().includes(term) ||
      (ex.equipment || '').toLowerCase().includes(term)
    );
  }, [allExercises, searchTerm]);

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customForm.name) return;
    
    if (editingCustomId) {
      editCustomExercise(editingCustomId, customForm);
    } else {
      addCustomExercise(customForm);
    }
    
    closeCustomForm();
  };

  const openEditForm = (ex) => {
    setCustomForm({
      name: ex.name || '',
      description: ex.description || '',
      target: ex.target || '',
      bodyPart: ex.bodyPart || '',
      equipment: ex.equipment || '',
      imageUrl: ex.imageUrl || '',
      videoUrl: ex.videoUrl || ''
    });
    setEditingCustomId(ex.id);
    setShowCustomForm(true);
  };

  const closeCustomForm = () => {
    setShowCustomForm(false);
    setEditingCustomId(null);
    setCustomForm({ name: '', description: '', target: '', bodyPart: '', equipment: '', imageUrl: '', videoUrl: '', hasTimer: false, timerDuration: 60 });
  };

  const confirmDeleteCustomExercise = (id) => {
    setModal({
      isOpen: true,
      type: "confirm",
      title: "¿Eliminar Ejercicio?",
      message: "Esta acción no se puede deshacer y eliminará el ejercicio de las rutinas actuales que lo contengan. ¿Estás seguro?",
      onConfirm: () => deleteCustomExercise(id),
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return setModal({
        isOpen: true,
        type: "info",
        title: "Imagen muy pesada",
        message: "Por favor sube una imagen de menos de 5MB.",
      });
    }

    setUploadingBanner(true);
    try {
      const url = await uploadToCloudinary({ file, folder: 'banners' });
      setCustomForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      setModal({
        isOpen: true,
        type: "info",
        title: "No se pudo subir",
        message: `No se pudo subir la imagen a Cloudinary: ${error.message}`,
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return setModal({
        isOpen: true,
        type: "info",
        title: "Video muy pesado",
        message: "Por favor sube un video de menos de 50MB.",
      });
    }

    setUploadingVideo(true);
    try {
      const url = await uploadToCloudinary({ file, folder: 'videos' });
      setCustomForm(prev => ({ ...prev, videoUrl: url }));
    } catch (error) {
      setModal({
        isOpen: true,
        type: "info",
        title: "No se pudo subir",
        message: `No se pudo subir el video a Cloudinary: ${error.message}`,
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  // Si cambia el término de búsqueda, reiniciamos la página a 1
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // 3. PAGINACIÓN: Solo tomamos una porción de la lista filtrada para renderizar
  const displayExercises = useMemo(() => {
    return filteredExercises.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredExercises, page]);

  // Observer para el infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && displayExercises.length < filteredExercises.length) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, displayExercises.length, filteredExercises.length]);

  return (
    <div className="space-y-8 pb-20">
      {/* Indicador Flotante */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 backdrop-blur-xl bg-opacity-90 border border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Seleccionados</span>
            <span className="text-sm font-bold">{selectedExercises.length} ejercicios</span>
          </div>
          <button 
            onClick={() => navigate('/routines')}
            className="bg-white text-neutral-900 px-6 py-2 rounded-full text-xs font-black uppercase hover:scale-105 transition-transform active:scale-95"
          >
            Configurar Rutina
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-neutral-100 flex flex-col md:flex-row md:items-end justify-between gap-8 py-6 px-4 -mx-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-neutral-900 tracking-tighter uppercase leading-none">Catálogo</h2>
          <div className="flex items-center gap-4">
            <p className="text-neutral-400 font-bold uppercase text-xs tracking-[0.3em]">{filteredExercises.length} ejercicios disponibles</p>
            <button 
              onClick={() => { setEditingCustomId(null); setShowCustomForm(true); }}
              className="bg-neutral-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={12} /> Crear Personalizado
            </button>
          </div>
        </div>
        
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Músculo, ejercicio o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-5 bg-white border-2 border-neutral-100 rounded-[2rem] focus:outline-none focus:border-neutral-900 transition-all shadow-sm group-hover:shadow-md"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white border-2 border-neutral-50 rounded-[2.5rem] overflow-hidden animate-pulse">
              <div className="h-64 bg-neutral-100" />
              <div className="p-8 space-y-4">
                <div className="h-4 bg-neutral-100 rounded-full w-3/4" />
                <div className="h-3 bg-neutral-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Info size={48} className="mb-4 opacity-50" />
          <p className="font-bold text-lg">No se pudo cargar el catálogo</p>
          <p className="text-sm mb-8">Revisa tu conexión a internet e intenta nuevamente.</p>
          <button
            onClick={load}
            className="bg-neutral-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2"
          >
            <RotateCw size={14} /> Reintentar
          </button>
        </div>
      ) : displayExercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Info size={48} className="mb-4 opacity-50" />
          <p className="font-bold text-lg">No se encontraron ejercicios</p>
          <p className="text-sm">Intenta con otra palabra clave</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayExercises.map((ex) => (
            <div key={ex.id} className={clsx(
              "bg-white border-2 rounded-[2.5rem] overflow-hidden flex flex-col group transition-all duration-500 relative",
              isSelected(ex.id) ? "border-neutral-900 shadow-2xl scale-[1.02]" : "border-neutral-50 hover:border-neutral-200 hover:shadow-2xl"
            )}>
              {ex.id.toString().startsWith('custom-') && (
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditForm(ex); }}
                    className="p-2 bg-blue-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); confirmDeleteCustomExercise(ex.id); }}
                    className="p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    title="Eliminar"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="h-64 bg-neutral-100 relative overflow-hidden cursor-pointer" onClick={() => setSelectedExercise(ex)}>
                {/* Usamos imageUrl (Estático) */}
                {ex.imageUrl ? (
                  <img 
                    src={ex.imageUrl} 
                    alt={ex.name} 
                    className="w-full h-full object-cover opacity-90 transition-all duration-1000 mix-blend-multiply"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <Dumbbell size={64} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-neutral-900 shadow-xl">
                    {ex.target || 'Personalizado'}
                  </span>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h4 className="text-xl font-bold text-neutral-900 mb-2 capitalize line-clamp-1">{ex.name}</h4>
                <div className="flex items-center gap-2 mb-8">
                  <Dumbbell size={14} className="text-neutral-300" />
                  <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">{ex.equipment}</p>
                </div>
                
                <div className="mt-auto flex items-center justify-between gap-4">
                  <button 
                    onClick={() => setSelectedExercise(ex)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-900 transition-all border-b-2 border-transparent hover:border-neutral-900 pb-1"
                  >
                    Detalles
                  </button>
                  <button 
                    onClick={() => toggleSelection(ex)}
                    className={clsx(
                      "p-4 rounded-3xl transition-all shadow-xl",
                      isSelected(ex.id) ? "bg-red-500 text-white shadow-red-200 rotate-45" : "bg-neutral-900 text-white shadow-neutral-400 hover:bg-neutral-800"
                    )}
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite Scroll Loader */}
      <div ref={loaderRef} className="h-20 flex items-center justify-center">
        {!loading && displayExercises.length < filteredExercises.length && (
          <div className="flex items-center gap-4 text-neutral-300">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      {/* Modal de Ejercicio Personalizado */}
      {showCustomForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" onClick={closeCustomForm} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-500">
            <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-8">
              {editingCustomId ? "Editar Ejercicio" : "Nuevo Ejercicio"}
            </h3>
            <form onSubmit={handleCreateCustom} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Nombre del Ejercicio</label>
                <input 
                  required
                  type="text" 
                  value={customForm.name}
                  onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold"
                  placeholder="Ej. Plancha Lateral"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Descripción</label>
                <textarea 
                  value={customForm.description}
                  onChange={e => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold text-sm resize-none"
                  placeholder="Ej. Mantén el cuerpo recto, apoya los antebrazos..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Músculo</label>
                  <input 
                    type="text" 
                    value={customForm.target}
                    onChange={e => setCustomForm(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold text-sm"
                    placeholder="Ej. Abdominales"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Equipo</label>
                  <input 
                    type="text" 
                    value={customForm.equipment}
                    onChange={e => setCustomForm(prev => ({ ...prev, equipment: e.target.value }))}
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold text-sm"
                    placeholder="Ej. Ninguno"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border-2 border-neutral-100 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={clsx(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-all border-2",
                    customForm.hasTimer ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-neutral-300 group-hover:border-blue-500"
                  )}>
                    {customForm.hasTimer && <CheckCircle2 size={16} />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={customForm.hasTimer} 
                    onChange={e => setCustomForm(prev => ({ ...prev, hasTimer: e.target.checked }))} 
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Es un ejercicio por tiempo</span>
                </label>
                
                {customForm.hasTimer && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300 pl-9">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Duración por Serie (Segundos)</label>
                    <input 
                      type="number" 
                      min="5"
                      value={customForm.timerDuration ?? ''}
                      onChange={e => setCustomForm(prev => ({ ...prev, timerDuration: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="w-full bg-white border-2 border-neutral-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all font-bold text-sm text-blue-600"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center block">
                  Banner (Imagen) y Video (Opcionales)
                </label>
                <div className="flex gap-4">
                  <label className={clsx(
                    "flex-1 cursor-pointer bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-neutral-900 transition-all group",
                    uploadingBanner && "opacity-50 pointer-events-none"
                  )}>
                    {uploadingBanner ? <Loader2 className="text-blue-500 mb-1 animate-spin" /> : <Plus className="text-neutral-300 group-hover:text-neutral-900 mb-1" />}
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 text-center">{uploadingBanner ? "Subiendo..." : "Subir Banner"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <label className={clsx(
                    "flex-1 cursor-pointer bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-neutral-900 transition-all group",
                    uploadingVideo && "opacity-50 pointer-events-none"
                  )}>
                    {uploadingVideo ? <Loader2 className="text-blue-500 mb-1 animate-spin" /> : <Video size={20} className="text-neutral-300 group-hover:text-neutral-900 mb-1" />}
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 text-center">{uploadingVideo ? "Subiendo..." : "Subir Video"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                </div>
                {customForm.imageUrl && (
                  <div className="mt-4 h-20 rounded-xl overflow-hidden border-2 border-neutral-100">
                    <img src={customForm.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
                {customForm.videoUrl && (
                  <div className="mt-4 flex items-center gap-2 px-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-green-600">
                      Video Subido a la nube
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomForm(prev => ({ ...prev, videoUrl: '' }))}
                      className="text-[8px] font-black uppercase text-red-400 hover:text-red-600 ml-auto"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">URL del Video (YouTube, MP4, etc)</label>
                  <input 
                    type="text" 
                    value={customForm.videoUrl}
                    onChange={e => setCustomForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={closeCustomForm}
                  className="flex-1 py-4 bg-neutral-100 text-neutral-500 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-neutral-900 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-neutral-200 hover:bg-black transition-all"
                >
                  {editingCustomId ? "Actualizar Ejercicio" : "Guardar Ejercicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" onClick={() => setSelectedExercise(null)} />
          <div className="bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[2rem] overflow-y-auto shadow-2xl relative z-10 flex flex-col md:flex-row">
            
            <button 
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full z-20 transition-colors text-neutral-600"
            >
              <X size={20} />
            </button>

            {/* Imagen / Video */}
            <div className="w-full md:w-1/2 bg-neutral-100 relative min-h-[300px]">
               {selectedExercise.videoUrl ? (
                 <video
                   src={selectedExercise.videoUrl}
                   controls
                   autoPlay
                   playsInline
                   muted
                   className="w-full h-full object-cover"
                   poster={selectedExercise.imageUrl || undefined}
                 />
               ) : selectedExercise.imageUrl ? (
                 <img 
                    src={selectedExercise.imageUrl} 
                    className="w-full h-full object-cover mix-blend-multiply" 
                    alt={selectedExercise.name} 
                  />
               ) : (
                 <div className="w-full h-full min-h-[300px] flex items-center justify-center text-neutral-300">
                   <Dumbbell size={80} />
                 </div>
               )}
            </div>
            
            {/* Info Lateral */}
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col">
              <h3 className="text-4xl font-black text-neutral-900 capitalize tracking-tighter mb-2 leading-tight">
                {selectedExercise.name}
              </h3>
              {selectedExercise.description && (
                <p className="text-2xl text-neutral-900 leading-relaxed mb-6">{selectedExercise.description}</p>
              )}
              
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="bg-neutral-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Dumbbell className="text-neutral-500" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{selectedExercise.equipment}</span>
                </div>
                <div className="bg-neutral-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Trophy className="text-neutral-500" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{selectedExercise.bodyPart} ({selectedExercise.target})</span>
                </div>
              </div>

              {selectedExercise.instructions && selectedExercise.instructions.length > 0 ? (
                <div className="space-y-4 mb-8 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Instrucciones</h4>
                  <ul className="space-y-3">
                    {selectedExercise.instructions.map((step, idx) => (
                      <li key={idx} className="text-sm text-neutral-600 flex gap-3">
                        <span className="font-bold text-neutral-900">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-8">
                   <p className="text-neutral-400 text-sm italic">No hay instrucciones detalladas para este ejercicio.</p>
                </div>
              )}

              <div className="pt-6 border-t border-neutral-100 mt-auto space-y-3">
                <button 
                  onClick={() => { openEditForm(selectedExercise); setSelectedExercise(null); }}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Editar Ejercicio
                </button>
                <button 
                  onClick={() => { toggleSelection(selectedExercise); setSelectedExercise(null); }}
                  className={clsx(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95",
                    isSelected(selectedExercise.id) 
                      ? "bg-red-50 text-red-600 shadow-none border-2 border-red-100 hover:bg-red-100" 
                      : "bg-neutral-900 text-white shadow-neutral-300 hover:bg-black"
                  )}
                >
                  {isSelected(selectedExercise.id) ? 'Quitar de la Rutina' : 'Añadir a la Rutina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Global (UI) */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default Catalog;
