import ts from 'typescript';

/**
 * Transformador TypeScript para Vitest basado en `typescript.transpileModule`.
 *
 * Motivo: en esta maquina los binarios nativos de SWC fallan al cargar
 * (`@swc/core` rechaza el SID heredado `S-1-15-3-...` de los DACL de AppData),
 * asi que no se puede usar `unplugin-swc` como transformador de los tests.
 *
 * Ademas, esbuild (transformador por defecto de Vite) no emite metadatos de
 * decoradores (`emitDecoratorMetadata`) y por tanto rompe la inyeccion de
 * dependencias de NestJS. Este plugin compila con el mismo compilador que
 * `nest build`, asi que lo que pasa en tests es lo mismo que corre en produccion.
 *
 * Mantener sincronizado con `tsconfig.json`: `target`, `experimentalDecorators`
 * y `emitDecoratorMetadata`.
 */
export function tscTransform() {
  return {
    name: 'cordel-tsc-transform',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const path = id.split('?', 1)[0];
      if (!path.endsWith('.ts') || path.endsWith('.d.ts') || path.includes('node_modules')) {
        return null;
      }
      const output = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          inlineSourceMap: true,
          inlineSources: true,
        },
        fileName: path,
      });
      return { code: output.outputText };
    },
  };
}