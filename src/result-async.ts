import { Prom, FalseyValues } from "./common";
import { Err, Ok, Result } from "./result";

export type OkAsync<T> = ResultTypeAsync<T, never>;
export type ErrAsync<E> = ResultTypeAsync<never, E>;
export type ResultAsync<T, E> = ResultTypeAsync<T, E>;

class ResultTypeAsync<T, E> {
  readonly [Prom]: Promise<Result<T, E>>;

  constructor(producer: Promise<Result<T, E>>) {
    this[Prom] = producer;
  }

  then<A, B>(
    onSuccess?: (res: Result<T, E>) => A | PromiseLike<A>,
    onFailure?: (err: unknown) => B | PromiseLike<B>,
  ): Promise<A | B> {
    return this[Prom].then(onSuccess, onFailure);
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
    return this.then((res) => res.into(err));
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
    return this.then((res) => res.intoTuple());
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
    return this.then((res) => res.isOk());
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
    return this.then((res) => res.isOkAnd(f));
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
  async isOkAndAsync(this: ResultAsync<T, E>, f: (val: T) => Promise<boolean>): Promise<boolean> {
    const res = await this;
    
    if (res.isErr()) {
      return false;
    }

    return f(res.unwrap());
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
    return this.then((res) => res.isErr());
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
    return this.then((res) => res.isErrAnd(f));
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
  async isErrAndAsync(this: ResultAsync<T, E>, f: (err: E) => Promise<boolean>): Promise<boolean> {
    const res = await this;
    
    if (res.isOk()) {
      return false;
    }

    return f(res.unwrapErr());
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
    return this.then((res) => res.expect(msg));
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
    return this.then((res) => res.expectErr(msg));
  }

  /**
   * Returns a `Promise` that resolves to `T` (if `Ok`), or throws `E` otherwise.
   *
   * To avoid throwing, consider `isErr`, `unwrapOr` or `unwrapOrElse` to
   * handle the `Err` case. To throw a more informative error use `expect`.
   *
   * ```
   * const x = OkAsync(1);
   * assert.equal(await x.unwrap(), 1);
   *
   * const x = ErrAsync("Not found");
   * await x.unwrap(); // throws "Not found"
   * ```
   */
  async unwrap(this: ResultAsync<T, E>): Promise<T> {
    return this.then((res) => res.unwrap());
  }

  /**
   * Returns a `Promise` that resolves to `E` (if `Err`), or throws the content `T` otherwise.
   *
   * To avoid throwing, consider `isOk` to handle the `Ok` case.
   * To throw a more informative error use `expectErr`.
   *
   * ```
   * const x = OkAsync(1);
   * await x.unwrapErr(); // throws "1"
   *
   * const x = ErrAsync(1);
   * assert.equal(await x.unwrapErr(), 1);
   * ```
   */
  async unwrapErr(this: ResultAsync<T, E>): Promise<E> {
    return this.then((res) => res.unwrapErr());
  }

  /**
   * Returns a `Promise` that resolves to `T` (if `Ok), or a provided default.
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
  async unwrapOr(this: ResultAsync<T, E>, def: T): Promise<T> {
    return this.then((res) => res.unwrapOr(def));
  }

  /**
   * Returns the contained `Ok` value or computes it from a function.
   *
   * ```
   * const x = Ok(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
   *
   * const x = Err(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
   * ```
   */
  async unwrapOrElse(this: ResultAsync<T, E>, f: (err: E) => T): Promise<T> {
    return this.then((res) => res.unwrapOrElse(f));
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
  async unwrapUnchecked(this: ResultAsync<T, E>): Promise<T | E> {
    return this.then((res) => res.unwrapUnchecked());
  }

  /**
   * Returns the Option if it is `Ok`, otherwise returns `resb`.
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
  or(this: ResultAsync<T, E>, resb: Result<T, E>): ResultAsync<T, E> {
    return new ResultTypeAsync(
      this.then((res) => res.or(resb))
    );
  }

  /**
   * Returns the Option if it is `Ok`, otherwise returns `resb`.
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
  orAsync(this: ResultAsync<T, E>, resb: ResultAsync<T, E>): ResultAsync<T, E> {
    return new ResultTypeAsync(
      this.then((res) => res.orAsync(resb))
    );
  }

  /**
   * Returns the Result if it is `Ok`, otherwise returns the value of `f()`
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
  orElse<F>(this: ResultAsync<T, E>, f: (err: E) => Result<T, F>): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => res.orElse(f))
    );
  }

 /**
  * Returns the Result if it is `Ok`, otherwise returns the value of `f()`
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
  orElseAsync<F>(this: ResultAsync<T, E>, f: (err: E) => Promise<Result<T, F>>): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => res.orElseAsync(f))
    );
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
  and<U>(this: ResultAsync<T, E>, resb: Result<U, E>): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => res.and(resb))
    );
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
  andAsync<U>(this: ResultAsync<T, E>, resb: ResultAsync<U, E>): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => {
        if (res.isErr()) {
          return res;
        }

        return resb.then((resb) => res.and(resb));
      })
    );
  }

  /**
   * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
   * value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrap(), 11);
   *
   * const x = Err(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrapErr(), 10);
   *
   * const x = Ok(10);
   * const xand = x.and(Err(1));
   * assert.equal(xand.unwrapErr(), 1);
   * ```
   */
  andThen<U>(this: ResultAsync<T, E>, f: (val: T) => Result<U, E>): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => res.andThen(f))
    );
  }

  /**
   * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
   * value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrap(), 11);
   *
   * const x = Err(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrapErr(), 10);
   *
   * const x = Ok(10);
   * const xand = x.and(Err(1));
   * assert.equal(xand.unwrapErr(), 1);
   * ```
   */
  andThenAsync<U>(this: ResultAsync<T, E>, f: (val: T) => Promise<Result<U, E>>): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => {
        if (res.isErr()) {
          return res;
        }

        return f(res.unwrap());
      })
    );
  }

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
   * `Ok` value.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.map((n) => `number ${n}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  map<U>(this: ResultAsync<T, E>, f: (val: T) => U): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => res.map(f))
    );
  }

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
   * `Ok` value.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.map((n) => `number ${n}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  mapAsync<U>(this: ResultAsync<T, E>, f: (val: T) => Promise<U>): ResultAsync<U, E> {
    return new ResultTypeAsync(
      this.then((res) => {
        if (res.isErr()) {
          return Err(res.unwrapErr());
        }

        return f(res.unwrap()).then((val) => Ok(val));
      })
    );
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
  mapErr<F>(this: ResultAsync<T, E>, op: (err: E) => F): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => res.mapErr(op))
    );
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
  mapErrAsync<F>(this: ResultAsync<T, E>, op: (err: E) => Promise<F>): ResultAsync<T, F> {
    return new ResultTypeAsync(
      this.then((res) => {
        if (res.isOk()) {
          return Ok(res.unwrap());
        }

        return op(res.unwrapErr()).then((val) => Err(val));
      })
    );
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
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 1);
   * ```
   */
  async mapOr<U>(this: ResultAsync<T, E>, def: U, f: (val: T) => U): Promise<U> {
    return this.then((res) => res.mapOr(def, f));
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
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 1);
   * ```
   */
  async mapAsyncOr<U>(this: ResultAsync<T, E>, def: U, f: (val: T) => Promise<U>): Promise<U> {
    return this.then((res) => {
      if (res.isErr()) {
        return def;
      }

      return f(res.unwrap());
    });
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 2);
   * ```
   */
  async mapOrElse<U>(this: ResultAsync<T, E>, def: (err: E) => U, f: (val: T) => U): Promise<U> {
    return this.then((res) => res.mapOrElse(def, f));
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 2);
   * ```
   */
  async mapOrElseAsync<U>(this: ResultAsync<T, E>, def: (err: E) => U, f: (val: T) => Promise<U>): Promise<U> {
    return this.then((res) => {
      if (res.isErr()) {
        return def(res.unwrapErr());
      }

      return f(res.unwrap());
    });
  }

  /**
   * Computes a default return value if `Err`, otherwise calls `f` with the
   * `Ok` value and returns the result.
   *
   * ```
   * const x = Ok(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x = Err(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 2);
   * ```
   */
  async mapAsyncOrElseAsync<U>(this: ResultAsync<T, E>, def: (err: E) => Promise<U>, f: (val: T) => Promise<U>): Promise<U> {
    return this.then((res) => {
      if (res.isErr()) {
        return def(res.unwrapErr());
      }

      return f(res.unwrap());
    });
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
  // ok(this: Result<T, E>): Option<T> {
  //   return this[T] ? Some(this[Val] as T) : None;
  // }

  /**
   * Calls the provided closure with the contained Ok value otherwise does nothing.
   * 
   * ```
   * // Prints the contained value.
   * Ok(10).inspect((n) => console.log(n));
   * 
   * // Doesn't produce any output.
   * Err(10).inspect((n) => console.log(n));
   * ```
   */
  inspect(this: ResultAsync<T, E>, f: (val: T) => void): ResultAsync<T, E> {
    this.then((res) => {
      if (res.isOk()) {
        f(res.unwrap());
      }
    });

    return this;
  }

  /**
   * Calls the provided closure with the contained Err value otherwise does nothing.
   * 
   * ```
   * // Doesn't produce any output.
   * Ok(10).inspectErr((n) => console.log(n));
   * 
   * // Prints the contained error.
   * Err(10).inspectErr((n) => console.log(n));
   * ```
   */
  inspectErr(this: ResultAsync<T, E>, f: (err: E) => void): ResultAsync<T, E> {
    this.then((res) => {
      if (res.isErr()) {
        f(res.unwrapErr());
      }
    });

    return this;
  }
}

function safe<T>(promise: Promise<T>): ResultAsync<T, Error>;
function safe<T, E>(
  promise: Promise<T>,
  mapErr: (err: unknown) => E
): ResultAsync<T, E>;
function safe<T, E, F extends ((err: unknown) => E) | undefined>(
  promise: Promise<T>,
  mapErr?: F
): F extends undefined ? ResultAsync<T, Error> : ResultAsync<T, E> {
  return new ResultTypeAsync(
    promise.then(
      (val) => Ok(val),
      (err) => {
        if (mapErr !== undefined) {
          return Err(mapErr(err));
        }

        return Err(err instanceof Error ? err : new Error(String(err)));
      }
    ) as any
  ) as any;
}

function unsafe<T>(promise: Promise<T>): ResultAsync<T, never> {
  return new ResultTypeAsync(
    promise.then((val) => Ok(val))
  );
}

export const ResultAsync = Object.freeze({
  safe,
  unsafe
});
