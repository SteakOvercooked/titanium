import { Prom, FalseyValues } from "./common";
import { Option } from "./option";

export type OptionAsync<T> = OptionTypeAsync<T>;

export class OptionTypeAsync<T> {
  readonly [Prom]: Promise<Option<T>>;

  constructor(producer: Promise<Option<T>>) {
    this[Prom] = producer;
  }

  then<A, B>(
    onSuccess?: (res: Option<T>) => A | PromiseLike<A>,
    onFailure?: (err: unknown) => B | PromiseLike<B>,
  ): Promise<A | B> {
    return this[Prom].then(onSuccess, onFailure);
  }
}
