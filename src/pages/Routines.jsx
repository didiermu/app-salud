import { useState, useEffect } from "react";
import { useRoutineStore, useHistoryStore } from "../store/useStore";
import { uploadToCloudinary } from "../services/cloudinaryService";
import { Dumbbell, Trash2, Play, Save, X, Plus, Edit2, CheckCircle2, ChevronUp, ChevronDown, Trophy, Upload, Loader2, Video } from 'lucide-react';
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import ExerciseLoadHistory from "../components/ExerciseLoadHistory";
import clsx from "clsx";

const Routines = () => {
    const { routines, selectedExercises, updateExerciseConfig, moveExercise, addRoutine, deleteRoutine, toggleSelection, editingRoutineId, loadRoutineForEditing, cancelEditing, editCustomExercise } = useRoutineStore();
    const { addExerciseSnapshot } = useHistoryStore();

    const [routineName, setRoutineName] = useState("");
    const [selectedExercise, setSelectedExercise] = useState(null);

    // Estado para el Modal Personalizado
    const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "", onConfirm: null });

    // Estado para el formulario de edición de ejercicios
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [editingCustomId, setEditingCustomId] = useState(null);
    const [customForm, setCustomForm] = useState({ name: '', description: '', target: '', bodyPart: '', equipment: '', imageUrl: '', videoUrl: '', hasTimer: false, timerDuration: 60 });
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const openEditForm = (ex) => {
        setCustomForm({
            name: ex.name || '',
            description: ex.description || '',
            target: ex.target || '',
            bodyPart: ex.bodyPart || '',
            equipment: ex.equipment || '',
            imageUrl: ex.imageUrl || '',
            videoUrl: ex.videoUrl || '',
            hasTimer: ex.hasTimer || false,
            timerDuration: ex.timerDuration || 60
        });
        setEditingCustomId(ex.id);
        setShowCustomForm(true);
    };

    const closeCustomForm = () => {
        setShowCustomForm(false);
        setEditingCustomId(null);
        setCustomForm({ name: '', description: '', target: '', bodyPart: '', equipment: '', imageUrl: '', videoUrl: '', hasTimer: false, timerDuration: 60 });
    };

    const handleCreateCustom = (e) => {
        e.preventDefault();
        if (!customForm.name) return;
        editCustomExercise(editingCustomId, customForm);
        closeCustomForm();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            return setModal({ isOpen: true, type: "info", title: "Imagen muy pesada", message: "Por favor sube una imagen de menos de 5MB." });
        }
        setUploadingBanner(true);
        try {
            const url = await uploadToCloudinary({ file, folder: 'banners' });
            setCustomForm(prev => ({ ...prev, imageUrl: url }));
        } catch (error) {
            setModal({ isOpen: true, type: "info", title: "Error", message: `No se pudo subir la imagen: ${error.message}` });
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            return setModal({ isOpen: true, type: "info", title: "Video muy pesado", message: "Por favor sube un video de menos de 50MB." });
        }
        setUploadingVideo(true);
        try {
            const url = await uploadToCloudinary({ file, folder: 'videos' });
            setCustomForm(prev => ({ ...prev, videoUrl: url }));
        } catch (error) {
            setModal({ isOpen: true, type: "info", title: "Error", message: `No se pudo subir el video: ${error.message}` });
        } finally {
            setUploadingVideo(false);
        }
    };

    // Ir al inicio de la página al abrir el editor de rutina
    useEffect(() => {
        if (editingRoutineId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [editingRoutineId]);

    // Sincronizar el nombre si estamos editando una rutina existente
    useEffect(() => {
        if (editingRoutineId) {
            const routineToEdit = routines.find((r) => r.id === editingRoutineId);
            if (routineToEdit) setRoutineName(routineToEdit.name);
        } else if (selectedExercises.length === 0) {
            setRoutineName("");
        }
    }, [editingRoutineId, routines, selectedExercises.length]);

    const handleSave = () => {
        if (!routineName.trim()) {
            return setModal({
                isOpen: true,
                type: "info",
                title: "Atención",
                message: "Por favor, dale un nombre a tu rutina antes de guardarla.",
            });
        }
        addRoutine(routineName);
        if (selectedExercises.length > 0) {
            addExerciseSnapshot(selectedExercises, routineName);
        }
        setRoutineName("");
        setModal({
            isOpen: true,
            type: "success",
            title: "¡Éxito!",
            message: editingRoutineId ? "La rutina ha sido actualizada correctamente." : "La rutina ha sido guardada correctamente.",
        });
    };

    const handleCancelEdit = () => {
        cancelEditing();
        setRoutineName("");
    };

    const confirmDelete = (id) => {
        setModal({
            isOpen: true,
            type: "confirm",
            title: "¿Eliminar Rutina?",
            message: "Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este plan de entrenamiento?",
            onConfirm: () => deleteRoutine(id),
        });
    };

    const isBuilding = selectedExercises.length > 0;

    return (
        <div className="space-y-12 pb-12">
            <div className={clsx("grid gap-12", isBuilding ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
                {/* Builder Section */}
                {isBuilding && (
                    <div className="lg:col-span-2 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-white border-2 border-neutral-900 shadow-2xl rounded-2xl p-8 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-neutral-900" />
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                    <Plus size={24} className="text-neutral-400" />
                                    {editingRoutineId ? "Editando Rutina" : "Nuevo Plan"}
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="bg-neutral-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-600">
                                        {selectedExercises.length} Ejercicios
                                    </span>
                                    <button onClick={handleCancelEdit} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase">
                                        Cancelar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Nombre de la Rutina</label>
                                    <input
                                        type="text"
                                        value={routineName}
                                        onChange={(e) => setRoutineName(e.target.value)}
                                        placeholder="Ej. Full Body Lunes"
                                        className="w-full text-2xl font-bold bg-transparent border-b-2 border-neutral-100 focus:border-neutral-900 outline-none pb-2 transition-all placeholder:text-neutral-200"
                                    />
                                </div>

                                <div className="space-y-4">
                                    {selectedExercises.map((ex) => (
                                        <div key={ex.id} onClick={() => setSelectedExercise(ex)} className="group bg-neutral-50 border border-neutral-100 rounded-xl p-4 flex flex-col gap-4 relative cursor-pointer hover:border-neutral-300 transition-colors">
                                            <div onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveExercise(ex.id, -1); }}
                                                    disabled={selectedExercises.findIndex(e => e.id === ex.id) === 0}
                                                    className="p-1.5 text-neutral-300 hover:text-neutral-700 hover:bg-white rounded-full transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                                    title="Mover arriba"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveExercise(ex.id, 1); }}
                                                    disabled={selectedExercises.findIndex(e => e.id === ex.id) === selectedExercises.length - 1}
                                                    className="p-1.5 text-neutral-300 hover:text-neutral-700 hover:bg-white rounded-full transition-colors disabled:opacity-20 disabled:pointer-events-none"
                                                    title="Mover abajo"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleSelection(ex); }}
                                                    className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-white rounded-full transition-colors"
                                                    title="Eliminar de la rutina"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-4 w-full pr-8">
                                                {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} className="w-12 h-12 rounded-lg object-cover mix-blend-multiply flex-shrink-0" />}
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-neutral-800 capitalize">{ex.name}</h4>
                                                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-tighter">{ex.target}</p>
                                                </div>
                                            </div>

                                            <div onClick={(e) => e.stopPropagation()} className="flex flex-wrap gap-2 items-center w-full">
                                                <div className="flex flex-col flex-1 min-w-[60px]">
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1">Series</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={ex.sets ?? ''}
                                                        onChange={(e) => updateExerciseConfig(ex.id, "sets", e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-center font-bold text-sm focus:border-neutral-900 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-[60px]">
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1">Reps</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={ex.reps ?? ''}
                                                        onChange={(e) => updateExerciseConfig(ex.id, "reps", e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-center font-bold text-sm focus:border-neutral-900 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-[70px]">
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1">Peso (kg)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={ex.weight ?? ''}
                                                        onChange={(e) => updateExerciseConfig(ex.id, "weight", e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-center font-bold text-sm focus:border-neutral-900 outline-none transition-colors text-blue-600"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-[70px]">
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1">Descanso (s)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="10"
                                                        value={ex.rest ?? ''}
                                                        onChange={(e) => updateExerciseConfig(ex.id, "rest", e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full bg-white border border-neutral-200 rounded-lg p-2 text-center font-bold text-sm focus:border-neutral-900 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-[70px]">
                                                    <label className="text-[9px] font-black uppercase text-neutral-400 mb-1">Timer Set</label>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => updateExerciseConfig(ex.id, "hasTimer", !ex.hasTimer)}
                                                            className={clsx(
                                                                "flex-1 rounded-lg p-2 flex items-center justify-center transition-all border",
                                                                ex.hasTimer ? "bg-blue-600 text-white border-blue-600" : "bg-white text-neutral-400 border-neutral-200"
                                                            )}
                                                        >
                                                            {ex.hasTimer ? <CheckCircle2 size={16} /> : <X size={16} />}
                                                        </button>
                                                        {ex.hasTimer && (
                                                            <input
                                                                type="number"
                                                                min="5"
                                                                step="5"
                                                                value={ex.timerDuration ?? ''}
                                                                onChange={(e) => updateExerciseConfig(ex.id, "timerDuration", e.target.value === '' ? '' : Number(e.target.value))}
                                                                className="w-16 bg-blue-50 border border-blue-200 rounded-lg p-2 text-center font-bold text-sm text-blue-600 focus:border-blue-600 outline-none transition-colors"
                                                                title="Segundos de duración del ejercicio"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <ExerciseLoadHistory exerciseName={ex.name} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-neutral-100">
                                    <Link
                                        to="/catalog"
                                        className="flex-1 py-4 bg-neutral-100 text-neutral-600 font-bold rounded-xl flex items-center justify-center hover:bg-neutral-200 transition-all text-sm uppercase tracking-widest"
                                    >
                                        + Añadir Más
                                    </Link>
                                    <button
                                        onClick={handleSave}
                                        className="flex-[2] py-4 bg-neutral-900 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 uppercase tracking-widest text-sm"
                                    >
                                        <Save size={18} /> {editingRoutineId ? "Guardar Cambios" : "Guardar Rutina"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Saved Routines List (Mis Planes) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-neutral-200 pb-4">
                        <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Mis Planes</h3>
                        {!isBuilding && (
                            <Link to="/catalog" className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1">
                                <Plus size={14} /> Crear Nuevo
                            </Link>
                        )}
                    </div>

                    <div className={clsx("grid gap-6", !isBuilding && routines.length > 0 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                        {routines.length > 0 ? (
                            routines.map((routine) => (
                                <div
                                    key={routine.id}
                                    className="bg-white border-2 border-neutral-100 p-6 rounded-[2rem] flex flex-col hover:border-neutral-300 hover:shadow-2xl transition-all group relative"
                                >
                                    {/* Actions Menu */}
                                    <div className="absolute top-6 right-6 flex gap-2">
                                        <button
                                            onClick={() => loadRoutineForEditing(routine.id)}
                                            className="p-2 bg-neutral-100 text-neutral-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors shadow-sm"
                                            title="Editar rutina"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(routine.id)}
                                            className="p-2 bg-neutral-100 text-neutral-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-sm"
                                            title="Eliminar rutina"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-black text-neutral-900 text-2xl uppercase tracking-tighter leading-none mb-2 pr-16">{routine.name}</h4>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-6">{routine.exercises.length} ejercicios</p>

                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {routine.exercises.slice(0, 3).map((ex, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden border-2 border-white ring-1 ring-neutral-100" title={ex.name}>
                                                    {ex.imageUrl ? (
                                                        <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover mix-blend-multiply" />
                                                    ) : (
                                                        <Dumbbell size={16} className="m-auto mt-1 opacity-50" />
                                                    )}
                                                </div>
                                            ))}
                                            {routine.exercises.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-black border-2 border-white ring-1 ring-neutral-100">
                                                    +{routine.exercises.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Link
                                        to={`/workout/${routine.id}`}
                                        className="w-full py-4 bg-neutral-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-neutral-200"
                                    >
                                        <Play size={16} /> Iniciar Rutina
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-neutral-50 py-20 rounded-[3rem] text-center border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center">
                                <Dumbbell size={48} className="text-neutral-300 mb-4" />
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">Aún no tienes rutinas</h3>
                                <p className="text-sm text-neutral-400 font-medium mb-8 max-w-sm mx-auto">Agrega ejercicios desde el catálogo para construir tu primer plan de entrenamiento.</p>
                                <Link
                                    to="/catalog"
                                    className="px-8 py-4 bg-neutral-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-neutral-200"
                                >
                                    Explorar Catálogo
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Edición de Ejercicio */}
            {showCustomForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm" onClick={closeCustomForm} />
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-black text-neutral-900 uppercase tracking-tighter mb-8">
                            Editar Ejercicio
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Equipo</label>
                                    <input 
                                        type="text" 
                                        value={customForm.equipment}
                                        onChange={e => setCustomForm(prev => ({ ...prev, equipment: e.target.value }))}
                                        className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl px-6 py-4 focus:border-neutral-900 outline-none transition-all font-bold text-sm"
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
                                    Actualizar Ejercicio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Detalles del Ejercicio */}
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
                                    onClick={() => setSelectedExercise(null)}
                                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 bg-neutral-900 text-white shadow-neutral-300 hover:bg-black"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal UI */}
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

export default Routines;
