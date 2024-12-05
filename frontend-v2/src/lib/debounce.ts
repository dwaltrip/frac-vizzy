// NOTE: This exists to allow importing with named imports.
// Supposedly, the @types/debounce package allows this, which looks true.
// But the actual debounce package also has an index.d.ts file that doesn't,
// And VS Code seems to default to that type declaration file.
import debounce from 'debounce';

export { debounce };
