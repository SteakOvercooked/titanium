import { expect } from "chai";
import * as sinon from "sinon";

import { Option, OptionAsync, Some, None } from "../../../src";

function asOpt(opt: Option<any>): Option<number> {
  return opt;
}

function toAsync<T>(opt: Option<T>): OptionAsync<T> {
  return opt.mapAsync(async (val) => val);
}

export default function methods() {
  it("into", () => {
    expect(Some(1).into()).to.equal(1);
    expect(None.into()).to.equal(undefined);
    expect(None.into(false)).to.equal(false);
    expect(None.into(null)).to.equal(null);
  });

  it("isSome", () => {
    expect(Some(1).isSome()).to.be.true;
    expect(None.isSome()).to.be.false;
  });

  it("isSomeAnd", async () => {
    expect(Some(1).isSomeAnd((val) => val === 1)).to.be.true;
    expect(Some(1).isSomeAnd((val) => val > 1)).to.be.false;
    expect(None.isSomeAnd((val) => val === 1)).to.be.false;

    expect(await Some(1).isSomeAnd(async (val) => val === 1)).to.be.true;
    expect(await Some(1).isSomeAnd(async (val) => val > 1)).to.be.false;
    expect(await None.isSomeAnd(async (val) => val === 1)).to.be.false;
  });

  it("isNone", () => {
    expect(Some(1).isNone()).to.be.false;
    expect(None.isNone()).to.be.true;
  });

  it("filter", () => {
    const lessThan5 = (val: number) => val < 5;
    expect(Some(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Some(10).filter(lessThan5).isNone()).to.be.true;
    expect(None.filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (val: number) => val < 5;
    expect(await Some(1).filterAsync(lessThan5).unwrap()).to.equal(1);
    expect(await Some(10).filterAsync(lessThan5).isNone()).to.be.true;
    expect(await None.filterAsync(lessThan5).isNone()).to.be.true;
  });

  it("flatten", () => {
    expect(Some(Some(1)).flatten().unwrap()).to.equal(1);
    expect(Some(None).flatten().isNone()).to.be.true;
    expect(None.flatten().isNone()).to.be.true;
  });

  it("expect", () => {
    expect(Some(1).expect("test")).to.equal(1);
    expect(() => None.expect("test")).to.throw("test");
  });

  it("unwrap", () => {
    expect(Some(1).unwrap()).to.equal(1);
    expect(() => None.unwrap()).to.throw("expected Some, got None");
  });

  it("unwrapOr", () => {
    expect(Some(1).unwrapOr(2)).to.equal(1);
    expect(asOpt(None).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrElse", async () => {
    expect(Some(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asOpt(None).unwrapOrElse(() => 2)).to.equal(2);

    expect(await Some(1).unwrapOrElse(async () => 2)).to.equal(1);
    expect(await asOpt(None).unwrapOrElse(async () => 2)).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Some(1).unwrapUnchecked()).to.equal(1);
    expect(None.unwrapUnchecked()).to.be.undefined;
  });

  it("or", () => {
    expect(Some(1).or(Some(2)).unwrap()).to.equal(1);
    expect(asOpt(None).or(Some(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Some(1)
        .orAsync(toAsync(Some(2)))
        .unwrap()
    ).to.equal(1);
    expect(
      await asOpt(None)
        .orAsync(toAsync(Some(2)))
        .unwrap()
    ).to.equal(2);
  });

  it("orElse", () => {
    expect(
      Some(1)
        .orElse(() => Some(2))
        .unwrap()
    ).to.equal(1);
    expect(
      asOpt(None)
        .orElse(() => Some(2))
        .unwrap()
    ).to.equal(2);
  });

  it("orElseAsync", async () => {
    expect(
      await Some(1)
        .orElseAsync(async () => Some(2))
        .unwrap()
    ).to.equal(1);
    expect(
      await asOpt(None)
        .orElseAsync(async () => Some(2))
        .unwrap()
    ).to.equal(2);
  });

  it("and", () => {
    expect(Some(1).and(None).isNone()).to.be.true;
    expect(asOpt(None).and(Some(2)).isNone()).to.be.true;
    expect(Some(1).and(Some("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(await Some(1).andAsync(toAsync(None)).isNone()).to.be.true;
    expect(
      await asOpt(None)
        .andAsync(toAsync(Some(2)))
        .isNone()
    ).to.be.true;
    expect(
      await Some(1)
        .andAsync(toAsync(Some("two")))
        .unwrap()
    ).to.equal("two");
  });

  it("andThen", () => {
    expect(
      Some(1)
        .andThen(() => None)
        .isNone()
    ).to.be.true;
    expect(
      asOpt(None)
        .andThen(() => Some(2))
        .isNone()
    ).to.be.true;
    expect(
      Some(1)
        .andThen((n) => Some(`num ${n + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("andThenAsync", async () => {
    expect(
      await Some(1)
        .andThenAsync(async () => None)
        .isNone()
    ).to.be.true;
    expect(
      await asOpt(None)
        .andThenAsync(async () => Some(2))
        .isNone()
    ).to.be.true;
    expect(
      await Some(1)
        .andThenAsync(async (n) => Some(`num ${n + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("map", () => {
    expect(
      Some(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.equal(2);
    expect(() => None.map((val) => val + 1).unwrap()).to.throw(
      "expected Some, got None"
    );
  });

  it("mapOr", async () => {
    expect(Some(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(None.mapOr(3, (val) => val + 1)).to.equal(3);

    expect(await Some(1).mapOr(3, async (val) => val + 1)).to.equal(2);
    expect(await None.mapOr(3, async (val) => val + 1)).to.equal(3);
  });

  it("mapOrElse", async () => {
    expect(
      Some(1).mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      None.mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await Some(1).mapOrElse(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await None.mapOrElse(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(3);
  });

  it("okOr", () => {
    expect(Some(1).okOr("err").isOk()).to.be.true;
    expect(Some(1).okOr("err").unwrap()).to.equal(1);
    expect(None.okOr("err").isErr()).to.be.true;
    expect(None.okOr("err").unwrapErr()).to.equal("err");
  });

  it("okOrElse", () => {
    const someOpt = Some(1).okOrElse(() => "err");
    expect(someOpt.isOk()).to.be.true;
    expect(someOpt.unwrap()).to.equal(1);

    const noneOpt = None.okOrElse(() => "err");
    expect(noneOpt.isErr()).to.be.true;
    expect(noneOpt.unwrapErr()).to.equal("err");
  });

  it("okOrElseAsync", async () => {
    const someOpt = Some(1).okOrElseAsync(async () => "err");
    expect(await someOpt.isOk()).to.be.true;
    expect(await someOpt.unwrap()).to.equal(1);

    const noneOpt = None.okOrElseAsync(async () => "err");
    expect(await noneOpt.isErr()).to.be.true;
    expect(await noneOpt.unwrapErr()).to.equal("err");
  });

  it("inspect", () => {
    const fSome = sinon.fake();
    const fNone = sinon.fake();
    Some(1).inspect(fSome);
    None.inspect(fNone);
    expect(fSome.called);
    expect(fNone.notCalled);
  });
}
