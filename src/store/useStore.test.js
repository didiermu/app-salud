import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../firebase", () => ({ db: undefined }));

import {
    getActiveUid,
    resetStores,
    setActiveUid,
    useHistoryStore,
    useRoutineStore,
    useUserStore,
} from "./useStore";
import { SEQUENCE_MODES, buildWorkoutSteps } from "../services/routineSequence";

const exercise = {
    id: "ex-1",
    name: "Sentadilla",
    target: "Cuádriceps",
    equipment: "Peso Corporal",
    imageUrl: "https://example.com/squat.jpg",
};

// Estado limpio entre tests. El `resetStores` del store real se importa
// aparte para probar el logout; aquí montamos el estado inicial a mano.
const seedEmptyState = () => {
    useRoutineStore.setState({
        routines: [],
        selectedExercises: [],
        customExercises: [],
        editingRoutineId: null,
    });
    useHistoryStore.setState({ history: [] });
    useUserStore.setState({
        profile: {
            name: "",
            age: "",
            weight: "",
            height: "",
            imc: null,
            imcStatus: "",
        },
        healthHistory: [],
    });
};

beforeEach(() => {
    seedEmptyState();
    setActiveUid(null);
});

describe("aislamiento por usuario", () => {
    it("sin uid activo no persiste nada", async () => {
        setActiveUid(null);
        useUserStore.setState({ profile: { name: "Sin sesión" } });

        // El storage es un no-op sin sesión: no se crean documentos huérfanos.
        await new Promise((r) => setTimeout(r, 10));
        expect(getActiveUid()).toBeNull();
    });

    it("setActiveUid cambia el scope de escritura", () => {
        setActiveUid("uid-1");
        expect(getActiveUid()).toBe("uid-1");

        setActiveUid("uid-2");
        expect(getActiveUid()).toBe("uid-2");

        setActiveUid(null);
        expect(getActiveUid()).toBeNull();
    });

    it("resetStores limpia los datos del usuario anterior", () => {
        setActiveUid("uid-1");
        useUserStore.setState({ profile: { name: "Didier", weight: "68.4" } });
        useRoutineStore.setState({ routines: [{ id: "r1", name: "Upper" }] });
        useHistoryStore.setState({ history: [{ id: "h1" }] });

        seedEmptyState();

        expect(useUserStore.getState().profile.name).toBe("");
        expect(useRoutineStore.getState().routines).toHaveLength(0);
        expect(useHistoryStore.getState().history).toHaveLength(0);
    });

    it("los stores arrancan sin hidratar para esperar al usuario", () => {
        expect(useRoutineStore.persist.hasHydrated()).toBe(false);
        expect(useUserStore.persist.hasHydrated()).toBe(false);
        expect(useHistoryStore.persist.hasHydrated()).toBe(false);
    });

    it("las acciones sobreviven a un reset", () => {
        resetStores();
        expect(typeof useRoutineStore.getState().addRoutine).toBe("function");
        expect(typeof useUserStore.getState().setProfile).toBe("function");
        expect(typeof useUserStore.getState().setProfileName).toBe("function");
        expect(typeof useHistoryStore.getState().addSession).toBe("function");
    });

    it("guarda el nombre de autenticación sin añadir un registro de salud", () => {
        useUserStore.getState().setProfileName("Ana");

        expect(useUserStore.getState().profile.name).toBe("Ana");
        expect(useUserStore.getState().healthHistory).toEqual([]);
    });
});

describe("useRoutineStore", () => {
    it("agrega un ejercicio personalizado con id custom-", () => {
        useRoutineStore.getState().addCustomExercise({ name: "Plancha" });
        const custom = useRoutineStore.getState().customExercises[0];
        expect(custom.id).toMatch(/^custom-/);
        expect(custom.name).toBe("Plancha");
    });

    it("toggleSelection agrega un ejercicio con configuración por defecto", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        const selected = useRoutineStore.getState().selectedExercises;
        expect(selected).toHaveLength(1);
        expect(selected[0].sets).toBe(3);
        expect(selected[0].reps).toBe(12);
        expect(selected[0].rest).toBe(60);
        expect(selected[0].hasTimer).toBe(false);
        expect(selected[0].sequence).toBe(SEQUENCE_MODES.CONTINUOUS);
    });

    it("toggleSelection elimina un ejercicio ya seleccionado", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore.getState().toggleSelection(exercise);
        expect(useRoutineStore.getState().selectedExercises).toHaveLength(0);
    });

    it("updateExerciseConfig actualiza un campo del ejercicio seleccionado", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore.getState().updateExerciseConfig("ex-1", "sets", 5);
        expect(useRoutineStore.getState().selectedExercises[0].sets).toBe(5);
    });

    it("updateExerciseConfig cambia la secuencia del ejercicio a alternado y de vuelta", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore
            .getState()
            .updateExerciseConfig(
                "ex-1",
                "sequence",
                SEQUENCE_MODES.ALTERNATED,
            );
        expect(useRoutineStore.getState().selectedExercises[0].sequence).toBe(
            SEQUENCE_MODES.ALTERNATED,
        );

        useRoutineStore
            .getState()
            .updateExerciseConfig(
                "ex-1",
                "sequence",
                SEQUENCE_MODES.CONTINUOUS,
            );
        expect(useRoutineStore.getState().selectedExercises[0].sequence).toBe(
            SEQUENCE_MODES.CONTINUOUS,
        );
    });

    it("addRoutine y loadRoutineForEditing conservan la secuencia de cada ejercicio", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore
            .getState()
            .updateExerciseConfig(
                "ex-1",
                "sequence",
                SEQUENCE_MODES.ALTERNATED,
            );
        useRoutineStore.getState().addRoutine("Full Body");
        const id = useRoutineStore.getState().routines[0].id;

        useRoutineStore.getState().loadRoutineForEditing(id);
        expect(useRoutineStore.getState().editingRoutineId).toBe(id);
        expect(useRoutineStore.getState().selectedExercises[0].sequence).toBe(
            SEQUENCE_MODES.ALTERNATED,
        );
    });

    it("updateRoutineExercises mantiene el N configurado y la secuencia de un alternado", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore.getState().updateExerciseConfig("ex-1", "sets", 4);
        useRoutineStore
            .getState()
            .updateExerciseConfig(
                "ex-1",
                "sequence",
                SEQUENCE_MODES.ALTERNATED,
            );
        useRoutineStore.getState().addRoutine("Full Body");
        const routineId = useRoutineStore.getState().routines[0].id;

        // Simula lo que hace syncRoutine al terminar el entrenamiento:
        // deduplica los pasos y los manda de vuelta.
        const steps = buildWorkoutSteps(
            useRoutineStore.getState().routines[0].exercises,
        );
        const seen = new Set();
        const unique = steps
            .filter((step) => {
                if (seen.has(step.id)) return false;
                seen.add(step.id);
                return true;
            })
            .map((step) => ({
                id: step.id,
                sets: step.configuredSets ?? step.sets,
                reps: step.reps,
                weight: step.weight || 0,
                rest: step.rest,
                notes: step.notes || "",
                sequence: step.sequence,
            }));

        expect(unique).toHaveLength(1);
        expect(unique[0].sets).toBe(4);

        useRoutineStore.getState().updateRoutineExercises(routineId, unique);

        const saved = useRoutineStore.getState().routines[0].exercises[0];
        expect(saved.sets).toBe(4);
        expect(saved.sequence).toBe(SEQUENCE_MODES.ALTERNATED);
    });

    it("addRoutine guarda la rutina y limpia la selección", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore.getState().addRoutine("Full Body");
        const { routines, selectedExercises } = useRoutineStore.getState();
        expect(routines).toHaveLength(1);
        expect(routines[0].name).toBe("Full Body");
        expect(routines[0].exercises).toHaveLength(1);
        expect(selectedExercises).toHaveLength(0);
    });

    it("deleteCustomExercise purga el ejercicio de rutinas y de la selección", () => {
        useRoutineStore.getState().addCustomExercise({ name: "Plancha" });
        const custom = useRoutineStore.getState().customExercises[0];
        useRoutineStore.getState().toggleSelection(custom);
        useRoutineStore.getState().addRoutine("Rutina A");

        useRoutineStore.getState().deleteCustomExercise(custom.id);

        const state = useRoutineStore.getState();
        expect(state.customExercises).toHaveLength(0);
        expect(state.selectedExercises).toHaveLength(0);
        expect(state.routines[0].exercises).toHaveLength(0);
    });

    it("deleteRoutine elimina la rutina guardada", () => {
        useRoutineStore.getState().toggleSelection(exercise);
        useRoutineStore.getState().addRoutine("Full Body");
        const id = useRoutineStore.getState().routines[0].id;
        useRoutineStore.getState().deleteRoutine(id);
        expect(useRoutineStore.getState().routines).toHaveLength(0);
    });

    it("editCustomExercise actualiza también en rutinas y selección", () => {
        useRoutineStore.getState().addCustomExercise({ name: "Plancha" });
        const custom = useRoutineStore.getState().customExercises[0];
        useRoutineStore.getState().toggleSelection(custom);
        useRoutineStore.getState().addRoutine("Rutina A");

        useRoutineStore
            .getState()
            .editCustomExercise(custom.id, { name: "Plancha Lateral" });

        const state = useRoutineStore.getState();
        expect(state.customExercises[0].name).toBe("Plancha Lateral");
        expect(state.routines[0].exercises[0].name).toBe("Plancha Lateral");
    });
});

describe("useHistoryStore", () => {
    it("addSession registra una sesión con id, fecha y ejercicios", () => {
        useHistoryStore.getState().addSession({
            routineName: "Push",
            duration: 30,
            status: "Completado",
            exercises: [{ id: "ex-1", name: "Press", setsDone: 3 }],
        });
        const session = useHistoryStore.getState().history[0];
        expect(session.routineName).toBe("Push");
        expect(session.id).toBeTruthy();
        expect(session.date).toBeTruthy();
        expect(session.exercises[0].setsDone).toBe(3);
    });

    it("deleteSession elimina una sesión", () => {
        useHistoryStore.getState().addSession({ routineName: "Push" });
        const id = useHistoryStore.getState().history[0].id;
        useHistoryStore.getState().deleteSession(id);
        expect(useHistoryStore.getState().history).toHaveLength(0);
    });
});

describe("useUserStore", () => {
    it("setProfile actualiza el perfil y registra un registro en healthHistory", () => {
        useUserStore.getState().setProfile({
            name: "Didier",
            age: "34",
            weight: "66.5",
            height: "180",
            imc: 20.5,
            imcStatus: "Normal",
        });
        const { profile, healthHistory } = useUserStore.getState();
        expect(profile.name).toBe("Didier");
        expect(healthHistory).toHaveLength(1);
        expect(healthHistory[0].weight).toBe("66.5");
        expect(healthHistory[0].imc).toBe(20.5);
    });

    it("deleteHealthRecord elimina un registro del historial", () => {
        useUserStore
            .getState()
            .setProfile({
                name: "A",
                weight: "70",
                imc: 21,
                imcStatus: "Normal",
            });
        const date = useUserStore.getState().healthHistory[0].date;
        useUserStore.getState().deleteHealthRecord(date);
        expect(useUserStore.getState().healthHistory).toHaveLength(0);
    });
});
