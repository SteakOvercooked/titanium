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

  /**
   * Return the contained `T`, or `none` if the option is `None`. The `none`
   * value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x: Option<number> = Some(1);
   * assert.equal(x.into(), 1);
   *
   * const x: Option<number> = None;
   * assert.equal(x.into(), undefined);
   *
   * const x: Option<number> = None;
   * assert.equal(x.into(null), null);
   * ```
   */
  async into(this: OptionAsync<T>): Promise<T | undefined>;
  async into<U extends FalseyValues>(this: OptionAsync<T>, none: U): Promise<T | U>;
  async into(this: OptionAsync<T>, none?: FalseyValues): Promise<T | FalseyValues> {
    return this.then((opt) => opt.into(none));
  }

  /**
   * Returns true if the Option is `Some` and acts as a type guard.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.Is(), true);
   *
   * const x: Option<number> = None;
   * assert.equal(x.Is(), false);
   * ```
   */
  async isSome(this: OptionAsync<T>): Promise<boolean> {
    return this.then((opt) => opt.isSome());
  }

  /**
   * Returns true if the Option is `None` and acts as a type guard.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.isNone(), false);
   *
   * const x: Option<number> = None;
   * assert.equal(x.isNone(), true);
   * ```
   */
  async isNone(this: OptionAsync<T>): Promise<boolean> {
    return this.then((opt) => opt.isNone());
  }

}
