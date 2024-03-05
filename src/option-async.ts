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

  /**
   * Calls `f` with the contained `Some` value, converting `Some` to `None` if
   * the filter returns false.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Some(1);
   * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
   *
   * const x = Some(10);
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   *
   * const x: Option<number> = None;
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   * ```
   */
  filter(this: OptionAsync<T>, f: (val: T) => boolean): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.filter(f))
    );
  }

  /**
   * Calls `f` with the contained `Some` value, converting `Some` to `None` if
   * the filter returns false.
   *
   * For more advanced filtering, consider `match`.
   *
   * ```
   * const x = Some(1);
   * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
   *
   * const x = Some(10);
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   *
   * const x: Option<number> = None;
   * assert.equal(x.filter((v) => v < 5).isNone(), true);
   * ```
   */
  filterAsync(this: OptionAsync<T>, f: (val: T) => Promise<boolean>): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.filterAsync(f))
    );
  }

  /**
   * Flatten a nested `Option<Option<T>>` to an `Option<T>`.
   *
   * ```
   * type NestedOption = Option<Option<number>>;
   *
   * const x: NestedOption = Some(Some(1));
   * assert.equal(x.flatten().unwrap(), 1);
   *
   * const x: NestedOption = Some(None);
   * assert.equal(x.flatten().isNone(), true);
   *
   * const x: NestedOption = None;
   * assert.equal(x.flatten().isNone(), true);
   * ```
   */
  // flatten<U>(this: Option<Option<U>>): Option<U> {
  //   return this[T] ? this[Val] : None;
  // }

  /**
   * Returns the contained `Some` value and throws `Error(msg)` if `None`.
   *
   * To avoid throwing, consider `Is`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `None` case.
   *
   * ```
   * const x = Some(1);
   * assert.equal(x.expect("Is empty"), 1);
   *
   * const x: Option<number> = None;
   * const y = x.expect("Is empty"); // throws
   * ```
   */
  async expect(this: OptionAsync<T>, msg: string): Promise<T> {
    return this.then((opt) => opt.expect(msg));
  }

  /**
   * Returns the contained `Some` value and throws if `None`.
   *
   * To avoid throwing, consider `isSome`, `unwrapOr`, `unwrapOrElse` or
   * `match` to handle the `None` case. To throw a more informative error use
   * `expect`.
   *
   * ```
   * const x = Some(1);
   * assert.equal(x.unwrap(), 1);
   *
   * const x: Option<number> = None;
   * const y = x.unwrap(); // throws
   * ```
   */
  async unwrap(this: OptionAsync<T>): Promise<T> {
    return this.then((opt) => opt.unwrap());
  }

  /**
   * Returns the contained `Some` value or a provided default.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.unwrapOr(1), 10);
   *
   * const x: Option<number> = None;
   * assert.equal(x.unwrapOr(1), 1);
   * ```
   */
  async unwrapOr(this: OptionAsync<T>, def: T): Promise<T> {
    return this.then((opt) => opt.unwrapOr(def));
  }

  /**
   * Returns the contained `Some` value or computes it from a function.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
   *
   * const x: Option<number> = None;
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
   * ```
   */
  async unwrapOrElse(this: OptionAsync<T>, f: () => T): Promise<T> {
    return this.then((opt) => opt.unwrapOrElse(f));
  }

  /**
   * Returns the contained `Some` value or computes it from a function.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
   *
   * const x: Option<number> = None;
   * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
   * ```
   */
  async unwrapOrElseAsync(this: OptionAsync<T>, f: () => Promise<T>): Promise<T> {
    return this.then((opt) => opt.unwrapOrElseAsync(f));
  }

  /**
   * Returns the contained `Some` value or undefined if `None`.
   *
   * Most problems are better solved using one of the other `unwrap_` methods.
   * This method should only be used when you are certain that you need it.
   *
   * ```
   * const x = Some(10);
   * assert.equal(x.unwrapUnchecked(), 10);
   *
   * const x: Option<number> = None;
   * assert.equal(x.unwrapUnchecked(), undefined);
   * ```
   */
  async unwrapUnchecked(this: OptionAsync<T>): Promise<T | undefined> {
    return this.then((opt) => opt.unwrapUnchecked());
  }

  /**
   * Returns the Option if it is `Some`, otherwise returns `optb`.
   *
   * `optb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElse`, which is lazily evaluated.
   *
   * ```
   * const x = Some(10);
   * const xor = x.or(Some(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x: Option<number> = None;
   * const xor = x.or(Some(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  or(this: OptionAsync<T>, optb: Option<T>): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.or(optb))
    );
  }

  /**
   * Returns the Option if it is `Some`, otherwise returns `optb`.
   *
   * `optb` is eagerly evaluated. If you are passing the result of a function
   * call, consider `orElse`, which is lazily evaluated.
   *
   * ```
   * const x = Some(10);
   * const xor = x.or(Some(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x: Option<number> = None;
   * const xor = x.or(Some(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  orAsync(this: OptionAsync<T>, optb: OptionAsync<T>): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.orAsync(optb))
    );
  }

  /**
   * Returns the Option if it is `Some`, otherwise returns the value of `f()`.
   *
   * ```
   * const x = Some(10);
   * const xor = x.orElse(() => Some(1));
   * assert.equal(xor.unwrap(), 10);
   *
   * const x: Option<number> = None;
   * const xor = x.orElse(() => Some(1));
   * assert.equal(xor.unwrap(), 1);
   * ```
   */
  orElse(this: OptionAsync<T>, f: () => Option<T>): OptionAsync<T> {
    return new OptionTypeAsync(
      this.then((opt) => opt.orElse(f))
    );
  }

  /**
   * Returns `None` if the Option is `None`, otherwise returns `optb`.
   *
   * ```
   * const x = Some(10);
   * const xand = x.and(Some(1));
   * assert.equal(xand.unwrap(), 1);
   *
   * const x: Option<number> = None;
   * const xand = x.and(Some(1));
   * assert.equal(xand.isNone(), true);
   *
   * const x = Some(10);
   * const xand = x.and(None);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  and<U>(this: OptionAsync<T>, optb: Option<U>): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.and(optb))
    );
  }

  /**
   * Returns `None` if the Option is `None`, otherwise returns `optb`.
   *
   * ```
   * const x = Some(10);
   * const xand = x.and(Some(1));
   * assert.equal(xand.unwrap(), 1);
   *
   * const x: Option<number> = None;
   * const xand = x.and(Some(1));
   * assert.equal(xand.isNone(), true);
   *
   * const x = Some(10);
   * const xand = x.and(None);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  andAsync<U>(this: OptionAsync<T>, optb: OptionAsync<U>): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.andAsync(optb))
    );
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * ```
   * const x = Some(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrap(), 11);
   *
   * const x: Option<number> = None;
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.isNone(), true);
   *
   * const x = Some(10);
   * const xand = x.andThen(() => None);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  andThen<U>(this: OptionAsync<T>, f: (val: T) => Option<U>): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.andThen(f))
    );
  }

  /**
   * Returns `None` if the option is `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * ```
   * const x = Some(10);
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.unwrap(), 11);
   *
   * const x: Option<number> = None;
   * const xand = x.andThen((n) => n + 1);
   * assert.equal(xand.isNone(), true);
   *
   * const x = Some(10);
   * const xand = x.andThen(() => None);
   * assert.equal(xand.isNone(), true);
   * ```
   */
  andThenAsync<U>(this: OptionAsync<T>, f: (val: T) => Promise<Option<U>>): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.andThenAsync(f))
    );
  }

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function to the `Some`
   * value.
   *
   * ```
   * const x = Some(10);
   * const xmap = x.map((n) => `number ${n}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  map<U>(this: OptionAsync<T>, f: (val: T) => U): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.map(f))
    );
  }

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function to the `Some`
   * value.
   *
   * ```
   * const x = Some(10);
   * const xmap = x.map((n) => `number ${n}`);
   * assert.equal(xmap.unwrap(), "number 10");
   * ```
   */
  mapAsync<U>(this: OptionAsync<T>, f: (val: T) => Promise<U>): OptionAsync<U> {
    return new OptionTypeAsync(
      this.then((opt) => opt.mapAsync(f))
    );
  }

  /**
   * Returns the provided default if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Some(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x: Option<number> = None;
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 1);
   * ```
   */
  async mapOr<U>(this: OptionAsync<T>, def: U, f: (val: T) => U): Promise<U> {
    return this.then((opt) => opt.mapOr(def, f));
  }

    /**
   * Returns the provided default if `None`, otherwise calls `f` with the
   * `Some` value and returns the result.
   *
   * The provided default is eagerly evaluated. If you are passing the result
   * of a function call, consider `mapOrElse`, which is lazily evaluated.
   *
   * ```
   * const x = Some(10);
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 11);
   *
   * const x: Option<number> = None;
   * const xmap = x.mapOr(1, (n) => n + 1);
   * assert.equal(xmap.unwrap(), 1);
   * ```
   */
  async mapAsyncOr<U>(this: OptionAsync<T>, def: U, f: (val: T) => Promise<U>): Promise<U> {
    return this.then((opt) => opt.mapAsyncOr(def, f));
  }
}
