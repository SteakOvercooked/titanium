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
   * Returns a `Promise` that resolves to `T` (if `Ok`),
   * or `err` otherwise. The `err` value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x = OkAsync(1);
   * assert.equal(await x.into(), 1);
   *
   * const x = ErrAsync(1);
   * assert.equal(await x.into(), undefined);
   *
   * const x = Err(1);
   * assert.equal(await x.into(null), null);
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
   * assert.deepEqual(await x.intoTuple(), [null, 1]);
   *
   * const x: Result<number, string> = ErrAsync("error")
   * assert.deepEqual(await x.intoTuple(), ["error", null]);
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
   * assert.equal(await x.isOk(), true);
   *
   * const x = ErrAsync(10);
   * assert.equal(await x.isOk(), false);
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
   * assert.equal(await x.isOkAnd((val) === 10), true);
   *
   * const x = ErrAsync(10);
   * assert.equal(await x.isOkAnd((val) === 10), false);
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
   * assert.equal(await x.isErr(), false);
   *
   * const x = ErrAsync(10);
   * assert.equal(await x.isErr(), true);
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
   * assert.equal(await x.isErrAnd((err) => err === 10), false);
   *
   *  const x = ErrAsync(10);
   *  assert.equal(await x.isErrAnd((err) => err === 10), true);
   * ```
   */
  async isErrAnd(this: ResultAsync<T, E>, f: (err: E) => boolean): Promise<boolean> {
    return this[Prom].then((res) => res.isErrAnd(f));
  }

  /**
   * Creates an `Option<T>` by calling `f` with the contained `Ok` value.
   * Converts `Ok` to `Some` if the filter returns true, or `None` otherwise.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Ok(1);
   * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
   *
   * const x = Ok(10);
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   *
   * const x = Err(1);
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   * ```
   */
  // filter(this: ResultAsync<T, E>, f: (val: T) => boolean): Option<T> {
  //   return this[T] && f(this[Val] as T) ? Some(this[Val] as T) : None;
  // }

  /**
   * Flatten a nested `Result<Result<T, E>, F>` to a `Result<T, E | F>`.
   *
   * ```
   * type NestedResult = Result<Result<string, number>, boolean>;
   *
   * const x: NestedResult = Ok(Ok(1));
   * assert.equal(x.flatten().unwrap(), 1);
   *
   * const x: NestedResult = Ok(Err(1));
   * assert.equal(x.flatten().unwrapErr(), 1);
   *
   * const x: NestedResult = Err(false);
   * assert.equal(x.flatten().unwrapErr(), false);
   * ```
   */
  // flatten<U, F>(this: ResultAsync<Result<U, F>, E>): Result<U, E | F> {
    
  //   return this[T] ? (this[Val] as Result<U, F>) : (this as Err<E>);
  // }

  /**
   * Returns a `Promise` that resolves with `T` (if `Ok`), otherwise throws `Error` with
   * the message including passed `msg` and the content of the `Err`.
   *
   * To avoid throwing, consider `isErr`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `Err` case.
   * 
   * To control the error representation use `mapErr`.
   *
   * ```
   * const x = OkAsync(1);
   * assert.equal(await x.expect("Was Err"), 1);
   *
   * const x = ErrAsync("something went wrong");
   * await x.expect("Was Err"); // throws "Was Err: something went wrong"
   * ```
   */
  async expect(this: ResultAsync<T, E>, msg: string): Promise<T> {
    return this[Prom].then((res) => res.expect(msg));
  }

  /**
   * Returns a `Promise` that resolves with `E` (if `Err`), or throws `Error` with the message
   * including passed `msg` and `T` otherwise.
   *
   * To avoid throwing, consider `isOk` or `match` to handle the `Ok` case.
   * 
   * ```
   * const x = OkAsync(1);
   * await x.expectErr("value should not be present"); // throws "value should not be present: 1"
   *
   * const x = ErrAsync("value is undefined");
   * assert.equal(await x.expectErr("value should not be present"), "value is undefined");
   * ```
   */
  async expectErr(this: ResultAsync<T, E>, msg: string): Promise<E> {
    return this[Prom].then((res) => res.expectErr(msg));
  }
}
