// TODO: ts-essentials does not support DeepOmit for __typename, using this instead util function instead
// https://github.com/krzkaczor/ts-essentials/issues/104

type Primitive =
  | string
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  | number
  | boolean
  | symbol
  | undefined
  | null;

type DeepOmitArray<T extends any[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>;
};

export type DeepOmit<T, K> = T extends Primitive
  ? T
  : {
      [P in Exclude<keyof T, K>]: T[P] extends infer TP
        ? TP extends Primitive
          ? TP // leave primitives and functions alone
          : TP extends any[]
          ? DeepOmitArray<TP, K> // Array special handling
          : DeepOmit<TP, K>
        : never;
    };
