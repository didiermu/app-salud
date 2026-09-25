/**
 * Calcula el Índice de Masa Corporal (IMC)
 * @param {number} weight - Peso en kg
 * @param {number} height - Altura en cm
 * @returns {Object} - Objeto con imc y estado
 */
export const calculateIMC = (weight, height) => {
  if (!weight || !height) return { score: null, status: '' };
  
  const heightInMeters = height / 100;
  const score = (weight / (heightInMeters * heightInMeters)).toFixed(1);
  
  let status = '';
  if (score < 18.5) status = 'Bajo peso';
  else if (score < 25) status = 'Normal';
  else if (score < 30) status = 'Sobrepeso';
  else status = 'Obesidad';
  
  return { score: parseFloat(score), status };
};
