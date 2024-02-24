import { T, Val, EmptyArray, FalseyValues, isTruthy, IterType, Prom } from "./common";
import { Err, Ok, Result } from "./result";
// import { Option, Some, None } from "./option";

export type OkAsync<T> = ResultTypeAsync<T, never>;
export type ErrAsync<E extends Error> = ResultTypeAsync<never, E>;
export type ResultAsync<T, E extends Error> = ResultTypeAsync<T, E>;

type From<T> = Exclude<T, Error | FalseyValues>;

type ResultTypes<R> = {
  [K in keyof R]: R[K] extends ResultAsync<infer T, any> ? T : never;
};

type ResultErrors<R> = {
  [K in keyof R]: R[K] extends ResultAsync<any, infer U> ? U : never;
};

// type FromPromise<P> = P extends Promise<infer A>
//   ? A extends Result<infer R, infer E>
//     ? ResultAsync<R, E | Error>
//     : ResultAsync<A, Error>
//   : never;

class ResultTypeAsync<T, E> {
  readonly [Prom]: Promise<T>;

  constructor(prom: Promise<T>) {
    this[Prom] = prom;
  }

  then<R1, R2>(
    onSuccess?: (res: Result<T, E>) => R1 | PromiseLike<R1>
  ): Promise<R1 | R2> {
    return this[Prom]
      .then(
        (val) => Ok(val),
        (reason) => 
      )
    .then(onSuccess, onError);
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
  into(this: ResultAsync<T, E>): Promise<T | undefined>;
  into<U extends FalseyValues>(this: ResultAsync<T, E>, err: U): Promise<T | U>;
  into(this: ResultAsync<T, E>, err?: FalseyValues): Promise<T | FalseyValues> {
    return this.then(
        (res) => res.isOk() ? res.unwrap() : err,
        () => err
      );
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
  intoTuple(this: ResultAsync<T, E>): Promise<[null, T] | [E | Error, null]> {
    return this.then(
      (res) => res.isOk() ? [null, res.unwrap()] : [res.unwrapErr(), null],
      (r) => [toError(r).unwrapErr(), null]
    );
  }
}

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
export function OkAsync<T>(val: T): OkAsync<T> {
  return new ResultTypeAsync<T, never>(Promise.resolve(Ok(val)));
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
export function ErrAsync<E>(val: E): ErrAsync<E> {
  return new ResultTypeAsync<never, E>(Promise.resolve(Err(val)));
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
  val: Promise<T>
): ResultAsync<
  From<T>,
  | (T extends Error ? T : never)
  | (Extract<FalseyValues, T> extends never ? never : null)
> {
  return new ResultTypeAsync(val);
}

function toError(err: unknown): ErrAsync<Error> {
  return err instanceof Error ? ErrAsync(err) : ErrAsync(new Error(String(err)));
}
