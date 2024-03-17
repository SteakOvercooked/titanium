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
  it("into", async () => {
    expect(Ok(1).into()).to.equal(1);
    expect(Err(1).into()).to.equal(undefined);
    expect(Err(1).into(false)).to.equal(false);
    expect(Err(1).into(null)).to.equal(null);

    expect(await toAsync(Ok(1)).into()).to.equal(1);
    expect(await toAsync(Err(1)).into()).to.equal(undefined);
    expect(await toAsync(Err(1)).into(false)).to.equal(false);
    expect(await toAsync(Err(1)).into(null)).to.equal(null);
  });

  it("intoTuple", async () => {
    expect(Ok(1).intoTuple()).to.deep.equal([null, 1]);
    expect(Err(1).intoTuple()).to.deep.equal([1, null]);

    expect(await toAsync(Ok(1)).intoTuple()).to.deep.equal([null, 1]);
    expect(await toAsync(Err(1)).intoTuple()).to.deep.equal([1, null]);
  });

  it("isOk", async () => {
    expect(Ok(1).isOk()).to.be.true;
    expect(Err(1).isOk()).to.be.false;

    expect(await toAsync(Ok(1)).isOk()).to.be.true;
    expect(await toAsync(Err(1)).isOk()).to.be.false;
  });

  it("isOkAnd", async () => {
    expect(Ok(1).isOkAnd((val) => val === 1)).to.be.true;
    expect(Ok(1).isOkAnd((val) => val > 1)).to.be.false;
    expect(Err(1).isOkAnd((val) => val === 1)).to.be.false;

    expect(await Ok(1).isOkAnd(async (val) => val === 1)).to.be.true;
    expect(await Ok(1).isOkAnd(async (val) => val > 1)).to.be.false;
    expect(await Err(1).isOkAnd(async (val) => val === 1)).to.be.false;

    expect(await toAsync(Ok(1)).isOkAnd((val) => val === 1)).to.be.true;
    expect(await toAsync(Ok(1)).isOkAnd((val) => val > 1)).to.be.false;
    expect(await toAsync(Err(1)).isOkAnd((val) => val === 1)).to.be.false;
  });

  it("isErr", async () => {
    expect(Ok(1).isErr()).to.be.false;
    expect(Err(1).isErr()).to.be.true;

    expect(await toAsync(Ok(1)).isErr()).to.be.false;
    expect(await toAsync(Err(1)).isErr()).to.be.true;
  });

  it("isErrAnd", async () => {
    expect(Ok(1).isErrAnd((val) => val === 1)).to.be.false;
    expect(Err(1).isErrAnd((val) => val > 1)).to.be.false;
    expect(Err(1).isErrAnd((val) => val === 1)).to.be.true;

    expect(await Ok(1).isErrAnd(async (val) => val === 1)).to.be.false;
    expect(await Err(1).isErrAnd(async (val) => val > 1)).to.be.false;
    expect(await Err(1).isErrAnd(async (val) => val === 1)).to.be.true;

    expect(await toAsync(Ok(1)).isErrAnd((val) => val === 1)).to.be.false;
    expect(await toAsync(Err(1)).isErrAnd((val) => val > 1)).to.be.false;
    expect(await toAsync(Err(1)).isErrAnd((val) => val === 1)).to.be.true;
  });

  it("filter", async () => {
    const lessThan5 = (x: number) => x < 5;
    expect(Ok(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Ok(10).filter(lessThan5).isNone()).to.be.true;
    expect(Err(1).filter(lessThan5).isNone()).to.be.true;

    expect(await toAsync(Ok(1)).filter(lessThan5).unwrap()).to.equal(1);
    expect(await toAsync(Ok(10)).filter(lessThan5).isNone()).to.be.true;
    expect(await toAsync(Err(1)).filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (x: number) => x < 5;
    expect(await Ok(1).filterAsync(lessThan5).unwrap()).to.equal(1);
    expect(await Ok(10).filterAsync(lessThan5).isNone()).to.be.true;
    expect(await Err(1).filterAsync(lessThan5).isNone()).to.be.true;

    expect(await toAsync(Ok(1)).filterAsync(lessThan5).unwrap()).to.equal(1);
    expect(await toAsync(Ok(10)).filterAsync(lessThan5).isNone()).to.be.true;
    expect(await toAsync(Err(1)).filterAsync(lessThan5).isNone()).to.be.true;
  });

  it("flatten", () => {
    expect(Ok(Ok(1)).flatten().unwrap()).to.equal(1);
    expect(Ok(Err(1)).flatten().unwrapErr()).to.equal(1);
    expect(Err(1).flatten().unwrapErr()).to.equal(1);
  });

  it("expect", async () => {
    expect(Ok(1).expect("test")).to.equal(1);
    expect(() => Err(1).expect("test")).to.throw("test: 1");

    expect(await toAsync(Ok(1)).expect("test")).to.equal(1);
    await toAsync(Err(1))
      .expect("test")
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("test: 1");
      });
  });

  it("expectErr", async () => {
    expect(Err(1).expectErr("test")).to.equal(1);
    expect(() => Ok(1).expectErr("test")).to.throw("test: 1");

    expect(await toAsync(Err(1)).expectErr("test")).to.equal(1);
    await toAsync(Ok(1))
      .expectErr("test")
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("test: 1");
      });
  });

  it("unwrap", async () => {
    expect(Ok(1).unwrap()).to.equal(1);
    expect(() => Err(1).unwrap()).to.throw("1");

    expect(await toAsync(Ok(1)).unwrap()).to.equal(1);
    await toAsync(Err(1))
      .unwrap()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapErr", async () => {
    expect(Err(1).unwrapErr()).to.equal(1);
    expect(() => Ok(1).unwrapErr()).to.throw("1");

    expect(await toAsync(Err(1)).unwrapErr()).to.equal(1);
    await toAsync(Ok(1))
      .unwrapErr()
      .catch((err) => {
        expect(err).instanceOf(Error);
        expect(err.message).to.equal("1");
      });
  });

  it("unwrapOr", async () => {
    expect(Ok(1).unwrapOr(2)).to.equal(1);
    expect(asRes(Err(1)).unwrapOr(2)).to.equal(2);

    expect(await toAsync(Ok(1)).unwrapOr(2)).to.equal(1);
    expect(await toAsync(asRes(Err(1))).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrElse", async () => {
    expect(Ok(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asRes(Err(1)).unwrapOrElse(() => 2)).to.equal(2);

    expect(await Ok(1).unwrapOrElse(async () => 2)).to.equal(1);
    expect(await asRes(Err(1)).unwrapOrElse(async () => 2)).to.equal(2);

    expect(await toAsync(Ok(1)).unwrapOrElse(() => 2)).to.equal(1);
    expect(await toAsync(asRes(Err(1))).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapUnchecked", async () => {
    expect(Ok(1).unwrapUnchecked()).to.equal(1);
    expect(Err(1).unwrapUnchecked()).to.equal(1);

    expect(await toAsync(Ok(1)).unwrapUnchecked()).to.equal(1);
    expect(await toAsync(Err(1)).unwrapUnchecked()).to.equal(1);
  });

  it("or", async () => {
    expect(Ok(1).or(Ok(2)).unwrap()).to.equal(1);
    expect(asRes(Err(1)).or(Ok(2)).unwrap()).to.equal(2);

    expect(await toAsync(Ok(1)).or(Ok(2)).unwrap()).to.equal(1);
    expect(
      await toAsync(asRes(Err(1)))
        .or(Ok(2))
        .unwrap()
    ).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Ok(1)
        .orAsync(toAsync(Ok(2)))
        .unwrap()
    ).to.equal(1);
    expect(
      await toAsync(asRes(Err(1)))
        .orAsync(toAsync(Ok(2)))
        .unwrap()
    ).to.equal(2);
  });

  it("orElse", async () => {
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

    expect(
      await toAsync(Ok(1))
        .orElse(() => Ok(2))
        .unwrap()
    ).to.equal(1);
    expect(
      await toAsync(Err(2))
        .orElse((e) => Err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");
  });

  it("orElseAsync", async () => {
    expect(
      await Ok(1)
        .orElseAsync(async () => Ok(2))
        .unwrap()
    ).to.equal(1);
    expect(
      await Err(2)
        .orElseAsync(async (e) => Err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");

    expect(
      await toAsync(Ok(1))
        .orElseAsync(async () => Ok(2))
        .unwrap()
    ).to.equal(1);
    expect(
      await toAsync(Err(2))
        .orElseAsync(async (e) => Err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");
  });

  it("and", async () => {
    expect(asRes(Ok(1)).and(Err(2)).isErr()).to.be.true;
    expect(Err(1).and(Ok(2)).isErr()).to.be.true;
    expect(Ok(1).and(Ok("two")).unwrap()).to.equal("two");

    expect(
      await toAsync(asRes(Ok(1)))
        .and(Err(2))
        .isErr()
    ).to.be.true;
    expect(await toAsync(Err(1)).and(Ok(2)).isErr()).to.be.true;
    expect(await toAsync(Ok(1)).and(Ok("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(
      await asRes(Ok(1))
        .andAsync(toAsync(Err(2)))
        .isErr()
    ).to.be.true;
    expect(
      await Err(1)
        .andAsync(toAsync(Ok(2)))
        .isErr()
    ).to.be.true;
    expect(
      await Ok(1)
        .andAsync(toAsync(Ok(2)))
        .unwrap()
    ).to.equal(2);

    expect(
      await toAsync(asRes(Ok(1)))
        .andAsync(toAsync(Err(2)))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Err(1))
        .andAsync(toAsync(Ok(2)))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Ok(1))
        .andAsync(toAsync(Ok(2)))
        .unwrap()
    ).to.equal(2);
  });

  it("andThen", async () => {
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

    expect(
      await toAsync(asRes(Ok(1)))
        .andThen(() => Err(1))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Err(1))
        .andThen(() => Ok(2))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Ok(1))
        .andThen((val) => Ok(`num ${val + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("andThenAsync", async () => {
    expect(
      await asRes(Ok(1))
        .andThenAsync(async () => Err(1))
        .isErr()
    ).to.be.true;
    expect(
      await Err(1)
        .andThenAsync(async () => Ok(2))
        .isErr()
    ).to.be.true;
    expect(
      await Ok(1)
        .andThenAsync(async (val) => Ok(`num ${val + 1}`))
        .unwrap()
    ).to.equal("num 2");

    expect(
      await toAsync(asRes(Ok(1)))
        .andThenAsync(async () => Err(1))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Err(1))
        .andThenAsync(async () => Ok(2))
        .isErr()
    ).to.be.true;
    expect(
      await toAsync(Ok(1))
        .andThenAsync(async (val) => Ok(`num ${val + 1}`))
        .unwrap()
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
        .unwrap()
    ).to.equal(2);
    expect(
      await Err(1)
        .mapAsync(async (val) => val + 1)
        .unwrapErr()
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
        .unwrapErr()
    ).to.equal(2);
    expect(
      await Ok(1)
        .mapErrAsync(async (val) => val + 1)
        .unwrap()
    ).to.equal(1);
  });

  it("mapOr", async () => {
    expect(Ok(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(Err(1).mapOr(3, (val) => val + 1)).to.equal(3);

    expect(await Ok(1).mapOr(3, async (val) => val + 1)).to.equal(2);
    expect(await Err(1).mapOr(3, async (val) => val + 1)).to.equal(3);
  });

  it("mapOrElse", async () => {
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

    expect(
      await Ok(1).mapOrElse(
        () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapOrElse(
        (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await Ok(1).mapOrElse(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapOrElse(
        async (err) => err + 2,
        (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await Ok(1).mapOrElse(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapOrElse(
        async (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);
  });

  it("ok", () => {
    expect(Ok(1).ok().isSome()).to.be.true;
    expect(Ok(1).ok().unwrap()).to.equal(1);
    expect(Err(1).ok().isNone()).to.be.true;
    expect(() => Err(1).ok().unwrap()).to.throw("expected Some, got None");
  });

  it("inspect", () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();
    Ok(1).inspect(fOk);
    Err(1).inspect(fErr);
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
}
