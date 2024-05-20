import {
  T,
  Val,
  Prom,
  EmptyArray,
  IterType,
  FalseyValues,
  isTruthy,
  Sync,
} from "./common";
import { Option, OptionAsync, OptionTypeAsync, Some, None } from "./option";

export type Ok<T> = ResultType<T, never>;
export type Err<E> = ResultType<never, E>;
export type Result<T, E> = ResultType<T, E>;
export type ResultAsync<T, E> = ResultTypeAsync<T, E>;

type From<T> = Exclude<T, Error | FalseyValues>;

type ResultTypes<R> = {
  [K in keyof R]: R[K] extends Result<infer T, any> ? T : never;
};

type ResultErrors<R> = {
  [K in keyof R]: R[K] extends Result<any, infer U> ? U : never;
};

class ResultType<T, E> {
  readonly [T]: boolean;
  readonly [Val]: T | E;

  constructor(val: T | E, ok: boolean) {
    this[Val] = val;
    this[T] = ok;
  }

  [Symbol.iterator](this: Result<T, E>): IterType<T> {
    return this[T]
      ? (this[Val] as any)[Symbol.iterator]()
      : EmptyArray[Symbol.iterator]();
  }

  /**
   * Returns the contained `T` if `Ok`, or `err` otherwise. The `err`
   * value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x = Ok(1);
   * assert.equal(x.into(), 1);
   *
   * const x = Err(1);
   * assert.equal(x.into(), undefined);
   *
   * const x = Err(1);
   * assert.equal(x.into(null), null);
   * ```
   */
  into(this: Result<T, E>): T | undefined;
  into<U extends FalseyValues>(this: Result<T, E>, err: U): T | U;
  into(this: Result<T, E>, err?: FalseyValues): T | FalseyValues {
    return this[T] ? (this[Val] as T) : err;
  }

  /**
   * Returns a tuple of `[null, T]` if `Ok`, or `[E, null]`
   * otherwise.
   *
   * ```
   * const x: Result<number, string> = Ok(1);
   * assert.deepEqual(x.intoTuple(), [null, 1]);
   *
   * const x: Result<number, string> = Err("error")
   * assert.deepEqual(x.intoTuple(), ["error", null]);
   * ```
   */
  intoTuple(this: Result<T, E>): [null, T] | [E, null] {
    return this[T] ? [null, this[Val] as T] : [this[Val] as E, null];
  }

  /**
   * Returns true if `Ok` and acts as a type guard.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.isOk(), true);
   *
   * const x = Err(10);
   * assert.equal(x.isOk(), false);
   * ```
   */
  isOk(this: Result<T, E>): this is Ok<T> {
    return this[T];
  }

  /**
   * Returns true if `Ok` and the value inside matches a predicate.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.isOkAnd((v) => v === 10), true);
   *
   * const x = Err(10);
   * assert.equal(x.isOkAnd((v) => v === 10), false);
   * ```
   */
  isOkAnd(this: Result<T, E>, f: (val: T) => boolean): boolean {
    return this[T] && f(this[Val] as T);
  }

  /**
   * Returns true if `Ok` and the value inside matches a predicate.
   *
   * ```
   * const x = Ok(10);
   * const isOk = x.isOkAndAsync(async (v) => v === 10);
   * assert.equal(await isOk, true);
   *
   * const x = Err(10);
   * const isOk = x.isOkAndAsync(async (v) => v === 10);
   * assert.equal(await isOk, false);
   * ```
   */
  async isOkAndAsync(
    this: Result<T, E>,
    f: (val: T) => Promise<boolean>
  ): Promise<boolean> {
    return this[T] && f(this[Val] as T);
  }

  /**
   * Returns true if the Result is `Err` and acts as a type guard.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.isErr(), false);
   *
   * const x = Err(10);
   * assert.equal(x.isErr(), true);
   * ```
   */
  isErr(this: Result<T, E>): this is Err<E> {
    return !this[T];
  }

  /**
   * Returns true if the Result is `Err` and the value inside of it matches a predicate.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.isErrAnd((e) => e === 10), false);
   *
   * const x = Err(10);
   * assert.equal(x.isErrAnd((e) => e === 10), true);
   * ```
   */
  isErrAnd(this: Result<T, E>, f: (err: E) => boolean): boolean {
    return !this[T] && f(this[Val] as E);
  }

  /**
   * Returns true if the Result is `Err` and the value inside of it matches a predicate.
   *
   * ```
   * const x = Ok(10);
   * const isErr = x.isErrAndAsync(async (e) => e === 10);
   * assert.equal(await isErr, false);
   *
   * const x = Err(10);
   * const isErr = x.isErrAndAsync(async (e) => e === 10);
   * assert.equal(await isErr, true);
   * ```
   */
  async isErrAndAsync(
    this: Result<T, E>,
    f: (err: E) => Promise<boolean>
  ): Promise<boolean> {
    return !this[T] && f(this[Val] as E);
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
  filter(this: Result<T, E>, f: (val: T) => boolean): Option<T> {
    return this[T] && f(this[Val] as T) ? Some(this[Val] as T) : None;
  }

  /**
   * Creates an `OptionAsync<T>` by calling `f` with the contained `Ok` value.
   * Converts `Ok` to `Some` if the filter returns true, or `None` otherwise.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Ok(1);
   * const v = x.filterAsync(async (v) => v < 5).unwrapAsync();
   * assert.equal(await v, 1);
   *
   * const x = Ok(10);
   * const isNone = x.filterAsync(async (v) => v < 5).isNoneAsync();
   * assert.equal(await isNone, true);
   *
   * const x = Err(1);
   * const isNone = x.filterAsync(async (v) => v < 5).isNoneAsync();
   * assert.equal(await isNone, true);
   * ```
   */
  filterAsync(
    this: Result<T, E>,
    f: (val: T) => Promise<boolean>
  ): OptionAsync<T> {
    if (!this[T]) {
      return new OptionTypeAsync(Promise.resolve(None));
    }

    return new OptionTypeAsync(
      f(this[Val] as T).then((valid) => (valid ? Some(this[Val] as T) : None))
    );
  }

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
  flatten<U, F>(this: Result<Result<U, F>, E>): Result<U, E | F> {
    return this[T] ? (this[Val] as Result<U, F>) : (this as Err<E>);
  }

  /**
   * Flatten a nested `Result<ResultAsync<T, E>, F>` to a `ResultAsync<T, E | F>`.
   *
   * ```
   * type NestedResult = Result<ResultAsync<string, Error>, boolean>;
   *
   * const nested = Result.safe(Promise.resolve(1));
   * const x: NestedResult = Ok(nested);
   * await x.flattenAsync().unwrapAsync()
   *  .then((v) => assert.equal(v, 1));
   *
   * const nested = Result.safe(Promise.reject(new Error("1")));
   * const x: NestedResult = Ok(nested);
   * await x.flattenAsync().unwrapErrAsync()
   *  .then((e) => assert.equal(e.message, "1"));
   *
   * const x: NestedResult = Err(false);
   * await x.flattenAsync().unwrapErrAsync()
   *  .then((e) => assert.equal(e, false));
   * ```
   */
  flattenAsync<U, F>(
    this: Result<ResultAsync<U, F>, E>
  ): ResultAsync<U, E | F> {
    return this[T]
      ? (this[Val] as ResultAsync<U, F>)
      : new ResultTypeAsync(Promise.resolve(this as Err<E>));
  }

  /**
   * Returns the contained `Ok` value if `Ok`, or throws `Error` with the message
   * formed by `msg`.
   *
   * To avoid throwing, consider `isErr`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `Err` case.
   *
   * ```
   * const x: Result<number, string> = Ok(1);
   * assert.equal(x.expect(() => "must be a number"), 1);
   *
   * const x = Err("something went wrong");
   * const y = x.expect((e) => `must be a number, but ${e}`); // throws "Error: must be a number, but something went wrong"
   * ```
   */
  expect(this: Result<T, E>, msg: (err: E) => string): T {
    if (this[T]) {
      return this[Val] as T;
    }

    throw new Error(msg(this[Val] as E));
  }

  /**
   * Returns the contained `Err`, or throws `Error` with the message
   * formed by `msg`.
   *
   * To avoid throwing, consider `isOk` or `match` to handle the `Ok` case.
   *
   * ```
   * const x = Ok(1);
   * const y = x.expectErr((v) => `array length should be 0, got ${v}`); // throws "Error: array length should be 0, got 1"
   *
   * const x = Err("array is empty");
   * assert.equal(x.expectErr(() => "array length should be 0"), "array is empty");
   * ```
   */
  expectErr(this: Result<T, E>, msg: (val: T) => string): E {
    if (!this[T]) {
      return this[Val] as E;
    }

    throw new Error(msg(this[Val] as T));
  }

  /**
   * Returns the contained `Ok` value if `Ok`, or throws the contained value otherwise.
   * If the contained `E` is `Error`, it is thrown as is. All other values
   * are converted to `Error` before throwing.
   *
   * To avoid throwing, consider `isErr`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `Err` case. To throw a more informative error use
   * `expect`.
   *
   * ```
   * const x = Ok(1);
   * assert.equal(x.unwrap(), 1);
   *
   * const x = Err(new Error("missing prop"));
   * const y = x.unwrap(); // throws "Error: missing prop"
   *
   * const x = Err(1);
   * const y = x.unwrap(); // throws "Error: 1"
   * ```
   */
  unwrap(this: Result<T, E>): T {
    if (this[T]) {
      return this[Val] as T;
    }

    throw toError(this[Val]);
  }

  /**
   * Returns the contained `Err` value if `Err`, or throws the contained `Ok` value otherwise.
   * If the contained `T` is `Error`, it is thrown as is. All other values
   * are converted to `Error` before throwing.
   *
   * To avoid throwing, consider `isOk` or `match` to handle the `Ok` case.
   * To throw a more informative error use `expectErr`.
   *
   * ```
   * const x = Ok(1);
   * const y = x.unwrapErr(); // throws "Error: 1"
   *
   * const x = Ok(new Error("message"));
   * const y = x.unwrapErr(); // throws "Error: message"

   * const x = Err(1);
   * assert.equal(x.unwrapErr(), 1);
   * ```
   */
  unwrapErr(this: Result<T, E>): E {
    if (!this[T]) {
      return this[Val] as E;
    }

    throw toError(this[Val]);
  }

  /**
   * Returns the contained `Ok` value or a provided default.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.unwrapOr(1), 10);
   *
   * const x = Err(10);
   * assert.equal(x.unwrapOr(1), 1);
   * ```
   */
  unwrapOr(this: Result<T, E>, def: T): T {
    return this[T] ? (this[Val] as T) : def;
  }

  /**
   * Returns the contained `Ok` value or computes it from a function.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
   *
   * const x = Err(10);
   * assert.equal(x.unwrapOrElse((e) => e + 1), 11);
   * ```
   */
  unwrapOrElse(this: Result<T, E>, f: (err: E) => T): T {
    return this[T] ? (this[Val] as T) : f(this[Val] as E);
  }

  /**
   * Returns the `Promise` of contained `Ok` value or computes it from a function.
   *
   * ```
   * const x = Ok(10);
   * await x.unwrapOrElseAsync(async () => 1 + 1)
   *  .then((v) => assert.equal(v, 10));
   *
   * const x = Err(10);
   * await x.unwrapOrElseAsync(async (e) => e + 1)
   *  .then((v) => assert.equal(v, 11));
   * ```
   */
  unwrapOrElseAsync(this: Result<T, E>, f: (err: E) => Promise<T>): Promise<T> {
    return this[T] ? Promise.resolve(this[Val] as T) : f(this[Val] as E);
  }

  /**
   * Returns the contained `Ok` or `Err` value.
   *
   * Most problems are better solved using one of the other `unwrap_` methods.
   * This method should only be used when you are certain that you need it.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.unwrapUnchecked(), 10);
   *
   * const x = Err(20);
   * assert.equal(x.unwrapUnchecked(), 20);
   * ```
   */
  unwrapUnchecked(this: Result<T, E>): T | E {
    return this[Val];
  }

  /**
   * Returns itself if `Ok`, otherwise returns `resb`.
   *
   * `resb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElse`, which is lazily evaluated.
   *
   * ```
   * const x = Ok(10);
   * const xor = x.or(Ok(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x = Err(10);
   * const xor = x.or(Ok(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  or(this: Result<T, E>, resb: Result<T, E>): Result<T, E> {
    return this[T] ? (this as any) : resb;
  }

  /**
   * Returns `ResultAsync` with the contained `Ok` value if `Ok`, otherwise returns `resb`.
   *
   * `resb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElseAsync`, which is lazily evaluated.
   *
   * ```
   * const xAsync = Result.safe(Promise.resolve(1));
   * const x = Ok(10);
   * const xor = x.orAsync(xAsync);
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 10));
   *
   * const x = Err(10);
   * const xor = x.or(xAsync);
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 1));
   * ```
   */
  orAsync(this: Result<T, E>, resb: ResultAsync<T, E>): ResultAsync<T, E> {
    if (!this[T]) {
      return resb;
    }

    return new ResultTypeAsync(Promise.resolve(this));
  }

  /**
   * Returns itself if `Ok`, otherwise computes the value of `f()`
   * mapping `Result<T, E>` to `Result<T, F>`.
   *
   * ```
   * const x = Ok(10);
   * const xor = x.orElse(() => Ok(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x = Err(10);
   * const xor = x.orElse(() => Ok(1));
   * assert.equal(xor.unwrap(), 1);
   *
   * const x = Err(10);
   * const xor = x.orElse((e) => Err(`val ${e}`));
   * assert.equal(xor.unwrapErr(), "val 10");
   * ```
   */
  orElse<F>(this: Result<T, E>, f: (err: E) => Result<T, F>): Result<T, F> {
    return this[T] ? (this as unknown as Result<T, F>) : f(this[Val] as E);
  }

  /**
   * Returns `ResultAsync` with the contained `Ok` value if `Ok`, otherwise returns the value of `f()`
   * mapping `Result<T, E>` to `ResultAsync<T, F>`.
   *
   * ```
   * const x = Ok(10);
   * const xor = x.orElseAsync(async () => Ok(1));
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 10));
   *
   * const x = Err(10);
   * const xor = x.orElseAsync(async () => Ok(1));
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 1));
   *
   * const x = Err(10);
   * const xor = x.orElseAsync(async (e) => Err(`val ${e}`));
   * await xor.unwrapErrAsync()
   *  .then((e) => assert.equal(e, "val 10"));
   * ```
   */
  orElseAsync<F>(
    this: Result<T, E>,
    f: (err: E) => Promise<Result<T, F>>
  ): ResultAsync<T, F> {
    if (!this[T]) {
      return new ResultTypeAsync(f(this[Val] as E));
    }

    return new ResultTypeAsync(Promise.resolve(this as any));
  }

  /**
   * Returns itself if the Result is `Err`, otherwise returns `resb`.
   *
   * ```
   * const x = Ok(10);
   * const xand = x.and(Ok(1));
   * assert.equal(xand.unwrap(), 1);
   *
   * const x = Err(10);
   * const xand = x.and(Ok(1));
   * assert.equal(xand.unwrapErr(), 10);
   *
   * const x = Ok(10);
   * const xand = x.and(Err(1));
   * assert.equal(xand.unwrapErr(), 1);
   * ```
   */
  and<U>(this: Result<T, E>, resb: Result<U, E>): Result<U, E> {
    return this[T] ? resb : (this as any);
  }

  /**
   * Returns `ResultAsync` with the contained `Err` if `Err`, otherwise returns `resb`.
   *
   * ```
   * const okAsync = Result.safe(Promise.resolve(1));
   * const x = Ok(10);
   * const xand = x.andAsync(okAsync);
   * await xand.unwrapAsync()
   *   .then((v) => assert.equal(v, 1));
   *
   * const x = Err(10);
   * const xand = x.and(okAsync);
   * await xand.unwrapErrAsync()
   *   .then((e) => assert.equal(e, 10));
   *
   * const errAsync = Result.safe(Promise.reject(new Error("404")));
   * const x = Ok(10);
   * const xand = x.and(errAsync);
   * await xand.unwrapErrAsync()
   *   .then((e) => assert.equal(e.message, "404"));
   * ```
   */
  andAsync<U>(this: Result<T, E>, resb: ResultAsync<U, E>): ResultAsync<U, E> {
    if (this[T]) {
      return resb;
    }

    return new ResultTypeAsync(Promise.resolve(this as any));
  }

  /**
   * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
   * value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xand = x.andThen((v) => Ok(v + 1));
   * assert.equal(xand.unwrap(), 11);
   *
   * const x = Err(10);
   * const xand = x.andThen((v) => Ok(v + 1));
   * assert.equal(xand.unwrapErr(), 10);
   *
   * const x = Ok(10);
   * const xand = x.andThen(() => Err(1));
   * assert.equal(xand.unwrapErr(), 1);
   * ```
   */
  andThen<U>(this: Result<T, E>, f: (val: T) => Result<U, E>): Result<U, E> {
    return this[T] ? f(this[Val] as T) : (this as any);
  }

  /**
   * Returns `ResultAsync` with the contained `Err` if `Err`, otherwise calls `f` with the `Ok`
   * value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xand = x.andThenAsync(async (v) => Ok(v + 1));
   * await xand.unwrapAsync()
   *   .then((v) => assert.equal(v, 11));
   *
   * const x = Err(10);
   * const xand = x.andThenAsync(async (v) => Ok(v + 1));
   * await xand.unwrapErrAsync()
   *   .then((e) => assert.equal(e, 10));
   *
   * const x = Ok(10);
   * const xand = x.andThenAsync(async (v) => Err(v + 1));
   * await xand.unwrapErrAsync()
   *   .then((e) => assert.equal(e, 11));
   * ```
   */
  andThenAsync<U>(
    this: Result<T, E>,
    f: (val: T) => Promise<Result<U, E>>
  ): ResultAsync<U, E> {
    if (this[T]) {
      return new ResultTypeAsync(f(this[Val] as T));
    }

    return new ResultTypeAsync(Promise.resolve(this)) as any;
  }

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
   * `Ok` value.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.map((v) => `number ${v}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  map<U>(this: Result<T, E>, f: (val: T) => U): Result<U, E> {
    return new ResultType(
      this[T] ? f(this[Val] as T) : (this[Val] as E),
      this[T]
    ) as Result<U, E>;
  }

  /**
   * Maps a `Result<T, E>` to `ResultAsync<U, E>` by applying a function to the
   * `Ok` value.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapAsync(async (v) => `number ${v}`);
   * await xmap.unwrapAsync()
   *   .then((v) => assert.equal(v, "number 10));
   * ```
   */
  mapAsync<U>(
    this: Result<T, E>,
    f: (val: T) => Promise<U>
  ): ResultAsync<U, E> {
    if (!this[T]) {
      return new ResultTypeAsync(Promise.resolve(this as any));
    }

    return new ResultTypeAsync(f(this[Val] as T).then((val) => Ok(val)));
  }

  /**
   * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to the
   * `Err` value.
   *
   * ```
   * const x = Err(10);
   * const xmap = x.mapErr((n) => `number ${n}`);
   * assert.equal(xmap.unwrapErr(), "number 10");
   * ```
   */
  mapErr<F>(this: Result<T, E>, op: (err: E) => F): Result<T, F> {
    return new ResultType(
      this[T] ? (this[Val] as T) : op(this[Val] as E),
      this[T]
    ) as Result<T, F>;
  }

  /**
   * Maps a `Result<T, E>` to `ResultAsync<T, F>` by applying a function to the
   * `Err` value.
   *
   * ```
   * const x = Err(10);
   * const xmap = x.mapErrAsync((e) => `number ${e}`);
   * await xmap.unwrapErrAsync()
   *   .then((e) => assert.equal(e, "number 10));
   * ```
   */
  mapErrAsync<F>(
    this: Result<T, E>,
    op: (err: E) => Promise<F>
  ): ResultAsync<T, F> {
    if (this[T]) {
      return new ResultTypeAsync(Promise.resolve(this as any));
    }

    return new ResultTypeAsync(op(this[Val] as E).then((err) => Err(err)));
  }

  /**
   * Returns the provided default if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap, 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap, 1);
   * ```
   */
  mapOr<U>(this: Result<T, E>, def: Sync<U>, f: (val: T) => Sync<U>): U {
    return this[T] ? f(this[Val] as T) : def;
  }

  /**
   * Returns a resolved with the provided default value `Promise` if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 1);
   * ```
   */
  async mapOrAsync<U>(
    this: Result<T, E>,
    def: U,
    f: (val: T) => Promise<U>
  ): Promise<U> {
    return this[T] ? f(this[Val] as T) : def;
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (v) => v + 1);
   * assert.equal(xmap, 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElse((e) => e + 1, () => 1 + 1);
   * assert.equal(xmap, 11);
   * ```
   */
  mapOrElse<U>(
    this: Result<T, E>,
    def: (err: E) => Sync<U>,
    f: (val: T) => Sync<U>
  ): U {
    return this[T] ? f(this[Val] as T) : def(this[Val] as E);
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrElseAsync(() => 1 + 1, async (v) => v + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElseAsync(async (e) => e + 1, () => 1 + 1);
   * assert.equal(await xmap, 11);
   * ```
   */
  async mapOrElseAsync<U>(
    this: Result<T, E>,
    def: (err: E) => Promise<U>,
    f: (val: T) => U
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Result<T, E>,
    def: (err: E) => U,
    f: (val: T) => Promise<U>
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Result<T, E>,
    def: (err: E) => Promise<U>,
    f: (val: T) => Promise<U>
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Result<T, E>,
    def: (err: E) => U | Promise<U>,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this[T] ? f(this[Val] as T) : def(this[Val] as E);
  }

  /**
   * Transforms the `Result<T, E>` into an `Option<T>`, mapping `Ok(v)` to
   * `Some(v)`, discarding any `Err` value and mapping to None.
   *
   * ```
   * const x = Ok(10);
   * const opt = x.ok();
   * assert.equal(x.isSome(), true);
   * assert.equal(x.unwrap(), 10);
   *
   * const x = Err(10);
   * const opt = x.ok();
   * assert.equal(x.isNone(), true);
   * const y = x.unwrap(); // throws
   * ```
   */
  ok(this: Result<T, E>): Option<T> {
    return this[T] ? Some(this[Val] as T) : None;
  }

  /**
   * Calls the provided closure with the contained `Ok` value if `Ok`, otherwise does nothing.
   *
   * ```
   * // Prints the contained value.
   * Ok(10).inspect((v) => console.log(v));
   *
   * // Doesn't produce any output.
   * Err(10).inspect((v) => console.log(v));
   * ```
   */
  inspect(this: Result<T, E>, f: (val: T) => void): Result<T, E> {
    if (this[T]) {
      f(this[Val] as T);
    }

    return this;
  }

  /**
   * Calls the provided closure with the contained `Err` value if `Err`, otherwise does nothing.
   *
   * ```
   * // Doesn't produce any output.
   * Ok(10).inspectErr((e) => console.log(e));
   *
   * // Prints the contained error.
   * Err(10).inspectErr((e) => console.log(e));
   * ```
   */
  inspectErr(this: Result<T, E>, f: (err: E) => void): Result<T, E> {
    if (!this[T]) {
      f(this[Val] as E);
    }

    return this;
  }
}

export class ResultTypeAsync<T, E> {
  readonly [Prom]: Promise<Result<T, E>>;

  constructor(producer: Promise<Result<T, E>>) {
    this[Prom] = producer;
  }

  then<A = Result<T, E>, B = never>(
    onSuccess?: (res: Result<T, E>) => A | PromiseLike<A>,
    onFailure?: (err: unknown) => B | PromiseLike<B>
  ): Promise<A | B> {
    return this[Prom].then(onSuccess, onFailure);
  }

  /**
   * Returns a `Promise` of `T` if `Ok`,
   * or `err` otherwise. The `err` value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * assert.equal(await x.intoAsync(), 1);
   *
   * const x = Result.safe(Promise.reject(1));
   * assert.equal(await x.intoAsync(), undefined);
   * assert.equal(await x.intoAsync(null), null);
   * ```
   */
  async intoAsync(this: ResultAsync<T, E>): Promise<T | undefined>;
  async intoAsync<U extends FalseyValues>(
    this: ResultAsync<T, E>,
    err: U
  ): Promise<T | U>;
  async intoAsync(
    this: ResultAsync<T, E>,
    err?: FalseyValues
  ): Promise<T | FalseyValues> {
    return this.then((res) => res.into(err));
  }

  /**
   * Returns a `Promise` of tuple of `[null, T]` if `Ok`,
   * or `[E, null]` otherwise.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * assert.deepEqual(await x.intoTupleAsync(), [null, 1]);
   *
   * const x = Result.safe(Promise.reject("error"), (e) => e as string);
   * assert.deepEqual(await x.intoTupleAsync(), ["error", null]);
   * ```
   */
  async intoTupleAsync(
    this: ResultAsync<T, E>
  ): Promise<[null, T] | [E, null]> {
    return this.then((res) => res.intoTuple());
  }

  /**
   * Returns a `Promise` that resolves to true if `Ok`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * assert.equal(await x.isOkAsync(), true);
   *
   * const x = Result.safe(Promise.reject(1));
   * assert.equal(await x.isOkAsync(), false);
   * ```
   */
  async isOkAsync(this: ResultAsync<T, E>): Promise<boolean> {
    return this.then((res) => res.isOk());
  }

  /**
   * Returns a `Promise` that resolves to true if `Ok` and the value inside of it matches a predicate.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * assert.equal(await x.isOkAndAsync((v) => v === 10), true);
   * assert.equal(await x.isOkAndAsync(async (v) => v === 11), false);
   *
   * const x = Result.safe(Promise.reject(10));
   * assert.equal(await x.isOkAndAsync((v) === 10), false);
   * ```
   */
  async isOkAndAsync(
    this: ResultAsync<T, E>,
    f: (val: T) => boolean | Promise<boolean>
  ): Promise<boolean> {
    return this.then((res) => res.isOkAnd(f as any));
  }

  /**
   * Returns a `Promise` that resolves to true if `Err`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * assert.equal(await x.isErrAsync(), false);
   *
   * const x = Result.safe(Promise.reject(10));
   * assert.equal(await x.isErrAsync(), true);
   * ```
   */
  async isErrAsync(this: ResultAsync<T, E>): Promise<boolean> {
    return this.then((res) => res.isErr());
  }

  /**
   * Returns a `Promise` that resolves to true if `Err` and the value inside of it matches a predicate.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * assert.equal(await x.isErrAndAsync((e) => e === 10), false);
   *
   * const x = Result.safe(Promise.reject(10));
   * assert.equal(await x.isErrAndAsync(async (e) => e === 10), true);
   * assert.equal(await x.isErrAndAsync((e) => e === 11), false);
   * ```
   */
  async isErrAndAsync(
    this: ResultAsync<T, E>,
    f: (err: E) => boolean | Promise<boolean>
  ): Promise<boolean> {
    return this.then((res) => res.isErrAnd(f as any));
  }

  /**
   * Creates an `OptionAsync<T>` by calling `f` with the contained `Ok` value.
   * Converts `Ok` to `Some` if the filter returns true, or `None` otherwise.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Ok(1);
   * await x.filterAsync(async (v) => v < 5).unwrapAsync()
   *   .then((x) => assert.equal(x, 1));
   *
   * const x = Ok(10);
   * await x.filterAsync(async (v) => v < 5).isNoneAsync()
   *   .then((isNone) => assert.equal(isNone, true));
   *
   * const x = Err(1);
   * await x.filterAsync(async (v) => v < 5).isNoneAsync()
   *   .then((isNone) => assert.equal(isNone, true));
   * ```
   */
  filterAsync(
    this: ResultAsync<T, E>,
    f: (val: T) => boolean | Promise<boolean>
  ): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((res) => res.filterAsync(async (val) => f(val)))
    );
  }

  /**
   * Flatten a nested `ResultAsync<Result<T, E>, F>` to a `ResultAsync<T, E | F>`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(Ok(1)));
   * assert.equal(await x.flattenAsync().unwrapAsync(), 1);
   *
   * const x = Result.safe(Promise.resolve(Err(10)));
   * assert.equal(await x.flattenAsync().unwrapErrAsync(), 10);
   * ```
   */
  flattenAsync<U, F>(
    this: ResultAsync<Result<U, F>, E>
  ): ResultAsync<U, E | F> {
    return new ResultTypeAsync(this.then((res) => res.flatten()));
  }

  /**
   * Returns a `Promise` of the contained `Ok` value if `Ok`,
   * or throws `Error` with the message formed by `msg`.
   *
   * To avoid throwing, consider `isErrAsync`, `unwrapOrAsync`, `unwrapOrElseAsync` or
   * `match` to handle the `Err` case.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * assert.equal(await x.expectAsync(() => "must be a number"), 1);
   *
   * const x = Result.safe(Promise.reject("something went wrong"), (e) => e as string);
   * const y = await x.expectAsync((e) => `must be a number, but ${e}`); // throws "Error: must be a number, but something went wrong"
   * ```
   */
  async expectAsync(
    this: ResultAsync<T, E>,
    msg: (err: E) => string
  ): Promise<T> {
    return this.then((res) => res.expect(msg));
  }

  /**
   * Returns a `Promise` of the contained `Err`,
   * or throws `Error` with the message formed by `msg`.
   *
   * To avoid throwing, consider `isOkAsync` or `match` to handle the `Ok` case.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * const y = await x.expectErrAsync((v) => `array length should be 0, got ${v}`) // throws "Error: array length should be 0, got 1";
   *
   * const x = Result.safe(Promise.reject("array is empty"), (e) => e as string);
   * assert.equal(await x.expectErrAsync(() => "array length should be 0"), "array is empty");
   * ```
   */
  async expectErrAsync(
    this: ResultAsync<T, E>,
    msg: (val: T) => string
  ): Promise<E> {
    return this.then((res) => res.expectErr(msg));
  }

  /**
   * Returns a `Promise` of the contained `Ok` value if `Ok`,
   * or rejects with the contained value otherwise.
   * If the contained `E` is `Error`, it is used as is. All other values
   * are converted to `Error` first.
   *
   * To avoid rejection, consider `isErrAsync`, `unwrapOrAsync`, `unwrapOrElseAsync` or
   * `match` to handle the `Err` case. To throw a more informative error use
   * `expectAsync`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * assert.equal(await x.unwrapAsync(), 1);
   *
   * const x = Result.safe(Promise.reject(new Error("404")));
   * const y = await x.unwrapAsync(); // throws "Error: 404"
   *
   * const x = Result.safe(Promise.reject("400"));
   * const y = await x.unwrapAsync(); // throws "Error: 400"
   * ```
   */
  async unwrapAsync(this: ResultAsync<T, E>): Promise<T> {
    return this.then((res) => res.unwrap());
  }

  /**
   * Returns a `Promise` of the contained `Err` value if `Err`,
   * or throws the contained `Ok` value otherwise.
   * If the contained `T` is `Error`, it is used as is. All other values
   * are converted to `Error` first.
   *
   * To avoid throwing, consider `isOkAsync` or `match` to handle the `Ok` case.
   * To throw a more informative error use `expectErrAsync`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * const y = await x.unwrapErrAsync(); // throws "Error: 1"
   *
   * const x = Result.safe(Promise.resolve(new Error("404")));
   * const y = await x.unwrapErrAsync(); // throws "Error: 404"
   *
   * const x = Result.safe(Promise.reject(1));
   * assert.equal(await x.unwrapErrAsync(), 1);
   * ```
   */
  async unwrapErrAsync(this: ResultAsync<T, E>): Promise<E> {
    return this.then((res) => res.unwrapErr());
  }

  /**
   * Returns a `Promise` of the contained `Ok` value or a provided default.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `unwrapOrElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * assert.equal(await x.unwrapOrAsync(1), 10);
   *
   * const x = Result.safe(Promise.reject(10));
   * assert.equal(await x.unwrapOrAsync(1), 1);
   * ```
   */
  async unwrapOrAsync(this: ResultAsync<T, E>, def: T): Promise<T> {
    return this.then((res) => res.unwrapOr(def));
  }

  /**
   * Returns a `Promise` of the contained `Ok` value
   * or computes the value from a function.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * await x.unwrapOrElseAsync(async () => 1 + 1)
   *  .then((v) => assert.equal(v, 10));
   *
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * await x.unwrapOrElseAsync((e) => e + 1)
   *  .then((v) => assert.equal(v, 11));
   * ```
   */
  async unwrapOrElseAsync(
    this: ResultAsync<T, E>,
    f: (err: E) => T | Promise<T>
  ): Promise<T> {
    return this.then((res) => res.unwrapOrElseAsync(async (val) => f(val)));
  }

  /**
   * Returns a `Promise` of the contained `Ok` or `Err` value.
   *
   * Most problems are better solved using one of the other `unwrap_` methods.
   * This method should only be used when you are certain that you need it.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * assert.equal(await x.unwrapUncheckedAsync(), 10);
   *
   * const x = Result.safe(Promise.reject(20), (e) => e as number);
   * assert.equal(await x.unwrapUncheckedAsync(), 20);
   * ```
   */
  async unwrapUncheckedAsync(this: ResultAsync<T, E>): Promise<T | E> {
    return this.then((res) => res.unwrapUnchecked());
  }

  /**
   * Returns `ResultAsync` with the contained `Ok` value if `Ok`, otherwise returns `resb`.
   *
   * `resb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * const y = Result.safe(Promise.resolve(2));
   * await x.orAsync(y).unwrapAsync()
   *  .then((v) => assert.equal(v, 1));
   *
   * const x = Result.safe(Promise.reject("error"));
   * const y = Result.safe(Promise.resolve(2));
   * await x.orAsync(y).unwrapAsync()
   *  .then((v) => assert.equal(v, 2));
   * ```
   */
  orAsync(
    this: ResultAsync<T, E>,
    resb: Result<T, E> | ResultAsync<T, E>
  ): ResultAsync<T, E> {
    return new ResultTypeAsync(
      this.then((res) =>
        resb instanceof ResultType ? res.or(resb) : res.orAsync(resb)
      )
    );
  }

  /**
   * Returns `ResultAsync` with the contained `Ok` value if `Ok`, otherwise returns the value of `f()`
   * mapping `ResultAsync<T, E>` to `ResultAsync<T, F>`.
   *
   * ```
   * const x = Ok(10);
   * const xor = x.orElseAsync(async () => Ok(1));
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 10));
   *
   * const x = Err(10);
   * const xor = x.orElseAsync(async () => Ok(1));
   * await xor.unwrapAsync()
   *  .then((v) => assert.equal(v, 1));
   *
   * const x = Err(10);
   * const xor = x.orElseAsync(async (e) => Err(`val ${e}`));
   * await xor.unwrapErrAsync()
   *  .then((e) => assert.equal(e, "val 10"));
   * ```
   */
  orElseAsync<F>(
    this: ResultAsync<T, E>,
    f: (err: E) => Result<T, F> | Promise<Result<T, F>>
  ): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => res.orElseAsync(async (err) => f(err)))
    );
  }

  /**
   * Returns `ResultAsync` with the contained `Err` if `Err`, otherwise returns `resb`.
   *
   * ```
   * const x = Result.safe(Promise.resolve(1));
   * const y = Result.safe(Promise.resolve(2));
   * await x.andAsync(y).unwrapAsync()
   *   .then((v) => assert.equal(v, 2));
   *
   * const x = Result.safe(Promise.resolve(1), (e) => e as number);
   * const y = Result.safe(Promise.reject(2), (e) => e as number);
   * await x.andAsync(y).unwrapErrAsync()
   *   .then((e) => assert.equal(e, 2));
   * ```
   */
  andAsync<U>(
    this: ResultAsync<T, E>,
    resb: Result<U, E> | ResultAsync<U, E>
  ): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) =>
        resb instanceof ResultType ? res.and(resb) : res.andAsync(resb)
      )
    );
  }

  /**
   * Returns `ResultAsync` with the contained `Err` if `Err`, otherwise calls `f` with the `Ok`
   * value and returns the result.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * await x.andThenAsync(async (v) => Ok(v + 1))
   *   .then((v) => assert.equal(v, 11));
   *
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * await x.andThenAsync((v) => Ok(v + 1)).uwrapErrAsync()
   *   .then((e) => assert.equal(e, 10));
   *
   * const x = Result.safe(Promise.resolve(10));
   * await x.andThenAsync(async (v) => Err(v + 1)).unwrapErrAsync()
   *   .then((e) => assert.equal(e, 11));
   * ```
   */
  andThenAsync<U>(
    this: ResultAsync<T, E>,
    f: (val: T) => Result<U, E> | Promise<Result<U, E>>
  ): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => res.andThenAsync(async (val) => f(val)))
    );
  }

  /**
   * Maps a `Result<T, E>` to `ResultAsync<U, E>` by applying a function to the
   * `Ok` value.
   *
   * ```
   * const x = await Result.safe(Promise.resolve(10));
   * const xmap = x.mapAsync(async (v) => `number ${v}`);
   * await xmap.unwrapAsync()
   *   .then((v) => assert.equal(v, "number 10));
   * ```
   */
  mapAsync<U>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | Promise<U>
  ): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => res.mapAsync(async (val) => f(val)))
    );
  }

  /**
   * Maps a `Result<T, E>` to `ResultAsync<T, F>` by applying a function to the
   * `Err` value.
   *
   * ```
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * const xmap = x.mapErrAsync((e) => `number ${e}`);
   * await xmap.unwrapErrAsync()
   *   .then((e) => assert.equal(e, "number 10));
   * ```
   */
  mapErrAsync<F>(
    this: ResultAsync<T, E>,
    op: (err: E) => F | Promise<F>
  ): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => res.mapErrAsync(async (err) => op(err)))
    );
  }

  /**
   * Returns a resolved with the provided default value `Promise` if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * const xmap = x.mapOrAsync(1, (v) => v + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * const xmap = x.mapOrAsync(1, async (v) => v + 1);
   * assert.equal(await xmap, 1);
   * ```
   */
  async mapOrAsync<U>(
    this: ResultAsync<T, E>,
    def: U,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this.then((res) => res.mapOrAsync(def, async (val) => f(val)));
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * const xmap = x.mapOrElseAsync(() => 1 + 1, async (v) => v + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElseAsync(async (e) => e + 1, () => 1 + 1);
   * assert.equal(await xmap, 11);
   * ```
   */
  async mapOrElseAsync<U>(
    this: ResultAsync<T, E>,
    def: (err: E) => U | Promise<U>,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this.then((res) =>
      res.mapOrElseAsync(
        async (err) => def(err),
        async (val) => f(val)
      )
    );
  }

  /**
   * Transforms the `ResultAsync<T, E>` into an `OptionAsync<T>`, mapping `Ok(v)` to
   * `Some(v)`, discarding any `Err` value and mapping to None.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * const opt = x.okAsync();
   * assert.equal(await opt.isSomeAsync(), true);
   * assert.equal(await opt.unwrapAsync(), 10);
   *
   * const x = Err(10);
   * const opt = x.okAsync();
   * assert.equal(await x.isNoneAsync(), true);
   * const y = await x.unwrapAsync(); // throws
   * ```
   */
  okAsync(this: ResultAsync<T, E>): OptionAsync<T> {
    return new OptionTypeAsync(this.then((res) => res.ok()));
  }

  /**
   * Calls the provided closure with the contained Ok value, otherwise does nothing.
   * If the underlying `Promise` rejects the error is ignored.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * await x.inspectAsync((v) => console.log(v)); // Prints the contained value.
   *
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * await x.inspectAsync((v) => console.log(v)); // Doesn't produce any output.
   * ```
   */
  inspectAsync(
    this: ResultAsync<T, E>,
    f: (val: T) => void
  ): ResultAsync<T, E> {
    this.then((res) => res.inspect(f)).catch(() => undefined);
    return this;
  }

  /**
   * Calls the provided closure with the contained Err value, otherwise does nothing.
   * If the underlying `Promise` rejects the error is ignored.
   *
   * ```
   * const x = Result.safe(Promise.resolve(10));
   * await x.inspectErrAsync((e) => console.log(v)); // Doesn't produce any output.
   *
   * const x = Result.safe(Promise.reject(10), (e) => e as number);
   * await x.inspectErrAsync((e) => console.log(v)); // Prints the contained value.
   * ```
   */
  inspectErrAsync(
    this: ResultAsync<T, E>,
    f: (err: E) => void
  ): ResultAsync<T, E> {
    this.then((res) => res.inspectErr(f)).catch(() => undefined);
    return this;
  }
}

/**
 * Tests the provided `val` is an Result and acts as a type guard.
 *
 * ```
 * assert.equal(Result.is(Ok(1), true);
 * assert.equal(Result.is(Err(1), true));
 * assert.equal(Result.is(Some(1), false));
 * ```
 */
function is(val: unknown): val is Result<unknown, unknown> {
  return val instanceof ResultType;
}

/**
 * A Result represents success, or failure. If we hold a value
 * of type `Result<T, E>`, we know it is either `Ok<T>` or `Err<E>`.
 *
 * As a function, `Result` is an alias for `Result.from`.
 *
 * ```
 * const users = ["Fry", "Bender"];
 * function fetch_user(username: string): Result<string, string> {
 *    return users.includes(username) ? Ok(username) : Err("Wha?");
 * }
 *
 * function greet(username: string): string {
 *    return fetch_user(username).mapOrElse(
 *       (err) => `Error: ${err}`,
 *       (user) => `Good news everyone, ${user} is here!`
 *    );
 * }
 *
 * assert.equal(greet("Bender"), "Good news everyone, Bender is here!");
 * assert.equal(greet("SuperKing"), "Error: Wha?");
 * ```
 */
export function Result<T>(
  val: T
): Result<
  From<T>,
  | (T extends Error ? T : never)
  | (Extract<FalseyValues, T> extends never ? never : null)
> {
  return from(val) as any;
}

Result.is = is;
Result.from = from;
Result.nonNull = nonNull;
Result.qty = qty;
Result.safe = safe;
Result.all = all;
Result.any = any;
Result.unsafe = unsafe;

/**
 * Creates an `Ok<T>` value, which can be used where a `Result<T, E>` is
 * required. See Result for more examples.
 *
 * Note that the counterpart `Err` type `E` is set to the same type as `T`
 * by default. TypeScript will usually infer the correct `E` type from the
 * context (e.g. a function which accepts or returns a Result).
 *
 * ```
 * const x = Ok(10);
 * assert.equal(x.isSome(), true);
 * assert.equal(x.unwrap(), 10);
 * ```
 */
export function Ok<T>(val: T): Ok<T> {
  return new ResultType<T, never>(val, true);
}

/**
 * Creates an `Err<E>` value, which can be used where a `Result<T, E>` is
 * required. See Result for more examples.
 *
 * Note that the counterpart `Ok` type `T` is set to the same type as `E`
 * by default. TypeScript will usually infer the correct `T` type from the
 * context (e.g. a function which accepts or returns a Result).
 *
 * ```
 * const x = Err(10);
 * assert.equal(x.isErr(), true);
 * assert.equal(x.unwrapErr(), 10);
 * ```
 */
export function Err<E>(val: E): Err<E> {
  return new ResultType<never, E>(val, false);
}

/**
 * Creates a new `Result<T, E>` which is `Ok<T>` unless the provided `val` is
 * falsey, an instance of `Error` or an invalid `Date`.
 *
 * The `T` is narrowed to exclude any falsey values or Errors.
 *
 * The `E` type includes:
 * - `null` (if `val` could have been falsey or an invalid date)
 * - `Error` types excluded from `T` (if there are any)
 *
 * **Note:** `null` is not a useful value. Consider `Option.from` or `mapErr`.
 *
 * ```
 * assert.equal(Result.from(1).unwrap(), 1);
 * assert.equal(Result(0).isErr(), true);
 *
 * const err = Result.from(new Error("msg"));
 * assert.equal(err.unwrapErr().message, "msg");
 *
 * // Create a Result<number, string>
 * const x = Option.from(1).okOr("Falsey Value");
 * ```
 */
function from<T>(
  val: T
): Result<
  From<T>,
  | (T extends Error ? T : never)
  | (Extract<FalseyValues, T> extends never ? never : null)
> {
  return isTruthy(val)
    ? new ResultType(val as any, !(val instanceof Error))
    : Err(null);
}

/**
 * Creates a new `Result<T, null>` which is `Ok` unless the provided `val` is
 * `undefined`, `null` or `NaN`.
 *
 * **Note:** `null` is not a useful value. Consider `Option.nonNull` or
 * `mapErr`.
 *
 * ```
 * assert.equal(Result.nonNull(1).unwrap(), 1);
 * assert.equal(Result.nonNull(0).unwrap(), 0);
 * assert.equal(Result.nonNull(null).isErr(), true);
 *
 * // Create a Result<number, string>
 * const x = Option.nonNull(1).okOr("Nullish Value");
 * ```
 */
function nonNull<T>(val: T): Result<NonNullable<T>, null> {
  return val === undefined || val === null || val !== val
    ? Err(null)
    : Ok(val as NonNullable<T>);
}

/**
 * Creates a new Result<number, null> which is `Ok` when the provided `val` is
 * a finite integer greater than or equal to 0.
 *
 * **Note:** `null` is not a useful value. Consider `Option.qty` or `mapErr`.
 *
 * ```
 * const x = Result.qty("test".indexOf("s"));
 * assert.equal(x.unwrap(), 2);
 *
 * const x = Result.qty("test".indexOf("z"));
 * assert.equal(x.unwrapErr(), null);
 *
 * // Create a Result<number, string>
 * const x = Result.qty("test".indexOf("s")).mapErr(() => "Not Found");
 * ```
 */
function qty<T extends number>(val: T): Result<number, null> {
  return val >= 0 && Number.isInteger(val) ? Ok(val) : Err(null);
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Capture the outcome of a function as a `Result<T, E>`,
 * or promise as a `ResultAsync<T, E>`, preventing throwing.
 * If `mapErr` is not provided, the thrown value is always converted to `Error`.
 *
 * **Usage with functions**
 * Note that all functions returning a `Promise` are rejected by the type signature.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Result<string, Error> = Result.safe(() => mightThrow(true));
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x: Result<string, Error> = Result.safe(() => mightThrow(true), (e) => new TypeError((e as Error).message));
 * assert.equal(x.unwrapErr() instanceof TypeError, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = Result.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 * Accepts `promise` and returns `ResultAsync<T, Error>` if `mapErr` is not provided.
 * If `mapErr` is provided, the error value will be of its return type.
 * The Result is `Ok` if the original promise resolved, or `Err` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *
 *    return "Hello World";
 * }
 *
 * const x = await Result.safeAsync(mightThrow(true));
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = await Result.safeAsync(mightThrow(true), (e) => new TypeError((e as Error).message));
 * assert.equal(x.unwrapErr() instanceof TypeError, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = await Result.safeAsync(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */
function safe<T>(fn: () => Sync<T>): Result<T, Error>;
function safe<T, E>(
  fn: () => Sync<T>,
  mapErr: (err: unknown) => E
): Result<T, E>;
function safe<T>(promise: Promise<T>): ResultAsync<T, Error>;
function safe<T, E>(
  promise: Promise<T>,
  mapErr: (err: unknown) => E
): ResultAsync<T, E>;
function safe<T, E>(
  fn: (() => Sync<T>) | Promise<T>,
  mapErr?: (err: unknown) => E
): any {
  if (fn instanceof Promise) {
    return new ResultTypeAsync(
      fn
        .then((val) => Ok(val))
        .catch((err) => Err(mapErr === undefined ? toError(err) : mapErr(err)))
    );
  }

  try {
    return Ok(fn());
  } catch (err) {
    return Err(mapErr === undefined ? toError(err) : mapErr(err));
  }
}

/**
 * Converts a number of `Result`s into a single Result. The first `Err` found
 * (if any) is returned, otherwise the new Result is `Ok` and contains an array
 * of all the unwrapped values.
 *
 * ```
 * function num(val: number): Result<number, string> {
 *    return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
 * }
 *
 * const xyz = Result.all(num(20), num(30), num(40));
 * const [x, y, z] = xyz.unwrap();
 * assert.equal(x, 20);
 * assert.equal(y, 30);
 * assert.equal(z, 40);
 *
 * const err = Result.all(num(20), num(5), num(40));
 * assert.equal(err.isErr(), true);
 * assert.equal(err.unwrapErr(), "Value 5 is too low.");
 * ```
 */
function all<R extends Result<any, any>[]>(
  ...results: R
): Result<ResultTypes<R>, ResultErrors<R>[number]> {
  const ok = [];
  for (const result of results) {
    if (result.isOk()) {
      ok.push(result.unwrapUnchecked());
    } else {
      return result;
    }
  }

  return Ok(ok) as Ok<ResultTypes<R>>;
}

/**
 * Converts a number of `Result`s into a single Result. The first `Ok` found
 * (if any) is returned, otherwise the new Result is an `Err` containing an
 * array of all the unwrapped errors.
 *
 * ```
 * function num(val: number): Result<number, string> {
 *    return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
 * }
 *
 * const x = Result.any(num(5), num(20), num(2));
 * assert.equal(x.unwrap(), 20);
 *
 * const efg = Result.any(num(2), num(5), num(8));
 * const [e, f, g] = efg.unwrapErr();
 * assert.equal(e, "Value 2 is too low.");
 * assert.equal(f, "Value 5 is too low.");
 * assert.equal(g, "Value 8 is too low.");
 * ```
 */
function any<R extends Result<any, any>[]>(
  ...results: R
): Result<ResultTypes<R>[number], ResultErrors<R>> {
  const err = [];
  for (const result of results) {
    if (result.isOk()) {
      return result;
    } else {
      err.push(result.unwrapUnchecked());
    }
  }

  return Err(err) as Err<ResultErrors<R>>;
}

/**
 * Wraps a `Promise` of a `Result<T, E>` and produces `ResultAsync<T, E>`.
 *
 * **Note**: the rejection of the wrapped `Promise` is not handled,
 * consider `Result.safe` to safely wrap a `Promise`.
 */
function unsafe<T, E>(p: Promise<Result<T, E>>) {
  return new ResultTypeAsync(p);
}
