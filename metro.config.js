/**
 * Configuración de Metro Bundler para Expo
 * Metro es el bundler de JavaScript que usa React Native para compilar el código
 */

// Importar la configuración por defecto de Expo
const { getDefaultConfig } = require("@expo/metro-config");

// Obtener la configuración base de Expo para este directorio
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Agregar soporte para archivos .cjs (CommonJS)
 * Esto permite importar módulos que usan la extensión .cjs
 */
defaultConfig.resolver.sourceExts.push("cjs");

/**
 * Deshabilitar la característica experimental de package exports
 * Esta opción es necesaria para garantizar compatibilidad con algunas
 * dependencias que no soportan completamente el nuevo sistema de exports
 * de Node.js (definido en package.json con "exports")
 */
defaultConfig.resolver.unstable_enablePackageExports = false;

// Exportar la configuración personalizada de Metro
module.exports = defaultConfig;
