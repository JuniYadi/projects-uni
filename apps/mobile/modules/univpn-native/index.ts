// Re-export the native module. On web, it will be resolved to UnivpnNativeModule.web.ts
// and on native platforms to UnivpnNativeModule.ts
export { default } from './src/UnivpnNativeModule';
export * from './src/UnivpnNative.types';
