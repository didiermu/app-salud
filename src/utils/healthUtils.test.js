import { describe, it, expect } from 'vitest';
import { calculateIMC } from './healthUtils';

describe('calculateIMC', () => {
  it('calcula el IMC con estado Normal', () => {
    expect(calculateIMC(70, 175)).toEqual({ score: 22.9, status: 'Normal' });
  });

  it('detecta Bajo peso', () => {
    expect(calculateIMC(50, 175)).toEqual({ score: 16.3, status: 'Bajo peso' });
  });

  it('detecta Sobrepeso', () => {
    expect(calculateIMC(80, 170)).toEqual({ score: 27.7, status: 'Sobrepeso' });
  });

  it('detecta Obesidad', () => {
    expect(calculateIMC(95, 160)).toEqual({ score: 37.1, status: 'Obesidad' });
  });

  it('retorna null cuando faltan datos', () => {
    expect(calculateIMC(0, 175)).toEqual({ score: null, status: '' });
    expect(calculateIMC(70, 0)).toEqual({ score: null, status: '' });
  });

  it('retorna null cuando los datos no son numéricos', () => {
    expect(calculateIMC('', '')).toEqual({ score: null, status: '' });
  });
});
