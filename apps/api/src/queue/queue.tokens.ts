// Tokens de inyección en un archivo aparte: el módulo y los
// processors se importan mutuamente, y los símbolos no pueden vivir
// en el módulo (circular → "Cannot access before initialization").
export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');
export const EMAIL_QUEUE = Symbol('EMAIL_QUEUE');
export const SCHEDULER_QUEUE = Symbol('SCHEDULER_QUEUE');
