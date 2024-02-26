import { Prom, FalseyValues } from "./common";
import { Result } from "./result";

export type OkAsync<T> = ResultTypeAsync<T, never>;
export type ErrAsync<E> = ResultTypeAsync<never, E>;
export type ResultAsync<T, E> = ResultTypeAsync<T, E>;

class ResultTypeAsync<T, E> {
  readonly [Prom]: Promise<Result<T, E>>;

  constructor(producer: Promise<Result<T, E>>) {
    this[Prom] = producer;
  }

  /**
    * Returns a `Promise` that resolves to the contained `T` (if `Ok`),
    * or `err` otherwise. The `err` value must be falsey and defaults to `undefined`.
    *
    * ```
    * const x = OkAsync(1);
    * x
    *   .into()
    *   .then((val) => assert.equal(val), 1);
    *
    * const x = ErrAsync(1);
    * x
    *   .into()
    *   .then((val) => assert.equal(val), undefined);
    *
    * const x = Err(1);
    * x
    *   .into(null)
    *   .then((val) => assert.equal(val), null);
    * ```
    */
  async into(this: ResultAsync<T, E>): Promise<T | undefined>;
  async into<U extends FalseyValues>(this: ResultAsync<T, E>, err: U): Promise<T | U>;
  async into(this: ResultAsync<T, E>, err?: FalseyValues): Promise<T | FalseyValues> {
    return this[Prom].then((res) => res.into(err));
  }

  /**
    * Returns a `Promise` that resolves to tuple of `[null, T]` (if `Ok`),
    * or `[E, null]` otherwise.
    *
    * ```
    * const x: ResultAsync<number, string> = OkAsync(1);
    * x
    *   .intoTuple()
    *   .then((val) => assert.deepEqual(val, [null, 1]));
    *
    * const x: Result<number, string> = ErrAsync("error")
    * x
    *   .intoTuple()
    *   .then((val) => assert.deepEqual(val, ["error", null]));
    * ```
    */
  async intoTuple(this: ResultAsync<T, E>): Promise<[null, T] | [E, null]> {
    return this[Prom].then((res) => res.intoTuple());
  }

  /**
    * Returns a `Promise` that resolves to true (if `Ok`).
    *
    * ```
    * const x = OkAsync(10);
    * x
    *   .isOk()
    *   .then((ok) => assert.equal(ok, true));
    *
    * const x = ErrAsync(10);
    * x
    *   .isOk()
    *   .then((ok) => assert.equal(ok, false));
    * ```
    */
  async isOk(this: ResultAsync<T, E>): Promise<boolean> {
    return this[Prom].then((res) => res.isOk());
  }

 /**
  * Returns a `Promise` that resolves to true (if `Ok` and the value inside of it matches a predicate).
  *
  * ```
  * const x = OkAsync(10);
  * x
  *   .isOkAnd((val) => val === 10)
  *   .then((ok) => assert.equal(ok, true));
  *
  * const x = ErrAsync(10);
  * x
  *   .isOkAnd((val) => val === 10)
  *   .then((ok) => assert.equal(ok, false));
  * ```
  */
  async isOkAnd(this: ResultAsync<T, E>, f: (val: T) => boolean): Promise<boolean> {
    return this[Prom].then((res) => res.isOkAnd(f));
  }

 /**
  * Returns a `Promise` that resolves to true (if `Err`).
  *
  * ```
  * const x = OkAsync(10);
  * x
  *   .isErr()
  *   .then((err) => assert.equal(err, false));
  *
  * const x = ErrAsync(10);
  * x
  *   .isErr()
  *   .then((err) => assert.equal(err, true));
  * ```
  */
  async isErr(this: ResultAsync<T, E>): Promise<boolean> {
    return this[Prom].then((res) => res.isErr());
  }

 /**
  * Returns a `Promise` that resolves to true (if `Err` and the value inside of it matches a predicate).
  *
  * ```
  * const x = OkAsync(10);
  * x
  *   .isErrAnd((err) => err === 10)
  *   .then((err) => assert.equal(err, false));
  *
  * const x = ErrAsync(10);
  * x
  *   .isErrAnd((err) => err === 10)
  *   .then((err) => assert.equal(err, true));
  * ```
  */
  async isErrAnd(this: ResultAsync<T, E>, f: (err: E) => boolean): Promise<boolean> {
    return this[Prom].then((res) => res.isErrAnd(f));
  }
}
