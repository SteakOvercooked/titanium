import { T, Val, EmptyArray, IterType, FalseyValues, isTruthy } from "./common";
import { Option, Some, None } from "./option";
import { OptionAsync, OptionTypeAsync } from "./option-async";
import { ResultAsync, ResultTypeAsync } from "./result-async";

export type Ok<T> = ResultType<T, never>;
export type Err<E> = ResultType<never, E>;
export type Result<T, E> = ResultType<T, E>;

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
    * Returns the contained `T`, or `err` if the result is `Err`. The `err`
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
    * Returns a tuple of `[null, T]` if the result is `Ok`, or `[E, null]`
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
    * Returns true if the Result is `Ok` and acts as a type guard.
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
    * Returns true if the Result is `Ok` and the value inside of it matches a predicate.
    * Acts as a type guard.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isOkAnd((n) => n === 10), true);
    *
    * const x = Err(10);
    * assert.equal(x.isOkAnd((n) => n === 10), false);
    * ```
    */
   isOkAnd(this: Result<T, E>, f: (val: T) => boolean): this is Ok<T> {
      return this[T] && f(this[Val] as T);
   }

   /**
    * Returns a `Promise` that resolves with true (if `Ok` and the value inside of it matches a predicate), or false otherwise.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isOkAnd((n) => n === 10), true);
    *
    * const x = Err(10);
    * assert.equal(x.isOkAnd((n) => n === 10), false);
    * ```
    */
   async isOkAndAsync(this: Result<T, E>, f: (val: T) => Promise<boolean>): Promise<boolean> {
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
    * Acts as a type guard.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isErrAnd((n) => n === 10), false);
    *
    * const x = Err(10);
    * assert.equal(x.isErrAnd((n) => n === 10), true);
    * ```
    */
   isErrAnd(this: Result<T, E>, f: (err: E) => boolean): this is Err<E> {
      return !this[T] && f(this[Val] as E);
   }

   /**
    * Returns true if the Result is `Err` and the value inside of it matches a predicate.
    * Acts as a type guard.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isErrAnd((n) => n === 10), false);
    *
    * const x = Err(10);
    * assert.equal(x.isErrAnd((n) => n === 10), true);
    * ```
    */
   async isErrAndAsync(this: Result<T, E>, f: (err: E) => Promise<boolean>): Promise<boolean> {
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
   filterAsync(this: Result<T, E>, f: (val: T) => Promise<boolean>): OptionAsync<T> {
      if (!this[T]) {
         return new OptionTypeAsync(Promise.resolve(None));
      }

      return new OptionTypeAsync(
         f(this[Val] as T).then((valid) => valid ? Some(this[Val] as T) : None)
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
    * Returns the contained `Ok` value and throws `Error` with the message
    * including passed `msg` and the content of the `Err`.
    *
    * To avoid throwing, consider `isErr`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `Err` case.
    * 
    * To control the error representation use `mapErr`.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.expect("Was Err"), 1);
    *
    * const x = Err("something went wrong");
    * const y = x.expect("Was Err"); // throws "Was Err: something went wrong"
    * ```
    */
   expect(this: Result<T, E>, msg: string): T {
      if (this[T]) {
         return this[Val] as T;
      }

      throw new Error(`${msg}: ${this[Val]}`);
   }

   /**
    * Returns the contained `Err` value and throws `Error` with the message
    * including passed `msg` and the content of the `Ok`.
    *
    * To avoid throwing, consider `isOk` or `match` to handle the `Ok` case.
    * 
    * ```
    * const x = Ok(1);
    * const y = x.expectErr("list should be empty"); // throws "list should be empty: 1"
    *
    * const x = Err("list is empty");
    * assert.equal(x.expectErr("list should be empty"), "list is empty");
    * ```
    */
   expectErr(this: Result<T, E>, msg: string): E {
      if (!this[T]) {
         return this[Val] as E;
      }
      
      throw new Error(`${msg}: ${this[Val]}`);
   }

   /**
    * Returns the contained `Ok` value if `Ok` and throws the content of `Err` otherwise.
    * If the contained `E` is `Error`, it is thrown untouched. All other values
    * are converted to `Error` first before throwing.
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
    * Returns the contained `Err` value if `Err` and throws the content of `Ok` otherwise.
    * If the contained `T` is `Error`, it is thrown untouched. All other values
    * are converted to `Error` first before throwing.
    *
    * To avoid throwing, consider `isOk` or `match` to handle the `Ok` case.
    * To throw a more informative error use `expectErr`.
    *
    * ```
    * const x = Ok(1);
    * const y = x.unwrapErr(); // throws "Error: 1"
    *
    * const x = Ok(1);
    * assert.equal(x.unwrapErr(), 1);

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
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
    * ```
    */
   unwrapOrElse(this: Result<T, E>, f: (err: E) => T): T {
      return this[T] ? (this[Val] as T) : f(this[Val] as E);
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
   async unwrapOrElseAsync(this: Result<T, E>, f: (err: E) => Promise<T>): Promise<T> {
      return this[T] ? (this[Val] as T) : f(this[Val] as E);
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
   or(this: Result<T, E>, resb: Result<T, E>): Result<T, E> {
      return this[T] ? (this as any) : resb;
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
   orAsync(this: Result<T, E>, resb: ResultAsync<T, E>): ResultAsync<T, E> {
      if (!this[T]) {
         return resb;
      }

      return new ResultTypeAsync(Promise.resolve(this));
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
   orElse<F>(this: Result<T, E>, f: (err: E) => Result<T, F>): Result<T, F> {
      return this[T] ? (this as unknown as Result<T, F>) : f(this[Val] as E);
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
   orElseAsync<F>(this: Result<T, E>, f: (err: E) => Promise<Result<T, F>>): ResultAsync<T, F> {
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
   andThen<U>(this: Result<T, E>, f: (val: T) => Result<U, E>): Result<U, E> {
      return this[T] ? f(this[Val] as T) : (this as any);
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
   andThenAsync<U>(this: Result<T, E>, f: (val: T) => Promise<Result<U, E>>): ResultAsync<U, E> {
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
    * const xmap = x.map((n) => `number ${n}`);
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
    * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
    * `Ok` value.
    *
    * ```
    * const x = Ok(10);
    * const xmap = x.map((n) => `number ${n}`);
    * assert.equal(xmap.unwrap(), "number 10");
    * ```
    */
   mapAsync<U>(this: Result<T, E>, f: (val: T) => Promise<U>): ResultAsync<U, E> {
      if (!this[T]) {
         return new ResultTypeAsync(Promise.resolve(this as any));
      }

      return new ResultTypeAsync(
         f(this[Val] as T).then((val) => Ok(val))
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
   mapErr<F>(this: Result<T, E>, op: (err: E) => F): Result<T, F> {
      return new ResultType(
         this[T] ? (this[Val] as T) : op(this[Val] as E),
         this[T]
      ) as Result<T, F>;
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
   mapErrAsync<F>(this: Result<T, E>, op: (err: E) => Promise<F>): ResultAsync<T, F> {
      if (this[T]) {
         return new ResultTypeAsync(Promise.resolve(this as any));
      }

      return new ResultTypeAsync(
         op(this[Val] as E).then((err) => Err(err))
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
   mapOr<U>(this: Result<T, E>, def: U, f: (val: T) => U): U {
      return this[T] ? f(this[Val] as T) : def;
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
   async mapAsyncOr<U>(this: Result<T, E>, def: U, f: (val: T) => Promise<U>): Promise<U> {
      if (!this[T]) {
         return Promise.resolve(def);
      }
      
      return f(this[Val] as T);
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
   mapOrElse<U>(this: Result<T, E>, def: (err: E) => U, f: (val: T) => U): U {
      return this[T] ? f(this[Val] as T) : def(this[Val] as E);
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
   mapAsyncOrElse<U>(this: Result<T, E>, def: (err: E) => U, f: (val: T) => Promise<U>): Promise<U> {
      if (!this[T]) {
         return Promise.resolve(def(this[Val] as E));
      }

      return f(this[Val] as T);
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
   mapOrElseAsync<U>(this: Result<T, E>, def: (err: E) => Promise<U>, f: (val: T) => U): Promise<U> {
      if (this[T]) {
         return Promise.resolve(f(this[Val] as T));
      }

      return def(this[Val] as E);
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
   mapAsyncOrElseAsync<U>(this: Result<T, E>, def: (err: E) => Promise<U>, f: (val: T) => Promise<U>): Promise<U> {
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
   inspect(this: Result<T, E>, f: (val: T) => void): Result<T, E> {
      if (this[T]) {
         f(this[Val] as T);
      }

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
   inspectErr(this: Result<T, E>, f: (err: E) => void): Result<T, E> {
      if (!this[T]) {
         f(this[Val] as E);
      }

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
Result.safeAsync = safeAsync;
Result.all = all;
Result.any = any;

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

/**
 * Capture the outcome of a function or Promise as a `Result<T, Error>`,
 * preventing throwing (function) or rejection (Promise).
 *
 * **Note:** If the function throws (or the Promise rejects with) a value that
 * is not an instance of `Error`, the value is converted to a string and used
 * as the message text for a new Error instance.
 *
 * ### Usage for functions
 *
 * Calls `fn` with the provided `args` and returns a `Result<T, Error>`. The
 * Result is `Ok` if the provided function returned, or `Err` if it threw.
 *
 * **Note:** Any function which returns a Promise (or PromiseLike) value is
 * rejected by the type signature. `Result<Promise<T>, Error>` is not a useful
 * type, and using it in this way is likely to be a mistake.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Result<string, Error> = Result.safe(mightThrow, true);
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = Result.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 *
 * ### Usage for Promises
 *
 * Accepts `promise` and returns a new Promise which always resolves to
 * `Result<T, Error>`. The Result is `Ok` if the original promise
 * resolved, or `Err` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *    return "Hello World";
 * }
 *
 * const x = await Result.safe(mightThrow(true));
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = await Result.safe(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */
function safe<T>(
   fn: () => T extends PromiseLike<any> ? never : T
): Result<T, Error>;
function safe<T, E>(
   fn: () => T extends PromiseLike<any> ? never : T,
   mapErr: (err: unknown) => E
): Result<T, E>;
function safe<T, E, F extends ((err: unknown) => E) | undefined>(
   fn: () => T extends PromiseLike<any> ? never : T,
   mapErr?: F
): F extends undefined ? Result<T, Error> : Result<T, E> {
   try {
      return Ok(fn());
   } catch (err) {
      if (mapErr !== undefined) {
         return Err(mapErr(err)) as any;
      }

      return Err(toError(err)) as any;
   }
}

function safeAsync<T>(promise: Promise<T>): ResultAsync<T, Error>;
function safeAsync<T, E>(
  promise: Promise<T>,
  mapErr: (err: unknown) => E
): ResultAsync<T, E>;
function safeAsync<T, E, F extends ((err: unknown) => E) | undefined>(
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

        return Err(toError(err));
      }
    ) as any
  ) as any;
}

function toError(err: unknown): Error {
   return err instanceof Error ? err : new Error(String(err));
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
