/**
 * Utilidades de validación para datos ecuatorianos
 */

/**
 * Valida una cédula ecuatoriana usando el algoritmo módulo 10
 * 
 * Reglas de validación:
 * - Debe tener exactamente 10 dígitos
 * - Los dos primeros dígitos son el código de provincia (01-24)
 * - El tercer dígito debe ser menor a 6
 * - El décimo dígito es el verificador (algoritmo módulo 10)
 * 
 * @param cedula - Número de cédula a validar
 * @returns true si la cédula es válida, false si no
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  // Eliminar espacios y guiones
  cedula = cedula?.replace(/[\s-]/g, '') || '';

  // Verificar que tenga 10 dígitos
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Obtener código de provincia (primeros 2 dígitos)
  const provincia = parseInt(cedula.substring(0, 2), 10);
  
  // Verificar código de provincia válido (01-24)
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // Verificar tercer dígito (debe ser menor a 6 para personas naturales)
  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) {
    return false;
  }

  // Algoritmo de validación módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    
    // Si el resultado es mayor a 9, restar 9
    if (valor > 9) {
      valor -= 9;
    }
    
    suma += valor;
  }

  // Calcular dígito verificador
  const residuo = suma % 10;
  const digitoVerificadorCalculado = residuo === 0 ? 0 : 10 - residuo;
  
  // Obtener dígito verificador de la cédula
  const digitoVerificador = parseInt(cedula[9], 10);

  return digitoVerificadorCalculado === digitoVerificador;
}

/**
 * Obtiene información de la provincia a partir de la cédula
 * 
 * @param cedula - Número de cédula
 * @returns Nombre de la provincia o null si es inválido
 */
export function obtenerProvinciaDesdeeCedula(cedula: string): string | null {
  const provincias: { [key: number]: string } = {
    1: 'Azuay',
    2: 'Bolívar',
    3: 'Cañar',
    4: 'Carchi',
    5: 'Cotopaxi',
    6: 'Chimborazo',
    7: 'El Oro',
    8: 'Esmeraldas',
    9: 'Guayas',
    10: 'Imbabura',
    11: 'Loja',
    12: 'Los Ríos',
    13: 'Manabí',
    14: 'Morona Santiago',
    15: 'Napo',
    16: 'Pastaza',
    17: 'Pichincha',
    18: 'Tungurahua',
    19: 'Zamora Chinchipe',
    20: 'Galápagos',
    21: 'Sucumbíos',
    22: 'Orellana',
    23: 'Santo Domingo de los Tsáchilas',
    24: 'Santa Elena',
  };

  cedula = cedula?.replace(/[\s-]/g, '') || '';
  
  if (!/^\d{10}$/.test(cedula)) {
    return null;
  }

  const codigoProvincia = parseInt(cedula.substring(0, 2), 10);
  return provincias[codigoProvincia] || null;
}

/**
 * Mensaje de error descriptivo para cédula inválida
 * 
 * @param cedula - Número de cédula
 * @returns Mensaje de error específico o null si es válida
 */
export function obtenerErrorCedula(cedula: string): string | null {
  cedula = cedula?.replace(/[\s-]/g, '') || '';

  if (!cedula) {
    return 'La cédula es requerida';
  }

  if (!/^\d+$/.test(cedula)) {
    return 'La cédula solo debe contener números';
  }

  if (cedula.length !== 10) {
    return 'La cédula debe tener exactamente 10 dígitos';
  }

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return 'El código de provincia es inválido (debe ser 01-24)';
  }

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) {
    return 'El tercer dígito de la cédula es inválido';
  }

  if (!validarCedulaEcuatoriana(cedula)) {
    return 'El dígito verificador de la cédula es incorrecto';
  }

  return null;
}
