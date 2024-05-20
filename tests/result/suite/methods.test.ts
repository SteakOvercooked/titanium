import { expect } from "chai";
import * as sinon from "sinon";

import { Result, ResultAsync, Ok, Err } from "../../../src";

function asRes<T>(val: unknown): Result<T, T> {
  return val as Result<T, T>;
}

function toAsync<T, E>(res: Result<T, E>): ResultAsync<T, E> {
  return res.mapAsync(async (val) => val);
}

export default function methods() {
  it("into", () => {
    expect(Ok(1).into()).to.equal(1);
    expect(Err(1).into()).to.equal(undefined);
    expect(Err(1).into(false)).to.equal(false);
    expect(Err(1).into(null)).to.equal(null);
  });

  it("intoAsync", async () => {
    expect(await toAsync(Ok(1)).intoAsync()).to.equal(1);
    expect(await toAsync(Err(1)).intoAsync()).to.equal(undefined);
    expect(await toAsync(Err(1)).intoAsync(false)).to.equal(false);
    expect(await toAsync(Err(1)).intoAsync(null)).to.equal(null);
  });

  it("intoTuple", () => {
    expect(Ok(1).intoTuple()).to.deep.equal([null, 1]);
    expect(Err(1).intoTuple()).to.deep.equal([1, null]);
  });

  it("intoTupleAsync", async () => {
    expect(await toAsync(Ok(1)).intoTupleAsync()).to.deep.equal([null, 1]);
    expect(await toAsync(Err(1)).intoTupleAsync()).to.deep.equal([1, null]);
  });

  it("isOk", () => {
    expect(Ok(1).isOk()).to.be.true;
    expect(Err(1).isOk()).to.be.false;
  });

  it("isOkAsync", async () => {
    expect(await toAsync(Ok(1)).isOkAsync()).to.be.true;
    expect(await toAsync(Err(1)).isOkAsync()).to.be.false;
  });

  it("isOkAnd", () => {
    expect(Ok(1).isOkAnd((val) => val === 1)).to.be.true;
    expect(Ok(1).isOkAnd((val) => val > 1)).to.be.false;
    expect(Err(1).isOkAnd((val) => val === 1)).to.be.false;
  });

  it("isOkAndAsync", async () => {
    expect(await Ok(1).isOkAndAsync(async (val) => val === 1)).to.be.true;
    expect(await Ok(1).isOkAndAsync(async (val) => val > 1)).to.be.false;
    expect(await Err(1).isOkAndAsync(async (val) => val === 1)).to.be.false;

    expect(await toAsync(Ok(1)).isOkAndAsync((val) => val === 1)).to.be.true;
    expect(await toAsync(Ok(1)).isOkAndAsync((val) => val > 1)).to.be.false;
    expect(await toAsync(Err(1)).isOkAndAsync((val) => val === 1)).to.be.false;
  });

  it("isErr", () => {
    expect(Ok(1).isErr()).to.be.false;
    expect(Err(1).isErr()).to.be.true;
  });

  it("isErrAsync", async () => {
    expect(await toAsync(Ok(1)).isErrAsync()).to.be.false;
    expect(await toAsync(Err(1)).isErrAsync()).to.be.true;
  });

  it("isErrAnd", () => {
    expect(Ok(1).isErrAnd((val) => val === 1)).to.be.false;
    expect(Err(1).isErrAnd((val) => val > 1)).to.be.false;
    expect(Err(1).isErrAnd((val) => val === 1)).to.be.true;
  });

  it("isErrAndAsync", async () => {
    expect(await Ok(1).isErrAndAsync(async (val) => val === 1)).to.be.false;
    expect(await Err(1).isErrAndAsync(async (val) => val > 1)).to.be.false;
    expect(await Err(1).isErrAndAsync(async (val) => val === 1)).to.be.true;

    expect(await toAsync(Ok(1)).isErrAndAsync((val) => val === 1)).to.be.false;
    expect(await toAsync(Err(1)).isErrAndAsync((val) => val > 1)).to.be.false;
    expect(await toAsync(Err(1)).isErrAndAsync((val) => val === 1)).to.be.true;
  });

  it("filter", () => {
    const lessThan5 = (x: number) => x < 5;
    expect(Ok(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Ok(10).filter(lessThan5).isNone()).to.be.true;
    expect(Err(1).filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (x: number) => x < 5;
    expect(await Ok(1).filterAsync(lessThan5).unwrapAsync()).to.equal(1);
    expect(await Ok(10).filterAsync(lessThan5).isNoneAsync()).to.be.true;
    expect(await Err(1).filterAsync(lessThan5).isNoneAsync()).to.be.true;

    expect(await toAsync(Ok(1)).filterAsync(lessThan5).unwrapAsync()).to.equal(
      1
    );
    expect(await toAsync(Ok(10)).filterAsync(lessThan5).isNoneAsync()).to.be
      .true;
    expect(await toAsync(Err(1)).filterAsync(lessThan5).isNoneAsync()).to.be
      .true;
  });

  it("flatten", () => {
    expect(Ok(Ok(1)).flatten().unwrap()).to.equal(1);
    expect(Ok(Err(1)).flatten().unwrapErr()).to.equal(1);
    expect(Err(1).flatten().unwrapErr()).to.equal(1);
  });

  it("flattenAsync", async () => {
    expect(
      await Ok(toAsync(Ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await Ok(toAsync(Err(1)))
        .flattenAsync()
        .unwrapErrAsync()
    ).to.equal(1);
    expect(await Err(1).flattenAsync().unwrapErrAsync()).to.equal(1);

    expect(
      await toAsync(Ok(Ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(Ok(Err(1)))
        .flattenAsync()
        .unwrapErrAsync()
    ).to.equal(1);
    expect(
      await toAsync(Ok(Ok(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
  });

  it("expect", () => {
    expect(Ok(1).expect(() => "test")).to.equal(1);
    expect(() => Err(1).expect((err) => `test, got ${err}`)).to.throw(
      "test, got 1"
    );
  });

  it("expectAsync", async () => {
    expect(await toAsync(Ok(1)).expectAsync(() => "test")).to.equal(1);
    await toAsync(Err(1))
      .expectAsync((err) => `${err}: test`)
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1: test");
      });
  });

  it("expectErr", () => {
    expect(Err(1).expectErr(() => "test")).to.equal(1);
    expect(() => Ok(1).expectErr(() => "test")).to.throw("test");
  });

  it("expectErrAsync", async () => {
    expect(await toAsync(Err(1)).expectErrAsync(() => "test")).to.equal(1);
    await toAsync(Ok(1))
      .expectErrAsync((val) => `${val}: test`)
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1: test");
      });
  });

  it("unwrap", () => {
    expect(Ok(1).unwrap()).to.equal(1);
    expect(() => Err(1).unwrap()).to.throw("1");
  });

  it("unwrapAsync", async () => {
    expect(await toAsync(Ok(1)).unwrapAsync()).to.equal(1);
    await toAsync(Err(1))
      .unwrapAsync()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapErr", () => {
    expect(Err(1).unwrapErr()).to.equal(1);
    expect(() => Ok(1).unwrapErr()).to.throw("1");
  });

  it("unwrapErrAsync", async () => {
    expect(await toAsync(Err(1)).unwrapErrAsync()).to.equal(1);
    await toAsync(Ok(1))
      .unwrapErrAsync()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapOr", () => {
    expect(Ok(1).unwrapOr(2)).to.equal(1);
    expect(asRes(Err(1)).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrAsync", async () => {
    expect(await toAsync(Ok(1)).unwrapOrAsync(2)).to.equal(1);
    expect(await toAsync(asRes(Err(1))).unwrapOrAsync(2)).to.equal(2);
  });

  it("unwrapOrElse", () => {
    expect(Ok(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asRes(Err(1)).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapOrElseAsync", async () => {
    expect(await Ok(1).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(await asRes(Err(1)).unwrapOrElseAsync(async () => 2)).to.equal(2);

    expect(await toAsync(Ok(1)).unwrapOrElseAsync(() => 2)).to.equal(1);
    expect(await toAsync(asRes(Err(1))).unwrapOrElseAsync(() => 2)).to.equal(2);

    expect(await toAsync(Ok(1)).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(await toAsync(asRes(Err(1))).unwrapOrElseAsync(() => 2)).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Ok(1).unwrapUnchecked()).to.equal(1);
    expect(Err(1).unwrapUnchecked()).to.equal(1);
  });

  it("unwrapUncheckedAsync", async () => {
    expect(await toAsync(Ok(1)).unwrapUncheckedAsync()).to.equal(1);
    expect(await toAsync(Err(1)).unwrapUncheckedAsync()).to.equal(1);
  });

  it("or", () => {
    expect(Ok(1).or(Ok(2)).unwrap()).to.equal(1);
    expect(asRes(Err(1)).or(Ok(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Ok(1)
        .orAsync(toAsync(Ok(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asRes(Err(1))
        .orAsync(toAsync(Ok(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Ok(1))
        .orAsync(toAsync(Ok(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(asRes(Err(1)))
        .orAsync(Ok(2))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("orElse", () => {
    expect(
      Ok(1)
        .orElse(() => Ok(2))
        .unwrap()
    ).to.equal(1);
    expect(
      Err(2)
        .orElse((e) => Err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");
  });

  it("orElseAsync", async () => {
    expect(
      await Ok(1)
        .orElseAsync(async () => Ok(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await Err(2)
        .orElseAsync(async (e) => Err(`err ${e}`))
        .unwrapErrAsync()
    ).to.equal("err 2");

    expect(
      await toAsync(Ok(1))
        .orElseAsync(() => Ok(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(Err(2))
        .orElseAsync(async (e) => Err(`err ${e}`))
        .unwrapErrAsync()
    ).to.equal("err 2");
  });

  it("and", () => {
    expect(asRes(Ok(1)).and(Err(2)).isErr()).to.be.true;
    expect(Err(1).and(Ok(2)).isErr()).to.be.true;
    expect(Ok(1).and(Ok("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(
      await asRes(Ok(1))
        .andAsync(toAsync(Err(2)))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Err(1)
        .andAsync(toAsync(Ok(2)))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Ok(1)
        .andAsync(toAsync(Ok(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(asRes(Ok(1)))
        .andAsync(toAsync(Err(2)))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Err(1))
        .andAsync(Ok(2))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Ok(1))
        .andAsync(toAsync(Ok(2)))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("andThen", () => {
    expect(
      asRes(Ok(1))
        .andThen(() => Err(1))
        .isErr()
    ).to.be.true;
    expect(
      Err(1)
        .andThen(() => Ok(2))
        .isErr()
    ).to.be.true;
    expect(
      Ok(1)
        .andThen((val) => Ok(`num ${val + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("andThenAsync", async () => {
    expect(
      await asRes(Ok(1))
        .andThenAsync(async () => Err(1))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Err(1)
        .andThenAsync(async () => Ok(2))
        .isErrAsync()
    ).to.be.true;
    expect(
      await Ok(1)
        .andThenAsync(async (val) => Ok(`num ${val + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");

    expect(
      await toAsync(asRes(Ok(1)))
        .andThenAsync(async () => Err(1))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Err(1))
        .andThenAsync(async () => Ok(2))
        .isErrAsync()
    ).to.be.true;
    expect(
      await toAsync(Ok(1))
        .andThenAsync(async (val) => Ok(`num ${val + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");
  });

  it("map", () => {
    expect(
      Ok(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.equal(2);
    expect(() =>
      Err(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.throw("1");
  });

  it("mapAsync", async () => {
    expect(
      await Ok(1)
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await Err(1)
        .mapAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(1);

    expect(
      await toAsync(Ok(1))
        .mapAsync((val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await toAsync(Err(1))
        .mapAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(1);
  });

  it("mapErr", () => {
    expect(
      Err(1)
        .mapErr((val) => val + 1)
        .unwrapErr()
    ).to.equal(2);
    expect(() =>
      Ok(1)
        .mapErr((val) => val + 1)
        .unwrapErr()
    ).to.throw("1");
  });

  it("mapErrAsync", async () => {
    expect(
      await Err(1)
        .mapErrAsync(async (val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(2);
    expect(
      await Ok(1)
        .mapErrAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(1);

    expect(
      await toAsync(Err(1))
        .mapErrAsync((val) => val + 1)
        .unwrapErrAsync()
    ).to.equal(2);
    expect(
      await toAsync(Ok(1))
        .mapErrAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(1);
  });

  it("mapOr", () => {
    expect(Ok(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(Err(1).mapOr(3, (val) => val + 1)).to.equal(3);
  });

  it("mapOrAsync", async () => {
    expect(await Ok(1).mapOrAsync(3, async (val) => val + 1)).to.equal(2);
    expect(await Err(1).mapOrAsync(3, async (val) => val + 1)).to.equal(3);

    expect(await toAsync(Ok(1)).mapOrAsync(3, (val) => val + 1)).to.equal(2);
    expect(
      await toAsync(Err(1)).mapOrAsync(3, async (val) => val + 1)
    ).to.equal(3);
  });

  it("mapOrElse", () => {
    expect(
      Ok(1).mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      Err(1).mapOrElse(
        (err) => err + 2,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("mapOrElseAsync", async () => {
    expect(
      await Ok(1).mapOrElseAsync(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapOrElseAsync(
        async (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await toAsync(Ok(1)).mapOrElseAsync(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await toAsync(Err(1)).mapOrElseAsync(
        (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);
  });

  it("ok", () => {
    const some = Ok(1).ok();
    expect(some.isSome()).to.be.true;
    expect(some.unwrap()).to.equal(1);
    const none = Err(1).ok();
    expect(none.isNone()).to.be.true;
    expect(() => none.unwrap()).to.throw("expected Some, got None");
  });

  it("okAsync", async () => {
    const asyncSome = toAsync(Ok(1)).okAsync();
    expect(await asyncSome.isSomeAsync()).to.be.true;
    expect(await asyncSome.unwrapAsync()).to.equal(1);
    const asyncNone = toAsync(Err(1)).okAsync();
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

    Ok(1).inspect(fOk);
    Err(1).inspect(fErr);
    expect(fOk.called).to.be.true;
    expect(fErr.called).to.be.false;
  });

  it("inspectAsync", async () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    await toAsync(Ok(1)).inspectAsync(fOk);
    await toAsync(Err(1)).inspectAsync(fErr);
    expect(fOk.called).to.be.true;
    expect(fErr.called).to.be.false;
  });

  it("inspectErr", () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    Ok(1).inspectErr(fOk);
    Err(1).inspectErr(fErr);
    expect(fOk.called).to.be.false;
    expect(fErr.called).to.be.true;
  });

  it("inspectErrAsync", async () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();

    await toAsync(Ok(1)).inspectErrAsync(fOk);
    await toAsync(Err(1)).inspectErrAsync(fErr);
    expect(fOk.called).to.be.false;
    expect(fErr.called).to.be.true;
  });
}
