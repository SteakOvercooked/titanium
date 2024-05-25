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
import { Result, ResultAsync, ResultTypeAsync } from "./result";

export type Some<T> = OptionType<T> & { [T]: true };
export type None = OptionType<never> & { [T]: false };
export type Option<T> = OptionType<T>;
export type OptionAsync<T> = OptionTypeAsync<T>;

type From<T> = Exclude<T, Error | FalseyValues>;

type OptionTypes<O> = {
  [K in keyof O]: O[K] extends Option<infer T> ? T : never;
};

class OptionType<T> {
  readonly [T]: boolean;
  readonly [Val]: T;

  constructor(val: T, some: boolean) {
    this[T] = some;
    this[Val] = val;
  }

  [Symbol.iterator](this: Option<T>): IterType<T> {
    return this[T]
      ? (this[Val] as any)[Symbol.iterator]()
      : EmptyArray[Symbol.iterator]();
  }

  /**
   * Return the contained `T`, or `none` if the option is `None`. The `none`
   * value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x: Option<number> = Option.some(1);
   * assert.equal(x.into(), 1);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.into(), undefined);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.into(null), null);
   * ```
   */
  into(this: Option<T>): T | undefined;
  into<U extends FalseyValues>(this: Option<T>, none: U): T | U;
  into(this: Option<T>, none?: FalseyValues): T | FalseyValues {
    return this[T] ? this[Val] : none;
  }

  /**
   * Returns true if the Option is `Some` and acts as a type guard.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.isSome(), true);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.isSome(), false);
   * ```
   */
  isSome(this: Option<T>): this is Some<T> {
    return this[T];
  }

  /**
   * Returns true if the Option is `Some` and the value inside matches a predicate.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.isSomeAnd((val) => val === 10), true);
   *
   * const x = Option.some(10);
   * assert.equal(x.isSomeAnd((val) => val > 10), false);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.isSomeAnd((val) => val === 10), false);
   * ```
   */
  isSomeAnd(this: Option<T>, f: (val: T) => boolean): boolean {
    return this[T] && f(this[Val]);
  }

  /**
   * Returns a `Promise` that resolves to true if the `Option` is `Some` and the value inside matches a predicate.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.isSomeAndAsync(async (val) => val === 10), true);
   *
   * const x = Option.some(10);
   * assert.equal(x.isSomeAndAsync(async (val) => val > 10), false);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.isSomeAndAsync(async (val) => val === 10), false);
   * ```
   */
  async isSomeAndAsync(
    this: Option<T>,
    f: (val: T) => Promise<boolean>
  ): Promise<boolean> {
    return this[T] && f(this[Val]);
  }

  /**
   * Returns true if the Option is `None` and acts as a type guard.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.isNone(), false);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.isNone(), true);
   * ```
   */
  isNone(this: Option<T>): this is None {
    return !this[T];
  }

  /**
   * Calls `f` with the contained `Some` value, converting `Some` to `None` if
   * the filter returns false.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Option.some(1);
   * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
   *
   * const x = Option.some(10);
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   * ```
   */
  filter(this: Option<T>, f: (val: T) => boolean): Option<T> {
    return this[T] && f(this[Val]) ? this : none;
  }

  /**
   * Calls `f` with the contained `Some` value, converting `Some` to `None` if
   * the filter returns false, or `Some` otherwise.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Option.some(1);
   * const xFilter = x.filterAsync(async (v) => v < 5);
   * assert.equal(await xFilter.unwrapAsync(), 1);
   *
   * const x = Option.some(10);
   * const xFilter = x.filterAsync(async (v) => v < 5);
   * assert.equal(await xFilter.isNoneAsync(), true);
   *
   * const x: Option<number> = Option.none;
   * const xFilter = x.filterAsync(async (v) => v < 5);
   * assert.equal(await xFilter.isNoneAsync(), true);
   * ```
   */
  filterAsync(
    this: Option<T>,
    f: (val: T) => Promise<boolean>
  ): OptionAsync<T> {
    if (!this[T]) {
      return new OptionTypeAsync(Promise.resolve(this));
    }

    return new OptionTypeAsync(
      f(this[Val]).then((pass) => (pass ? this : none))
    );
  }

  /**
   * Flatten a nested `Option<Option<T>>` to an `Option<T>`.
   *
   * ```
   * type NestedOption = Option<Option<number>>;
   *
   * const x: NestedOption = Option.some(Option.some(1));
   * assert.equal(x.flatten().unwrap(), 1);
   *
   * const x: NestedOption = Option.some(Option.none);
   * assert.equal(x.flatten().isNone(), true);
   *
   * const x: NestedOption = Option.none;
   * assert.equal(x.flatten().isNone(), true);
   * ```
   */
  flatten<U>(this: Option<Option<U>>): Option<U> {
    return this[T] ? this[Val] : none;
  }

  /**
   * Flatten a nested `Option<OptionAsync<T>>` to an `OptionAsync<T>`.
   *
   * ```
   * type NestedOption = Option<OptionAsync<number>>;
   *
   * const xNested = Option.safe(Promise.resolve(1));
   * const x: NestedOption = Option.some(xNested);
   * assert.equal(await x.flattenAsync().unwrapAsync(), 1);
   *
   * const xNested = Option.safe(Promise.reject(1));
   * const x: NestedOption = Option.some(xNested);
   * assert.equal(await x.flattenAsync().isNoneAsync(), true);
   *
   * const x: NestedOption = Option.none;
   * assert.equal(await x.flattenAsync().isNoneAsync(), true);
   * ```
   */
  flattenAsync<U>(this: Option<OptionAsync<U>>): OptionAsync<U> {
    if (!this[T]) {
      return new OptionTypeAsync(Promise.resolve(none));
    }

    return new OptionTypeAsync(Promise.resolve(this[Val]));
  }

  /**
   * Returns the contained `Some` value if `Some`, or throws `Error` with the `msg` message.
   *
   * To avoid throwing, consider `isNone`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `None` case.
   *
   * ```
   * const x: Option<number> = Option.some(1);
   * assert.equal(x.expect("must be a number"), 1);
   *
   * const x = Option.none;
   * const y = x.expect("must be a number"); // throws "Error: must be a number"
   * ```
   */
  expect(this: Option<T>, msg: string): T {
    if (this[T]) {
      return this[Val];
    }

    throw new Error(msg);
  }

  /**
   * Returns the contained `Some` value and throws if `None`.
   *
   * To avoid throwing, consider `isSome`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `None` case. To throw a more informative error use
   * `expect`.
   *
   * ```
   * const x = Option.some(1);
   * assert.equal(x.unwrap(), 1);
   *
   * const x: Option<number> = Option.none;
   * const y = x.unwrap(); // throws "Error: expected Some, got None"
   * ```
   */
  unwrap(this: Option<T>): T {
    if (this[T]) {
      return this[Val];
    }

    throw new Error("expected Some, got None");
  }

  /**
   * Returns the contained `Some` value or a provided default.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.unwrapOr(1), 10);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.unwrapOr(1), 1);
   * ```
   */
  unwrapOr(this: Option<T>, def: T): T {
    return this[T] ? this[Val] : def;
  }

  /**
   * Returns the contained `Some` value or computes it from a function.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
   * ```
   */
  unwrapOrElse(this: Option<T>, f: () => T): T {
    return this[T] ? this[Val] : f();
  }

  /**
   * Returns a `Promise` that resolves to the contained `Some` value or computes it from a function.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(await x.unwrapOrElseAsync(async () => 1 + 1), 10);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(await x.unwrapOrElseAsync(async () => 1 + 1), 2);
   * ```
   */
  async unwrapOrElseAsync(this: Option<T>, f: () => Promise<T>): Promise<T> {
    return this[T] ? this[Val] : f();
  }

  /**
   * Returns the contained `Some` value or undefined if `None`.
   *
   * Most problems are better solved using one of the other `unwrap_` methods.
   * This method should only be used when you are certain that you need it.
   *
   * ```
   * const x = Option.some(10);
   * assert.equal(x.unwrapUnchecked(), 10);
   *
   * const x: Option<number> = Option.none;
   * assert.equal(x.unwrapUnchecked(), undefined);
   * ```
   */
  unwrapUnchecked(this: Option<T>): T | undefined {
    return this[Val];
  }

  /**
   * Returns the Option if it is `Some`, otherwise returns `optb`.
   *
   * `optb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElse`, which is lazily evaluated.
   *
   * ```
   * const x = Option.some(10);
   * const xor = x.or(Option.some(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x: Option<number> = Option.none;
   * const xor = x.or(Option.some(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  or(this: Option<T>, optb: Option<T>): Option<T> {
    return this[T] ? this : optb;
  }

  /**
   * Returns an `OptionAsync` with the underlying value if `Some`, otherwise returns `optb`.
   *
   * `optb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElseAsync`, which is lazily evaluated.
   *
   * ```
   * const someAsync = Option.safe(Promise.resolve(10));
   * const x = Option.some(10);
   * const xor = x.orAsync(someAsync);
   * assert.equal(await xor.unwrapAsync(), 10);
   *
   * const someAsync = Option.safe(Promise.resolve(10));
   * const x: Option<number> = Option.none;
   * const xor = x.orAsync(someAsync);
   * assert.equal(await x.unwrapAsync(), 1);
   * ```
   */
  orAsync(this: Option<T>, optb: OptionAsync<T>): OptionAsync<T> {
    if (!this[T]) {
      return optb;
    }

    return new OptionTypeAsync(Promise.resolve(this));
  }

  /**
   * Returns the Option if it is `Some`, otherwise returns the value of `f()`.
   *
   * ```
   * const x = Option.some(10);
   * const xor = x.orElse(() => Option.some(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x: Option<number> = Option.none;
   * const xor = x.orElse(() => Option.some(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  orElse(this: Option<T>, f: () => Option<T>): Option<T> {
    return this[T] ? this : f();
  }

  /**
   * Returns the `OptionAsync` with the contained value if `Some`, otherwise returns the value of `f()`.
   *
   * ```
   * const x = Option.some(10);
   * const xor = x.orElseAsync(async () => Option.some(1));
   * assert.equal(await xor.unwrapAsync(), 10);
   *
   * const x: Option<number> = Option.none;
   * const xor = x.orElseAsync(async () => Option.some(1));
   * assert.equal(await xor.unwrapAsync(), 1);
   * ```
   */
  orElseAsync(this: Option<T>, f: () => Promise<Option<T>>): OptionAsync<T> {
    if (!this[T]) {
      return new OptionTypeAsync(f());
    }

    return new OptionTypeAsync(Promise.resolve(this));
  }

  /**
   * Returns `None` if the Option is `None`, otherwise returns `optb`.
   *
   * ```
   * const x = Option.some(10);
   * const xand = x.and(Option.some(1));
   * assert.equal(xand.unwrap(), 1);
   *
   * const x: Option<number> = Option.none;
   * const xand = x.and(Option.some(1));
   * assert.equal(xand.isNone(), true);
   *
   * const x = Option.some(10);
   * const xand = x.and(Option.none);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  and<U>(this: Option<T>, optb: Option<U>): Option<U> {
    return this[T] ? optb : none;
  }

  /**
   * Returns the `OptionAsync` containing `None` if the Option is `None`, otherwise returns `optb`.
   *
   * ```
   * const someAsync = Option.safe(Promise.resolve(1));
   * const x = Option.some(10);
   * const xand = x.andAsync(someAsync);
   * assert.equal(await xand.unwrapAsync(), 1);
   *
   * const someAsync = Option.safe(Promise.resolve(1));
   * const x: Option<number> = Option.none;
   * const xand = x.andAsync(someAsync);
   * assert.equal(await xand.isNoneAsync(), true);
   *
   * const noneAsync = Option.safe(Promise.reject(1));
   * const x = Option.some(10);
   * const xand = x.andAsync(noneAsync);
   * assert.equal(await xand.isNoneAsync(), true);
   * ```
   */
  andAsync<U>(this: Option<T>, optb: OptionAsync<U>): OptionAsync<U> {
    if (this[T]) {
      return optb;
    }

    return new OptionTypeAsync(Promise.resolve(this as None));
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * ```
   * const x = Option.some(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrap(), 11);
   *
   * const x: Option<number> = Option.none;
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.isNone(), true);
   *
   * const x = Option.some(10);
   * const xand = x.andThen(() => Option.none);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  andThen<U>(this: Option<T>, f: (val: T) => Option<U>): Option<U> {
    return this[T] ? f(this[Val]) : none;
  }

  /**
   * Returns the `OptionAsync` containing `None` if the option is `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * ```
   * const x = Option.some(10);
   * const xand = x.andThenAsync(async (n) => Option.some(n + 1));
   * assert.equal(await xand.unwrapAsync(), 11);
   *
   * const x: Option<number> = Option.none;
   * const xand = x.andThenAsync(async (n) => Option.some(n + 1));
   * assert.equal(await xand.isNoneAsync(), true);
   *
   * const x = Option.some(10);
   * const xand = x.andThenAsync(async () => Option.none);
   * assert.equal(await xand.isNoneAsync(), true);
   * ```
   */
  andThenAsync<U>(
    this: Option<T>,
    f: (val: T) => Promise<Option<U>>
  ): OptionAsync<U> {
    if (this[T]) {
      return new OptionTypeAsync(f(this[Val]));
    }

    return new OptionTypeAsync(Promise.resolve(this as any));
  }

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function to the `Some` value.
   *
   * ```
   * const x = Option.some(10);
   * const xmap = x.map((n) => `number ${n}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  map<U>(this: Option<T>, f: (val: T) => U): Option<U> {
    return this[T] ? new OptionType(f(this[Val]), true) : none;
  }

  /**
   * Maps an `Option<T>` to `OptionAsync<U>` by applying a function to the `Some` value.
   *
   * ```
   * const x = Option.some(10);
   * const xmap = x.mapAsync(async (n) => `number ${n}`);
   * assert.equal(await xmap.unwrapAsync(), "number 10");
   * ```
   */
  mapAsync<U>(this: Option<T>, f: (val: T) => Promise<U>): OptionAsync<U> {
    if (!this[T]) {
      return new OptionTypeAsync(Promise.resolve(none));
    }

    return new OptionTypeAsync(f(this[Val]).then((val) => some(val)));
  }

  /**
   * Returns the provided default if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Option.some(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x: Option<number> = Option.none;
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 1);
   * ```
   */
  mapOr<U>(this: Option<T>, def: Sync<U>, f: (val: T) => Sync<U>): U {
    return this[T] ? f(this[Val]) : def;
  }

  /**
   * Returns a `Promise` that resolves to the provided default if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Option.some(10);
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 11);
   *
   * const x: Option<number> = Option.none;
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 1);
   * ```
   */
  async mapOrAsync<U>(
    this: Option<T>,
    def: U,
    f: (val: T) => Promise<U>
  ): Promise<U> {
    return this[T] ? f(this[Val]) : def;
  }

  /**
   * Computes a default return value if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * const x = Option.some(10);
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x: Option<number> = Option.none;
   * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 2);
   * ```
   */
  mapOrElse<U>(this: Option<T>, def: () => Sync<U>, f: (val: T) => Sync<U>): U {
    return this[T] ? f(this[Val]) : def();
  }

  /**
   * Computes a default return value if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * const x = Option.some(10);
   * const xmap = x.mapOrElseAsync(() => 1 + 1, async (n) => n + 1);
   * assert.equal(await xmap, 11);
   *
   * const x: Option<number> = Option.none;
   * const xmap = x.mapOrElseAsync(async () => 1 + 1, (n) => n + 1);
   * assert.equal(await xmap, 2);
   * ```
   */
  async mapOrElseAsync<U>(
    this: Option<T>,
    def: () => Promise<U>,
    f: (val: T) => U
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Option<T>,
    def: () => U,
    f: (val: T) => Promise<U>
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Option<T>,
    def: () => Promise<U>,
    f: (val: T) => Promise<U>
  ): Promise<U>;
  async mapOrElseAsync<U>(
    this: Option<T>,
    def: () => U | Promise<U>,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this[T] ? f(this[Val]) : def();
  }

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Option.some(v)` to
   * `Result.ok(v)` and `Option.none` to `Result.err(err)`.
   *
   * ```
   * const x = Option.some(10);
   * const res = x.okOr("Is empty");
   * assert.equal(x.isOk(), true);
   * assert.equal(x.unwrap(), 10);
   *
   * const x: Option<number> = Option.none;
   * const res = x.okOr("Is empty");
   * assert.equal(x.isErr(), true);
   * assert.equal(x.unwrapErr(), "Is empty");
   * ```
   */
  okOr<E>(this: Option<T>, err: E): Result<T, E> {
    return this[T] ? Result.ok(this[Val]) : Result.err(err);
  }

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Option.some(v)` to
   * `Result.ok(v)` and `Option.none` to `Result.err(f())`.
   *
   * ```
   * const x = Option.some(10);
   * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
   * assert.equal(x.isOk(), true);
   * assert.equal(x.unwrap(), 10);
   *
   * const x: Option<number> = Option.none;
   * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
   * assert.equal(x.isErr(), true);
   * assert.equal(x.unwrap_err(), "Is empty");
   * ```
   */
  okOrElse<E>(this: Option<T>, f: () => Sync<E>): Result<T, E> {
    return this[T] ? Result.ok(this[Val]) : Result.err(f());
  }

  /**
   * Transforms the `Option<T>` into a `ResultAsync<T, E>`, mapping `Option.some(v)` to
   * `Result.ok(v)` and `Option.none` to `Result.err(f())`.
   *
   * ```
   * const x = Option.some(10);
   * const res = x.okOrElseAsync(async () => ["Is", "empty"].join(" "));
   * assert.equal(await x.isOkAsync(), true);
   * assert.equal(await x.unwrapAsync(), 10);
   *
   * const x: Option<number> = Option.none;
   * const res = x.okOrElseAsync(async () => ["Is", "empty"].join(" "));
   * assert.equal(await x.isErrAsync(), true);
   * assert.equal(await x.unwrapErrAsync(), "Is empty");
   * ```
   */
  okOrElseAsync<E>(this: Option<T>, f: () => Promise<E>): ResultAsync<T, E> {
    if (this[T]) {
      return new ResultTypeAsync(Promise.resolve(Result.ok(this[Val])));
    }

    return new ResultTypeAsync(f().then((err) => Result.err(err)));
  }

  /**
   * Calls the provided closure with the contained value if `Some`, otherwise does nothing.
   *
   * ```
   * // Prints the contained value.
   * Option.some(10).inspect((n) => console.log(n));
   *
   * // Doesn't produce any output.
   * Option.none.inspect((n) => console.log(n));
   * ```
   */
  inspect(this: Option<T>, f: (val: T) => void): Option<T> {
    if (this[T]) {
      f(this[Val] as T);
    }

    return this;
  }
}

export class OptionTypeAsync<T> {
  readonly [Prom]: Promise<Option<T>>;

  constructor(producer: Promise<Option<T>>) {
    this[Prom] = producer;
  }

  then<A, B>(
    onSuccess?: (res: Option<T>) => A | PromiseLike<A>,
    onFailure?: (err: unknown) => B | PromiseLike<B>
  ): Promise<A | B> {
    return this[Prom].then(onSuccess, onFailure);
  }

  /**
   * Return the contained `T`, or `none` if the option is `None`. The `none`
   * value must be falsey and defaults to `undefined`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * assert.equal(await x.intoAsync(), 1);
   *
   * const x = Option.safe(Promise.reject(1));
   * assert.equal(await x.intoAsync(), undefined);
   *
   * const x = Option.safe(Promise.reject(1));
   * assert.equal(await x.intoAsync(null), null);
   * ```
   */
  async intoAsync(this: OptionAsync<T>): Promise<T | undefined>;
  async intoAsync<U extends FalseyValues>(
    this: OptionAsync<T>,
    none: U
  ): Promise<T | U>;
  async intoAsync(
    this: OptionAsync<T>,
    none?: FalseyValues
  ): Promise<T | FalseyValues> {
    return this.then((opt) => opt.into(none));
  }

  /**
   * Returns true if the `OptionAsync` is `Some` and acts as a type guard.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * assert.equal(x.isSomeAsync(), true);
   *
   * const x = Option.safe(Promise.reject(1));
   * assert.equal(await x.isSomeAsync(), false);
   * ```
   */
  async isSomeAsync(this: OptionAsync<T>): Promise<boolean> {
    return this.then((opt) => opt.isSome());
  }

  /**
   * Returns a `Promise` that resolves to true if the `OptionAsync` is `Some` and the value inside matches a predicate.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(x.isSomeAndAsync(async (val) => val === 10), true);
   *
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(x.isSomeAndAsync(async (val) => val > 10), false);
   *
   * const x = Option.safe(Promise.reject(1));
   * assert.equal(x.isSomeAndAsync(async (val) => val === 10), false);
   * ```
   */
  async isSomeAndAsync(
    this: OptionAsync<T>,
    f: (val: T) => boolean | Promise<boolean>
  ): Promise<boolean> {
    return this.then((opt) => opt.isSomeAndAsync(async (val) => f(val)));
  }

  /**
   * Returns true if the `OptionAsync` is `None`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(awiat x.isNoneAsync(), false);
   *
   * const x = Option.safe(Promise.reject(10));
   * assert.equal(await x.isNoneAsync(), true);
   * ```
   */
  async isNoneAsync(this: OptionAsync<T>): Promise<boolean> {
    return this.then((opt) => opt.isNone());
  }

  /**
   * Calls `f` with the contained `Some` value, converting `Some` to `None` if
   * the filter returns false, or `Some` otherwise.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * const xFilter = x.filterAsync(async (v) => v < 5);
   * assert.equal(await xFilter.unwrapAsync(), 1);
   *
   * const x = Option.safe(Promise.resolve(10));
   * const xFilter = x.filterAsync((v) => v < 5);
   * assert.equal(await xFilter.isNoneAsync(), true);
   *
   * const x = Option.safe(Promise.reject(10));
   * const xFilter = x.filterAsync(async (v) => v < 5);
   * assert.equal(await xFilter.isNoneAsync(), true);
   * ```
   */
  filterAsync(
    this: OptionAsync<T>,
    f: (val: T) => boolean | Promise<boolean>
  ): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.filterAsync(async (val) => f(val)))
    );
  }

  /**
   * Flatten a nested `OptionAsync<Option<T>>` to an `OptionAsync<T>`.
   *
   * ```
   * type NestedOption = OptionAsync<Option<number>>;
   *
   * const x: NestedOption = Option.safe(Promise.resolve(Option.some(1)));
   * assert.equal(await x.flattenAsync().unwrapAsync(), 1);
   *
   * const x = Option.safe(Promise.resolve(Option.none));
   * assert.equal(await x.flattenAsync().isNoneAsync(), true);
   *
   * const x: NestedOption = Option.none;
   * assert.equal(await x.flattenAsync().isNoneAsync(), true);
   * ```
   */
  flattenAsync<U>(this: OptionAsync<Option<U>>): OptionAsync<U> {
    return new OptionTypeAsync(this.then((opt) => opt.flatten()));
  }

  /**
   * Returns the contained `Some` value if `Some`, or throws `Error` with the `msg` message.
   *
   * To avoid throwing, consider `isNoneAsync`, `unwrapOrAsync`, `unwrapOrElseAsync` or
   * `match` to handle the `None` case.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * assert.equal(await x.expectAsync("must be a number"), 1);
   *
   * const x = Option.safe(Promise.reject(1));
   * const y = await x.expectAsync("must be a number"); // throws "Error: must be a number"
   * ```
   */
  async expectAsync(this: OptionAsync<T>, msg: string): Promise<T> {
    return this.then((opt) => opt.expect(msg));
  }

  /**
   * Returns the contained `Some` value and throws if `None`.
   *
   * To avoid throwing, consider `isSomeAsync`, `unwrapOrAsync`, `unwrapOrElseAsync` or
   * `match` to handle the `None` case. To throw a more informative error use
   * `expectAsync`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * assert.equal(await x.unwrapAsync(), 1);
   *
   * const x = Option.safe(Promise.reject(1));
   * const y = await x.unwrapAsync(); // throws "Error: expected Some, got None"
   * ```
   */
  async unwrapAsync(this: OptionAsync<T>): Promise<T> {
    return this.then((opt) => opt.unwrap());
  }

  /**
   * Returns the contained `Some` value or a provided default.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `unwrapOrElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(await x.unwrapOrAsync(1), 10);
   *
   * const x = Option.safe(Promise.reject(10));
   * assert.equal(await x.unwrapOrAsync(1), 1);
   * ```
   */
  async unwrapOrAsync(this: OptionAsync<T>, def: T): Promise<T> {
    return this.then((opt) => opt.unwrapOr(def));
  }

  /**
   * Returns the contained `Some` value or computes it from a function.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(await x.unwrapOrElseAsync(async () => 1 + 1), 10);
   *
   * const x = Option.safe(Promise.reject(10));
   * assert.equal(await x.unwrapOrElseAsync(() => 1 + 1), 2);
   * ```
   */
  async unwrapOrElseAsync(
    this: OptionAsync<T>,
    f: () => T | Promise<T>
  ): Promise<T> {
    return this.then((opt) => opt.unwrapOrElseAsync(async () => f()));
  }

  /**
   * Returns the contained `Some` value or undefined if `None`.
   *
   * Most problems are better solved using one of the other `unwrap_` methods.
   * This method should only be used when you are certain that you need it.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * assert.equal(await x.unwrapUncheckedAsync(), 10);
   *
   * const x = Option.safe(Promise.reject(10));
   * assert.equal(await x.unwrapUncheckedAsync(), undefined);
   * ```
   */
  async unwrapUncheckedAsync(this: OptionAsync<T>): Promise<T | undefined> {
    return this.then((opt) => opt.unwrapUnchecked());
  }

  /**
   * Returns an `OptionAsync` with the underlying value if `Some`, otherwise returns `optb`.
   *
   * `optb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const y = Option.safe(Promise.resolve(1));
   * const xor = x.orAsync(y);
   * assert.equal(await xor.unwrapAsync(), 10);
   *
   * const x = Option.safe(Promise.reject(10));
   * const y = Option.some(1);
   * const xor = x.orAsync(y);
   * assert.equal(await x.unwrapAsync(), 1);
   * ```
   */
  orAsync(
    this: OptionAsync<T>,
    optb: Option<T> | OptionAsync<T>
  ): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) =>
        optb instanceof OptionType ? opt.or(optb) : opt.orAsync(optb)
      )
    );
  }

  /**
   * Returns the `OptionAsync` if it is `Some`, otherwise returns the value of `f()`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const xor = x.orElseAsync(() => Option.some(1));
   * assert.equal(await xor.unwrapAsync(), 10);
   *
   * const x = Option.safe(Promise.reject(10));
   * const xor = x.orElseAsync(async () => Option.some(1));
   * assert.equal(await xor.unwrapAsync(), 1);
   * ```
   */
  orElseAsync(
    this: OptionAsync<T>,
    f: () => Option<T> | Promise<Option<T>>
  ): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.orElseAsync(async () => f()))
    );
  }

  /**
   * Returns the `OptionAsync` if it is `None`, otherwise returns `optb`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(1));
   * const y = Option.some(10);
   * const xand = x.andAsync(y);
   * assert.equal(await xand.unwrapAsync(), 10);
   *
   * const x = Option.safe(Promise.resolve(1));
   * const y = Option.safe(Promise.reject(10));
   * const xand = x.andAsync(y);
   * assert.equal(await xand.isNoneAsync(), true);
   *
   * const x = Option.safe(Promise.reject(1));
   * const y = Option.safe(Promise.resolve(10));
   * const xand = x.andAsync(y);
   * assert.equal(await xand.isNoneAsync(), true);
   * ```
   */
  andAsync<U>(
    this: OptionAsync<T>,
    optb: Option<U> | OptionAsync<U>
  ): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) =>
        optb instanceof OptionType ? opt.and(optb) : opt.andAsync(optb)
      )
    );
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const xand = x.andThenAsync(async (n) => n + 1);
   * assert.equal(await xand.unwrapAsync(), 11);
   *
   * const x = Option.safe(Promise.reject(10));
   * const xand = x.andThenAsync((n) => n + 1);
   * assert.equal(await xand.isNoneAsync(), true);
   *
   * const x = Option.safe(Promise.resolve(10));
   * const xand = x.andThenAsync(async () => Option.none);
   * assert.equal(await xand.isNoneAsync(), true);
   * ```
   */
  andThenAsync<U>(
    this: OptionAsync<T>,
    f: (val: T) => Option<U> | Promise<Option<U>>
  ): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.andThenAsync(async (val) => f(val)))
    );
  }

  /**
   * Maps an `OptionAsync<T>` to `OptionAsync<U>` by applying a function to the `Some` value.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const xmap = x.mapAsync(async (n) => `number ${n}`);
   * assert.equal(await xmap.unwrapAsync(), "number 10");
   * ```
   */
  mapAsync<U>(
    this: OptionAsync<T>,
    f: (val: T) => U | Promise<U>
  ): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.mapAsync(async (val) => f(val)))
    );
  }

  /**
   * Returns a `Promise` that resolves to the provided default if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElseAsync`, which is lazily evaluated.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Option.safe(Promise.reject(1));
   * const xmap = x.mapOrAsync(1, async (n) => n + 1);
   * assert.equal(await xmap, 1);
   * ```
   */
  async mapOrAsync<U>(
    this: OptionAsync<T>,
    def: U,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this.then((opt) => opt.mapOrAsync(def, async (val) => f(val)));
  }

  /**
   * Computes a default return value if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * const x = Option.safe(Promise.resolve(10));
   * const xmap = x.mapOrElseAsync(() => 1 + 1, async (n) => n + 1);
   * assert.equal(await xmap, 11);
   *
   * const x = Option.safe(Promise.reject(1));
   * const xmap = x.mapOrElseAsync(async () => 1 + 1, (n) => n + 1);
   * assert.equal(await xmap, 2);
   * ```
   */
  async mapOrElseAsync<U>(
    this: OptionAsync<T>,
    def: () => U | Promise<U>,
    f: (val: T) => U | Promise<U>
  ): Promise<U> {
    return this.then((opt) =>
      opt.mapOrElseAsync(
        async () => def(),
        async (val) => f(val)
      )
    );
  }

  /**
   * Transforms the `OptionAsync<T>` into a `ResultAsync<T, E>`, mapping `Option.some(v)` to
   * `Result.ok(v)` and `Option.none` to `Result.err(err)`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const res = x.okOrAsync("Is empty");
   * assert.equal(await x.isOkAsync(), true);
   * assert.equal(await x.unwrapAsync(), 10);
   *
   * const x = Option.safe(Promise.reject(1));
   * const res = x.okOrAsync("Is empty");
   * assert.equal(await x.isErrAsync(), true);
   * assert.equal(await x.unwrapErrAsync(), "Is empty");
   * ```
   */
  okOrAsync<E>(this: OptionAsync<T>, err: E): ResultAsync<T, E> {
    return new ResultTypeAsync(this.then((opt) => opt.okOr(err)));
  }

  /**
   * Transforms the `OptionAsync<T>` into a `ResultAsync<T, E>`, mapping `Option.some(v)` to
   * `Result.ok(v)` and `Option.none` to `Result.err(f())`.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * const res = x.okOrElseAsync(async () => ["Is", "empty"].join(" "));
   * assert.equal(await x.isOkAsync(), true);
   * assert.equal(await x.unwrapAsync(), 10);
   *
   * const x = Option.safe(Promise.reject(1));
   * const res = x.okOrElseAsync(async () => ["Is", "empty"].join(" "));
   * assert.equal(await x.isErrAsync(), true);
   * assert.equal(await x.unwrapErrAsync(), "Is empty");
   * ```
   */
  okOrElseAsync<E>(
    this: OptionAsync<T>,
    f: () => E | Promise<E>
  ): ResultAsync<T, E> {
    return new ResultTypeAsync(
      this.then((opt) => opt.okOrElseAsync(async () => f()))
    );
  }

  /**
   * Calls the provided closure with the contained value (if `Some`), otherwise does nothing.
   * If the `Promise` rejects the error is ignored.
   *
   * ```
   * const x = Option.safe(Promise.resolve(10));
   * // Prints the contained value at some point in the chain.
   * x.inspectAsync((n) => console.log(n));
   *
   * const x = Option.safe(Promise.reject(10));
   * // Doesn't produce any output.
   * x.inspectAsync((n) => console.log(n));
   * ```
   */
  inspectAsync(this: OptionAsync<T>, f: (val: T) => void): OptionAsync<T> {
    this.then((opt) => opt.inspect(f));
    return this;
  }
}

/**
 * The `None` value, which can be used where an `Option<T>` is required.
 * See Option for more examples.
 *
 * ```
 * const x = Option.none;
 * assert.equal(x.isNone(), true);
 * const y = x.unwrap(); // throws
 * ```
 */
const none = Object.freeze(new OptionType<never>(undefined as never, false));

/**
 * An Option represents either something, or nothing. If we hold a value
 * of type `Option<T>`, we know it is either `Some<T>` or `None`.
 *
 * ```
 * const users = ["Fry", "Bender"];
 * function fetch_user(username: string): Option<string> {
 *    return users.includes(username) ? Option.some(username) : Option.none;
 * }
 *
 * function greet(username: string): string {
 *    return fetch_user(username)
 *       .map((user) => `Good news everyone, ${user} is here!`)
 *       .unwrapOr("Wha?");
 * }
 *
 * assert.equal(greet("Bender"), "Good news everyone, Bender is here!");
 * assert.equal(greet("SuperKing"), "Wha?");
 * ```
 */
export const Option = Object.freeze({
  some,
  none,
  is,
  from,
  nonNull,
  safe,
  unsafe,
  all,
  any,
});

/**
 * Creates a `Some<T>` value, which can be used where an `Option<T>` is
 * required. See Option for more examples.
 *
 * ```
 * const x = Option.some(10);
 * assert.equal(x.isSome(), true);
 * assert.equal(x.unwrap(), 10);
 * ```
 */
function some<T>(val: T): Some<T> {
  return new OptionType(val, true) as Some<T>;
}

/**
 * Tests whether the provided `val` is an Option, and acts as a type guard.
 *
 * ```
 * assert.equal(Option.is(Option.some(1), true);
 * assert.equal(Option.is(Option.none, true));
 * assert.equal(Option.is(Result.ok(1), false));
 * ```
 */
function is(val: unknown): val is Option<unknown> {
  return val instanceof OptionType;
}

/**
 * Creates a new `Option<T>` which is `Some` unless the provided `val` is
 * falsey, an instance of `Error` or an invalid `Date`. This function is
 * aliased by `Option`.
 *
 * The `T` type is narrowed to exclude falsey or Error values.
 *
 * ```
 * assert.equal(Option.from(1).unwrap(), 1);
 * assert.equal(from(0).isNone(), true);
 *
 * const err = Option.from(new Error("msg"));
 * assert.equal(err.isNone(), true);
 * ```
 */
function from<T>(val: T): Option<From<T>> {
  return isTruthy(val) && !(val instanceof Error) ? (some(val) as any) : none;
}

/**
 * Creates a new `Option<T>` which is `Some` unless the provided `val` is
 * `undefined`, `null` or `NaN`.
 *
 * ```
 * assert.equal(Option.nonNull(1).unwrap(), 1);
 * assert.equal(Option.nonNull(0).unwrap(), 0);
 * assert.equal(Option.nonNull(null).isNone(), true);
 * ```
 */
function nonNull<T>(val: T): Option<NonNullable<T>> {
  return val === undefined || val === null || val !== val
    ? none
    : some(val as NonNullable<T>);
}

/**
 * Capture the outcome of a function or Promise as an `Option<T>` or `OptionAsync<T>`, preventing
 * throwing (function) or rejection (Promise).
 *
 * ### Usage for functions
 *
 * Calls `fn` and returns an `Option<T>`. The Option
 * is `Some` if the provided function returned, or `None` if it threw.
 *
 * **Note:** Any function which returns a Promise (or PromiseLike) value is
 * rejected by the type signature. `Option<Promise<T>>` is not a useful type,
 * and using it in this way is likely to be a mistake.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Option<string> = Option.safe(mightThrow, true);
 * assert.equal(x.isNone(), true);
 *
 * const x = Option.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 *
 * ### Usage for Promises
 *
 * Accepts `promise` and returns an `OptionAsync`. The Result is `Some` if the original promise
 * resolved, or `None` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *    return "Hello World";
 * }
 *
 * const x = await Option.safe(mightThrow(true));
 * assert.equal(x.isNone(), true);
 *
 * const x = await Option.safe(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */
function safe<T>(fn: () => Sync<T>): Option<T>;
function safe<T>(promise: Promise<T>): OptionAsync<T>;
function safe<T>(fn: (() => T) | Promise<T>): Option<T> | OptionAsync<T> {
  if (fn instanceof Promise) {
    return new OptionTypeAsync(
      fn.then(
        (val) => some(val),
        () => none
      )
    );
  }

  try {
    return some(fn());
  } catch {
    return none;
  }
}

/**
 * Converts a number of `Option`s into a single Option. If any of the provided
 * Options are `None` then the new Option is also None. Otherwise the new
 * Option is `Some` and contains an array of all the unwrapped values.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Option.some(val) : Option.none;
 * }
 *
 * const xyz = Option.all(num(20), num(30), num(40));
 * const [x, y, z] = xyz.unwrap();
 * assert.equal(x, 20);
 * assert.equal(y, 30);
 * assert.equal(z, 40);
 *
 * const x = Option.all(num(20), num(5), num(40));
 * assert.equal(x.isNone(), true);
 * ```
 */
function all<O extends Option<any>[]>(...options: O): Option<OptionTypes<O>> {
  const values = [];
  for (const option of options) {
    if (option.isSome()) {
      values.push(option.unwrap());
    } else {
      return none;
    }
  }

  return some(values) as Some<OptionTypes<O>>;
}

/**
 * Converts a number of `Options`s into a single Option. The first `Some` found
 * (if any) is returned, otherwise the new Option is `None`.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Option.some(val) : Option.none;
 * }
 *
 * const x = Option.any(num(5), num(20), num(2));
 * assert.equal(x.unwrap(), 20);
 *
 * const x = Option.any(num(2), num(5), num(8));
 * assert.equal(x.isNone(), true);
 * ```
 */
function any<O extends Option<any>[]>(
  ...options: O
): Option<OptionTypes<O>[number]> {
  for (const option of options) {
    if (option.isSome()) {
      return option as Option<OptionTypes<O>[number]>;
    }
  }
  return none;
}

/**
 * Wraps a `Promise` of an `Option<T>` and produces `OptionAsync<T>`.
 *
 * **Note**: the rejection of the wrapped `Promise` is not handled,
 * consider `Option.safe` to safely wrap a `Promise`.
 */
function unsafe<T>(p: Promise<Option<T>>) {
  return new OptionTypeAsync(p);
}
