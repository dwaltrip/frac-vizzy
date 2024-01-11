// See: https://github.com/microsoft/TypeScript/issues/10725#issuecomment-290159469
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export { type DeepReadonly };
