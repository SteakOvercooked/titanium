import { expect } from "chai";
import * as sinon from "sinon";
import { Result, Ok, Err } from "../../../src";

function AsRes<T>(val: unknown): Result<T, T> {
  return val as Result<T, T>;
}

export default function methods() {
  it("into", () => {
    expect(Ok(1).into()).to.equal(1);
    expect(Err(1).into()).to.equal(undefined);
    expect(Err(1).into(false)).to.equal(false);
    expect(Err(1).into(null)).to.equal(null);
  });

  it("intoTuple", () => {
    expect(Ok(1).intoTuple()).to.deep.equal([null, 1]);
    expect(Err(1).intoTuple()).to.deep.equal([1, null]);
  });

  it("isOk", () => {
    expect(Ok(1).isOk()).to.be.true;
    expect(Err(1).isOk()).to.be.false;
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
  });

  it("isErr", () => {
    expect(Ok(1).isErr()).to.be.false;
    expect(Err(1).isErr()).to.be.true;
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
  });

  it("filter", () => {
    const lessThan5 = (x: number) => x < 5;
    expect(Ok(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Ok(10).filter(lessThan5).isNone()).to.be.true;
    expect(Err(1).filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (x: number) => x < 5;
    expect(await Ok(1).filterAsync(lessThan5).unwrap()).to.equal(1);
    expect(await Ok(10).filterAsync(lessThan5).isNone()).to.be.true;
    expect(await Err(1).filterAsync(lessThan5).isNone()).to.be.true;
  });

  it("flatten", () => {
    expect(Ok(Ok(1)).flatten().unwrap()).to.equal(1);
    expect(Ok(Err(1)).flatten().unwrapErr()).to.equal(1);
    expect(Err(1).flatten().unwrapErr()).to.equal(1);
  });

  it("expect", () => {
    expect(Ok(1).expect("test")).to.equal(1);
    expect(() => Err(1).expect("test")).to.throw("test: 1");
  });

  it("expectErr", () => {
    expect(Err(1).expectErr("test")).to.equal(1);
    expect(() => Ok(1).expectErr("test")).to.throw("test: 1");
  });

  it("unwrap", () => {
    expect(Ok(1).unwrap()).to.equal(1);
    expect(() => Err(1).unwrap()).to.throw("1");
  });

  it("unwrapErr", () => {
    expect(Err(1).unwrapErr()).to.equal(1);
    expect(() => Ok(1).unwrapErr()).to.throw("1");
  });

  it("unwrapOr", () => {
    expect(Ok(1).unwrapOr(2)).to.equal(1);
    expect(AsRes(Err(1)).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrElse", () => {
    expect(Ok(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(AsRes(Err(1)).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapOrElseAsync", async () => {
    expect(await Ok(1).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(await AsRes(Err(1)).unwrapOrElseAsync(async () => 2)).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Ok(1).unwrapUnchecked()).to.equal(1);
    expect(Err(1).unwrapUnchecked()).to.equal(1);
  });

  it("or", () => {
    expect(Ok(1).or(Ok(2)).unwrap()).to.equal(1);
    expect(AsRes(Err(1)).or(Ok(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    const resb = Ok(2).mapAsync(async (val) => val * 2);
    expect(await Ok(1).orAsync(resb).unwrap()).to.equal(1);
    expect(await AsRes(Err(1)).orAsync(resb).unwrap()).to.equal(4);
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
        .unwrap()
    ).to.equal(1);
    expect(
      await Err(2)
        .orElseAsync(async (e) => Err(`err ${e}`))
        .unwrapErr()
    ).to.equal("err 2");
  });

  it("and", () => {
    expect(AsRes(Ok(1)).and(Err(2)).isErr()).to.be.true;
    expect(Err(1).and(Ok(2)).isErr()).to.be.true;
    expect(Ok(1).and(Ok("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    const errb = Err(2).mapErrAsync(async (err) => err * 2);
    expect(await AsRes(Ok(1)).andAsync(errb).isErr()).to.be.true;
    const okb = Ok(2).mapAsync(async (val) => val * 2);
    expect(await Err(1).andAsync(okb).isErr()).to.be.true;
    expect(await Ok(1).andAsync(okb).unwrap()).to.equal(4);
  });

  it("andThen", () => {
    expect(
      AsRes(Ok(1))
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
      await AsRes(Ok(1))
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

  it("mapOr", () => {
    expect(Ok(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(Err(1).mapOr(3, (val) => val + 1)).to.equal(3);
  });

  it("mapAsyncOr", async () => {
    expect(await Ok(1).mapAsyncOr(3, async (val) => val + 1)).to.equal(2);
    expect(await Err(1).mapAsyncOr(3, async (val) => val + 1)).to.equal(3);
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

  it("mapAsyncOrElse", async () => {
    expect(
      await Ok(1).mapAsyncOrElse(
        () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapAsyncOrElse(
        (err) => err + 2,
        async (val) => val + 1
      )
    ).to.equal(3);
  });

  it("mapOrElseAsync", async () => {
    expect(
      await Ok(1).mapOrElseAsync(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapOrElseAsync(
        async (err) => err + 2,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("mapAsyncOrElseAsync", async () => {
    expect(
      await Ok(1).mapAsyncOrElseAsync(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Err(1).mapAsyncOrElseAsync(
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
    expect(fOk.called);
    expect(fErr.notCalled);
  });

  it("inspectErr", () => {
    const fOk = sinon.fake();
    const fErr = sinon.fake();
    Ok(1).inspectErr(fOk);
    Err(1).inspectErr(fErr);
    expect(fOk.notCalled);
    expect(fErr.called);
    expect(fErr.calledThrice);
  });
}
