/** Ordena las rutinas por fecha de creación, dejando las antiguas sin fecha al final. */
export const sortRoutinesNewestFirst = (routines = []) =>
  [...routines].sort((a, b) => {
    const dateA = Date.parse(a?.createdAt ?? '') || 0;
    const dateB = Date.parse(b?.createdAt ?? '') || 0;
    return dateB - dateA;
  });
