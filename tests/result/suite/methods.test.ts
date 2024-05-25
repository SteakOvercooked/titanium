import { expect } from "chai";
import * as sinon from "sinon";

import { Result, ResultAsync } from "../../../src";

function asRes<T>(val: unknown): Result<T, T> {
  return val as Result<T, T>;
}

function toAsync<T, E>(res: Result<T, E>): ResultAsync<T, E> {
  return res.mapAsync(async (val) => val);
}

export default function methods() {
  it("into", () => {
    expect(Result.ok(1).into()).to.equal(1);
    expect(Result.err(1).into()).to.equal(undefined);
    expect(Result.err(1).into(false)).to.equal(false);
    expect(Result.err(1).into(null)).to.equal(null);
  });

  it("intoAsync", async () => {
    expect(await toAsync(Result.ok(1)).intoAsync()).to.equal(1);
    expect(await toAsync(Result.err(1)).intoAsync()).to.equal(undefined);
    expect(await toAsync(Result.err(1)).intoAsync(false)).to.equal(false);
    expect(await toAsync(Result.err(1)).intoAsync(null)).to.equal(null);
  });

  it("intoTuple", () => {
    expect(Result.ok(1).intoTuple()).to.deep.equal([null, 1]);
    expect(Result.err(1).intoTuple()).to.deep.equal([1, null]);
  });

  it("intoTupleAsync", async () => {
    expect(await toAsync(Result.ok(1)).intoTupleAsync()).to.deep.equal([
      null,
      1,
    ]);
    expect(await toAsync(Result.err(1)).intoTupleAsync()).to.deep.equal([
      1,
      null,
    ]);
  });

  it("isOk", () => {
    expect(Result.ok(1).isOk()).to.be.true;
    expect(Result.err(1).isOk()).to.be.false;
  });

  it("isOkAsync", async () => {
    expect(await toAsync(Result.ok(1)).isOkAsync()).to.be.true;
    expect(await toAsync(Result.err(1)).isOkAsync()).to.be.false;
  });

  it("isOkAnd", () => {
    expect(Result.ok(1).isOkAnd((val) => val === 1)).to.be.true;
    expect(Result.ok(1).isOkAnd((val) => val > 1)).to.be.false;
    expect(Result.err(1).isOkAnd((val) => val === 1)).to.be.false;
  });

  it("isOkAndAsync", async () => {
    expect(await Result.ok(1).isOkAndAsync(async (val) => val === 1)).to.be
      .true;
    expect(await Result.ok(1).isOkAndAsync(async (val) => val > 1)).to.be.false;
    expect(await Result.err(1).isOkAndAsync(async (val) => val === 1)).to.be
      .false;

    expect(await toAsync(Result.ok(1)).isOkAndAsync((val) => val === 1)).to.be
      .true;
    expect(await toAsync(Result.ok(1)).isOkAndAsync((val) => val > 1)).to.be
      .false;
    expect(await toAsync(Result.err(1)).isOkAndAsync((val) => val === 1)).to.be
      .false;
  });

  it("isErr", () => {
    expect(Result.ok(1).isErr()).to.be.false;
    expect(Result.err(1).isErr()).to.be.true;
  });

  it("isErrAsync", async () => {
    expect(await toAsync(Result.ok(1)).isErrAsync()).to.be.false;
    expect(await toAsync(Result.err(1)).isErrAsync()).to.be.true;
  });

  it("isErrAnd", () => {
    expect(Result.ok(1).isErrAnd((val) => val === 1)).to.be.false;
    expect(Result.err(1).isErrAnd((val) => val > 1)).to.be.false;
    expect(Result.err(1).isErrAnd((val) => val === 1)).to.be.true;
  });

  it("isErrAndAsync", async () => {
    expect(await Result.ok(1).isErrAndAsync(async (val) => val === 1)).to.be
      .false;
    expect(await Result.err(1).isErrAndAsync(async (val) => val > 1)).to.be
      .false;
    expect(await Result.err(1).isErrAndAsync(async (val) => val === 1)).to.be
      .true;

    expect(await toAsync(Result.ok(1)).isErrAndAsync((val) => val === 1)).to.be
      .false;
    expect(await toAsync(Result.err(1)).isErrAndAsync((val) => val > 1)).to.be
      .false;
    expect(await toAsync(Result.err(1)).isErrAndAsync((val) => val === 1)).to.be
      .true;
  });

  it("filter", () => {
    const lessThan5 = (x: number) => x < 5;
    expect(Result.ok(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Result.ok(10).filter(lessThan5).isNone()).to.be.true;
    expect(Result.err(1).filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (x: number) => x < 5;
    expect(await Result.ok(1).filterAsync(lessThan5).unwrapAsync()).to.equal(1);
    expect(await Result.ok(10).filterAsync(lessThan5).isNoneAsync()).to.be.true;
    expect(await Result.err(1).filterAsync(lessThan5).isNoneAsync()).to.be.true;

    expect(
      await toAsync(Result.ok(1)).filterAsync(lessThan5).unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Result.ok(10)).filterAsync(lessThan5).isNoneAsync()).to
      .be.true;
    expect(await toAsync(Result.err(1)).filterAsync(lessThan5).isNoneAsync()).to
      .be.true;
  });

  it("flatten", () => {
    expect(Result.ok(Result.ok(1)).flatten().unwrap()).to.equal(1);
    expect(Result.ok(Result.err(1)).flatten().unwrapErr()).to.equal(1);
    expect(Result.err(1).flatten().unwrapErr()).to.equal(1);
  });

  it("flattenAsync", async () => {
    expect(
      await Result.ok(toAsync(Result.ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await Result.ok(toAsync(Result.err(1)))
        .flattenAsync()
        .unwrapErrAsync()
    ).to.equal(1);
    expect(await Result.err(1).flattenAsync().unwrapErrAsync()).to.equal(1);

    expect(
      await toAsync(Result.ok(Result.ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(Result.ok(Result.err(1)))
        .flattenAsync()
        .unwrapErrAsync()
    ).to.equal(1);
    expect(
      await toAsync(Result.ok(Result.ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
  });

  it("expect", () => {
    expect(Result.ok(1).expect(() => "test")).to.equal(1);
    expect(() => Result.err(1).expect((err) => `test, got ${err}`)).to.throw(
      "test, got 1"
    );
  });

  it("expectAsync", async () => {
    expect(await toAsync(Result.ok(1)).expectAsync(() => "test")).to.equal(1);
    await toAsync(Result.err(1))
      .expectAsync((err) => `${err}: test`)
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1: test");
      });
  });

  it("expectErr", () => {
    expect(Result.err(1).expectErr(() => "test")).to.equal(1);
    expect(() => Result.ok(1).expectErr(() => "test")).to.throw("test");
  });

  it("expectErrAsync", async () => {
    expect(await toAsync(Result.err(1)).expectErrAsync(() => "test")).to.equal(
      1
    );
    await toAsync(Result.ok(1))
      .expectErrAsync((val) => `${val}: test`)
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1: test");
      });
  });

  it("unwrap", () => {
    expect(Result.ok(1).unwrap()).to.equal(1);
    expect(() => Result.err(1).unwrap()).to.throw("1");
  });

  it("unwrapAsync", async () => {
    expect(await toAsync(Result.ok(1)).unwrapAsync()).to.equal(1);
    await toAsync(Result.err(1))
      .unwrapAsync()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapErr", () => {
    expect(Result.err(1).unwrapErr()).to.equal(1);
    expect(() => Result.ok(1).unwrapErr()).to.throw("1");
  });

  it("unwrapErrAsync", async () => {
    expect(await toAsync(Result.err(1)).unwrapErrAsync()).to.equal(1);
    await toAsync(Result.ok(1))
      .unwrapErrAsync()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapOr", () => {
    expect(Result.ok(1).unwrapOr(2)).to.equal(1);
    expect(asRes(Result.err(1)).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrAsync", async () => {
    expect(await toAsync(Result.ok(1)).unwrapOrAsync(2)).to.equal(1);
    expect(await toAsync(asRes(Result.err(1))).unwrapOrAsync(2)).to.equal(2);
  });

  it("unwrapOrElse", () => {
    expect(Result.ok(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asRes(Result.err(1)).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapOrElseAsync", async () => {
    expect(await Result.ok(1).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(
      await asRes(Result.err(1)).unwrapOrElseAsync(async () => 2)
    ).to.equal(2);

    expect(await toAsync(Result.ok(1)).unwrapOrElseAsync(() => 2)).to.equal(1);
    expect(
      await toAsync(asRes(Result.err(1))).unwrapOrElseAsync(() => 2)
    ).to.equal(2);

    expect(
      await toAsync(Result.ok(1)).unwrapOrElseAsync(async () => 2)
    ).to.equal(1);
    expect(
      await toAsync(asRes(Result.err(1))).unwrapOrElseAsync(() => 2)
    ).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Result.ok(1).unwrapUnchecked()).to.equal(1);
    expect(Result.err(1).unwrapUnchecked()).to.equal(1);
  });

  it("unwrapUncheckedAsync", async () => {
    expect(await toAsync(Result.ok(1)).unwrapUncheckedAsync()).to.equal(1);
    expect(await toAsync(Result.err(1)).unwrapUncheckedAsync()).to.equal(1);
  });

  it("or", () => {
    expect(Result.ok(1).or(Result.ok(2)).unwrap()).to.equal(1);
    expect(asRes(Result.err(1)).or(Result.ok(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Result.ok(1)
        .orAsync(toAsync(Result.ok(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asRes(Result.err(1))
        .orAsync(toAsync(Result.ok(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Result.ok(1))
        .orAsync(toAsync(Result.ok(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(asRes(Result.err(1)))
        .orAsync(Result.ok(2))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("orElse", () => {
    expect(
      Result.ok(1)
        .orElse(() => Result.ok(2))
        .unwrap()
    ).to.equal(1);
    expect(
      Result.err(2)
        .orElse((e) => Result.err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");
  });

  it("orElseAsync", async () => {
    expect(
      await Result.ok(1)
        .orElseAsync(async () => Result.ok(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await Result.err(2)
        .orElseAsync(async (e) => Result.err(`err ${e}`))
        .unwrapErrAsync()
    ).to.equal("err 2");

    expect(
      await toAsync(Result.ok(1))
        .orElseAsync(() => Result.ok(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(Result.err(2))
        .orElseAsync(async (e) => Result.err(`err ${e}`))
        .unwrapErrAsync()
    ).to.equal("err 2");
  });

  it("and", () => {
    expect(asRes(Result.ok(1)).and(Result.err(2)).isErr()).to.be.true;
    expect(Result.err(1).and(Result.ok(2)).isErr()).to.be.true;
    expect(Result.ok(1).and(Result.ok("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(
      await asRes(Result.ok(1))
        .andAsync(toAsync(Result.err(2)))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Result.err(1)
        .andAsync(toAsync(Result.ok(2)))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Result.ok(1)
        .andAsync(toAsync(Result.ok(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(asRes(Result.ok(1)))
        .andAsync(toAsync(Result.err(2)))
        .isErrAsync()
    ).to.be.true;
    expect(await toAsync(Result.err(1)).andAsync(Result.ok(2)).isErrAsync()).to
      .be.true;
    expect(
      await toAsync(Result.ok(1))
        .andAsync(toAsync(Result.ok(2)))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("andThen", () => {
    expect(
      asRes(Result.ok(1))
        .andThen(() => Result.err(1))
        .isErr()
    ).to.be.true;
    expect(
      Result.err(1)
        .andThen(() => Result.ok(2))
        .isErr()
    ).to.be.true;
    expect(
      Result.ok(1)
        .andThen((val) => Result.ok(`num ${val + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("andThenAsync", async () => {
    expect(
      await asRes(Result.ok(1))
        .andThenAsync(async () => Result.err(1))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Result.err(1)
        .andThenAsync(async () => Result.ok(2))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Result.ok(1)
        .andThenAsync(async (val) => Result.ok(`num ${val + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");

    expect(
      await toAsync(asRes(Result.ok(1)))
        .andThenAsync(async () => Result.err(1))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Result.err(1))
        .andThenAsync(async () => Result.ok(2))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Result.ok(1))
        .andThenAsync(async (val) => Result.ok(`num ${val + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");
  });

  it("map", () => {
    expect(
      Result.ok(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.equal(2);
    expect(() =>
      Result.err(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.throw("1");
  });

  it("mapAsync", async () => {
    expect(
      await Result.ok(1)
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await Result.err(1)
        .mapAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(1);

    expect(
      await toAsync(Result.ok(1))
        .mapAsync((val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await toAsync(Result.err(1))
        .mapAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(1);
  });

  it("mapErr", () => {
    expect(
      Result.err(1)
        .mapErr((val) => val + 1)
        .unwrapErr()
    ).to.equal(2);
    expect(() =>
      Result.ok(1)
        .mapErr((val) => val + 1)
        .unwrapErr()
    ).to.throw("1");
  });

  it("mapErrAsync", async () => {
    expect(
      await Result.err(1)
        .mapErrAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(2);
    expect(
      await Result.ok(1)
        .mapErrAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(1);

    expect(
      await toAsync(Result.err(1))
        .mapErrAsync((val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(2);
    expect(
      await toAsync(Result.ok(1))
        .mapErrAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(1);
  });

  it("mapOr", () => {
    expect(Result.ok(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(Result.err(1).mapOr(3, (val) => val + 1)).to.equal(3);
  });

  it("mapOrAsync", async () => {
    expect(await Result.ok(1).mapOrAsync(3, async (val) => val + 1)).to.equal(
      2
    );
    expect(await Result.err(1).mapOrAsync(3, async (val) => val + 1)).to.equal(
      3
    );

    expect(
      await toAsync(Result.ok(1)).mapOrAsync(3, (val) => val + 1)
    ).to.equal(2);
    expect(
      await toAsync(Result.err(1)).mapOrAsync(3, async (val) => val + 1)
    ).to.equal(3);
  });

  it("mapOrElse", () => {
    expect(
      Result.ok(1).mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      Result.err(1).mapOrElse(
        (err) => err + 2,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("mapOrElseAsync", async () => {
    expect(
      await Result.ok(1).mapOrElseAsync(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Result.err(1).mapOrElseAsync(
        async (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await toAsync(Result.ok(1)).mapOrElseAsync(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await toAsync(Result.err(1)).mapOrElseAsync(
        (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);
  });

  it("ok", () => {
    const some = Result.ok(1).ok();
    expect(some.isSome()).to.be.true;
    expect(some.unwrap()).to.equal(1);
    const none = Result.err(1).ok();
    expect(none.isNone()).to.be.true;
    expect(() => none.unwrap()).to.throw("expected Some, got None");
  });

  it("okAsync", async () => {
    const asyncSome = toAsync(Result.ok(1)).okAsync();
    expect(await asyncSome.isSomeAsync()).to.be.true;
    expect(await asyncSome.unwrapAsync()).to.equal(1);
    const asyncNone = toAsync(Result.err(1)).okAsync();
    expect(await asyncNone.isNoneAsync()).to.be.true;
    expect(
      await asyncNone.unwrapAsync().catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("expected Some, got None");
      })
    );
  });

  it("inspect", () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    Result.ok(1).inspect(fOk);
    Result.err(1).inspect(fErr);
    expect(fOk.called).to.be.true;
    expect(fErr.called).to.be.false;
  });

  it("inspectAsync", async () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    await toAsync(Result.ok(1)).inspectAsync(fOk);
    await toAsync(Result.err(1)).inspectAsync(fErr);
    expect(fOk.called).to.be.true;
    expect(fErr.called).to.be.false;
  });

  it("inspectErr", () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    Result.ok(1).inspectErr(fOk);
    Result.err(1).inspectErr(fErr);
    expect(fOk.called).to.be.false;
    expect(fErr.called).to.be.true;
  });

  it("inspectErrAsync", async () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    await toAsync(Result.ok(1)).inspectErrAsync(fOk);
    await toAsync(Result.err(1)).inspectErrAsync(fErr);
    expect(fOk.called).to.be.false;
    expect(fErr.called).to.be.true;
  });
}
