import { expect } from "chai";
import * as sinon from "sinon";

import { Option, OptionAsync } from "../../../src";

function asOpt(opt: Option<any>): Option<number> {
  return opt;
}

function toAsync<T>(opt: Option<T>): OptionAsync<T> {
  return opt.mapAsync(async (val) => val);
}

export default function methods() {
  it("into", () => {
    expect(Option.some(1).into()).to.equal(1);
    expect(Option.none.into()).to.equal(undefined);
    expect(Option.none.into(false)).to.equal(false);
    expect(Option.none.into(null)).to.equal(null);
  });

  it("intoAsync", async () => {
    expect(await toAsync(Option.some(1)).intoAsync()).to.equal(1);
    expect(await toAsync(Option.none).intoAsync()).to.equal(undefined);
    expect(await toAsync(Option.none).intoAsync(false)).to.equal(false);
    expect(await toAsync(Option.none).intoAsync(null)).to.equal(null);
  });

  it("isSome", () => {
    expect(Option.some(1).isSome()).to.be.true;
    expect(Option.none.isSome()).to.be.false;
  });

  it("isSomeAsync", async () => {
    expect(await toAsync(Option.some(1)).isSomeAsync()).to.be.true;
    expect(await toAsync(Option.none).isSomeAsync()).to.be.false;
  });

  it("isSomeAnd", () => {
    expect(Option.some(1).isSomeAnd((val) => val === 1)).to.be.true;
    expect(Option.some(1).isSomeAnd((val) => val > 1)).to.be.false;
    expect(Option.none.isSomeAnd((val) => val === 1)).to.be.false;
  });

  it("isSomeAndAsync", async () => {
    expect(await Option.some(1).isSomeAndAsync(async (val) => val === 1)).to.be
      .true;
    expect(await Option.some(1).isSomeAndAsync(async (val) => val > 1)).to.be
      .false;
    expect(await Option.none.isSomeAndAsync(async (val) => val === 1)).to.be
      .false;

    expect(
      await toAsync(Option.some(1)).isSomeAndAsync(async (val) => val === 1)
    ).to.be.true;
    expect(await toAsync(Option.some(1)).isSomeAndAsync((val) => val > 1)).to.be
      .false;
    expect(await toAsync(Option.none).isSomeAndAsync((val) => val === 1)).to.be
      .false;
  });

  it("isNone", () => {
    expect(Option.some(1).isNone()).to.be.false;
    expect(Option.none.isNone()).to.be.true;
  });

  it("isNoneAsync", async () => {
    expect(await toAsync(Option.some(1)).isNoneAsync()).to.be.false;
    expect(await toAsync(Option.none).isNoneAsync()).to.be.true;
  });

  it("filter", () => {
    const lessThan5 = (val: number) => val < 5;
    expect(Option.some(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Option.some(10).filter(lessThan5).isNone()).to.be.true;
    expect(Option.none.filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (val: number) => val < 5;
    expect(await Option.some(1).filterAsync(lessThan5).unwrapAsync()).to.equal(
      1
    );
    expect(await Option.some(10).filterAsync(lessThan5).isNoneAsync()).to.be
      .true;
    expect(await Option.none.filterAsync(lessThan5).isNoneAsync()).to.be.true;

    expect(
      await toAsync(Option.some(1)).filterAsync(lessThan5).unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Option.some(10)).filterAsync(lessThan5).isNoneAsync())
      .to.be.true;
    expect(await toAsync(Option.none).filterAsync(lessThan5).isNoneAsync()).to
      .be.true;
  });

  it("flatten", () => {
    expect(Option.some(Option.some(1)).flatten().unwrap()).to.equal(1);
    expect(Option.some(Option.none).flatten().isNone()).to.be.true;
    expect(Option.none.flatten().isNone()).to.be.true;
  });

  it("flattenAsync", async () => {
    expect(
      await Option.some(toAsync(Option.some(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(await Option.some(toAsync(Option.none)).flattenAsync().isNoneAsync())
      .to.be.true;
    expect(await Option.none.flattenAsync().isNoneAsync()).to.be.true;

    expect(
      await toAsync(Option.some(Option.some(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Option.some(Option.none)).flattenAsync().isNoneAsync())
      .to.be.true;
    expect(await toAsync(Option.none).flattenAsync().isNoneAsync()).to.be.true;
  });

  it("expect", () => {
    expect(Option.some(1).expect("test")).to.equal(1);
    expect(() => Option.none.expect("test")).to.throw("test");
  });

  it("expectAsync", async () => {
    expect(await toAsync(Option.some(1)).expectAsync("test")).to.equal(1);
    await toAsync(Option.none)
      .expectAsync("test")
      .then(() => {
        throw new Error("expectAsync is supposed to throw");
      })
      .catch((e) => {
        expect(e).to.be.an.instanceOf(Error);
        expect(e.message).to.equal("test");
      });
  });

  it("unwrap", () => {
    expect(Option.some(1).unwrap()).to.equal(1);
    expect(() => Option.none.unwrap()).to.throw("expected Some, got None");
  });

  it("unwrapAsync", async () => {
    expect(await toAsync(Option.some(1)).unwrapAsync()).to.equal(1);
    await toAsync(Option.none)
      .unwrapAsync()
      .then(() => {
        throw new Error("unwrapAsync is supposed to throw");
      })
      .catch((e) => {
        expect(e).to.be.an.instanceOf(Error);
        expect(e.message).to.equal("expected Some, got None");
      });
  });

  it("unwrapOr", () => {
    expect(Option.some(1).unwrapOr(2)).to.equal(1);
    expect(asOpt(Option.none).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrAsync", async () => {
    expect(await toAsync(Option.some(1)).unwrapOrAsync(2)).to.equal(1);
    expect(await toAsync(asOpt(Option.none)).unwrapOrAsync(2)).to.equal(2);
  });

  it("unwrapOrElse", () => {
    expect(Option.some(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asOpt(Option.none).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapOrElseAsync", async () => {
    expect(await Option.some(1).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(await asOpt(Option.none).unwrapOrElseAsync(async () => 2)).to.equal(
      2
    );

    expect(
      await toAsync(Option.some(1)).unwrapOrElseAsync(async () => 2)
    ).to.equal(1);
    expect(
      await toAsync(asOpt(Option.none)).unwrapOrElseAsync(async () => 2)
    ).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Option.some(1).unwrapUnchecked()).to.equal(1);
    expect(Option.none.unwrapUnchecked()).to.be.undefined;
  });

  it("unwrapUncheckedAsync", async () => {
    expect(await toAsync(Option.some(1)).unwrapUncheckedAsync()).to.equal(1);
    expect(await toAsync(Option.none).unwrapUncheckedAsync()).to.be.undefined;
  });

  it("or", () => {
    expect(Option.some(1).or(Option.some(2)).unwrap()).to.equal(1);
    expect(asOpt(Option.none).or(Option.some(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Option.some(1)
        .orAsync(toAsync(Option.some(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asOpt(Option.none)
        .orAsync(toAsync(Option.some(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Option.some(1))
        .orAsync(toAsync(Option.some(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(asOpt(Option.none)).orAsync(Option.some(2)).unwrapAsync()
    ).to.equal(2);
  });

  it("orElse", () => {
    expect(
      Option.some(1)
        .orElse(() => Option.some(2))
        .unwrap()
    ).to.equal(1);
    expect(
      asOpt(Option.none)
        .orElse(() => Option.some(2))
        .unwrap()
    ).to.equal(2);
  });

  it("orElseAsync", async () => {
    expect(
      await Option.some(1)
        .orElseAsync(async () => Option.some(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asOpt(Option.none)
        .orElseAsync(async () => Option.some(2))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Option.some(1))
        .orElseAsync(async () => Option.some(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(asOpt(Option.none))
        .orElseAsync(() => Option.some(2))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("and", () => {
    expect(Option.some(1).and(Option.none).isNone()).to.be.true;
    expect(asOpt(Option.none).and(Option.some(2)).isNone()).to.be.true;
    expect(Option.some(1).and(Option.some("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(await Option.some(1).andAsync(toAsync(Option.none)).isNoneAsync()).to
      .be.true;
    expect(
      await asOpt(Option.none)
        .andAsync(toAsync(Option.some(2)))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await Option.some(1)
        .andAsync(toAsync(Option.some("two")))
        .unwrapAsync()
    ).to.equal("two");

    expect(
      await toAsync(Option.some(1)).andAsync(toAsync(Option.none)).isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(asOpt(Option.none))
        .andAsync(toAsync(Option.some(2)))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(Option.some(1)).andAsync(Option.some("two")).unwrapAsync()
    ).to.equal("two");
  });

  it("andThen", () => {
    expect(
      Option.some(1)
        .andThen(() => Option.none)
        .isNone()
    ).to.be.true;
    expect(
      asOpt(Option.none)
        .andThen(() => Option.some(2))
        .isNone()
    ).to.be.true;
    expect(
      Option.some(1)
        .andThen((n) => Option.some(`num ${n + 1}`))
        .unwrap()
    ).to.equal("num 2");
  });

  it("andThenAsync", async () => {
    expect(
      await Option.some(1)
        .andThenAsync(async () => Option.none)
        .isNoneAsync()
    ).to.be.true;
    expect(
      await asOpt(Option.none)
        .andThenAsync(async () => Option.some(2))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await Option.some(1)
        .andThenAsync(async (n) => Option.some(`num ${n + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");

    expect(
      await toAsync(Option.some(1))
        .andThenAsync(async () => Option.none)
        .isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(asOpt(Option.none))
        .andThenAsync(async () => Option.some(2))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(Option.some(1))
        .andThenAsync(async (n) => Option.some(`num ${n + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");
  });

  it("map", () => {
    expect(
      Option.some(1)
        .map((val) => val + 1)
        .unwrap()
    ).to.equal(2);
    expect(() => Option.none.map((val) => val + 1).unwrap()).to.throw(
      "expected Some, got None"
    );
  });

  it("mapAsync", async () => {
    expect(
      await Option.some(1)
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(await Option.none.mapAsync(async (val) => val + 1).isNoneAsync()).to
      .be.true;

    expect(
      await toAsync(Option.some(1))
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await toAsync(Option.none)
        .mapAsync((val) => val + 1)
        .isNoneAsync()
    ).to.be.true;
  });

  it("mapOr", () => {
    expect(Option.some(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(Option.none.mapOr(3, (val) => val + 1)).to.equal(3);
  });

  it("mapOrAsync", async () => {
    expect(await Option.some(1).mapOrAsync(3, async (val) => val + 1)).to.equal(
      2
    );
    expect(await Option.none.mapOrAsync(3, async (val) => val + 1)).to.equal(3);

    expect(
      await toAsync(Option.some(1)).mapOrAsync(3, async (val) => val + 1)
    ).to.equal(2);
    expect(
      await toAsync(Option.none).mapOrAsync(3, async (val) => val + 1)
    ).to.equal(3);
  });

  it("mapOrElse", () => {
    expect(
      Option.some(1).mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(2);
    expect(
      Option.none.mapOrElse(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("mapOrElseAsync", async () => {
    expect(
      await Option.some(1).mapOrElseAsync(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await Option.none.mapOrElseAsync(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await toAsync(Option.some(1)).mapOrElseAsync(
        () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await toAsync(Option.none).mapOrElseAsync(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("okOr", () => {
    expect(Option.some(1).okOr("err").isOk()).to.be.true;
    expect(Option.some(1).okOr("err").unwrap()).to.equal(1);
    expect(Option.none.okOr("err").isErr()).to.be.true;
    expect(Option.none.okOr("err").unwrapErr()).to.equal("err");
  });

  it("okOrAsync", async () => {
    expect(await toAsync(Option.some(1)).okOrAsync("err").isOkAsync()).to.be
      .true;
    expect(
      await toAsync(Option.some(1)).okOrAsync("err").unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Option.none).okOrAsync("err").isErrAsync()).to.be.true;
    expect(
      await toAsync(Option.none).okOrAsync("err").unwrapErrAsync()
    ).to.equal("err");
  });

  it("okOrElse", () => {
    const someOpt = Option.some(1).okOrElse(() => "err");
    expect(someOpt.isOk()).to.be.true;
    expect(someOpt.unwrap()).to.equal(1);

    const noneOpt = Option.none.okOrElse(() => "err");
    expect(noneOpt.isErr()).to.be.true;
    expect(noneOpt.unwrapErr()).to.equal("err");
  });

  it("okOrElseAsync", async () => {
    const ok = Option.some(1).okOrElseAsync(async () => "err");
    expect(await ok.isOkAsync()).to.be.true;
    expect(await ok.unwrapAsync()).to.equal(1);

    const err = Option.none.okOrElseAsync(async () => "err");
    expect(await err.isErrAsync()).to.be.true;
    expect(await err.unwrapErrAsync()).to.equal("err");

    const okAsync = toAsync(Option.some(1)).okOrElseAsync(async () => "err");
    expect(await okAsync.isOkAsync()).to.be.true;
    expect(await okAsync.unwrapAsync()).to.equal(1);

    const errAsync = toAsync(Option.none).okOrElseAsync(() => "err");
    expect(await errAsync.isErrAsync()).to.be.true;
    expect(await errAsync.unwrapErrAsync()).to.equal("err");
  });

  it("inspect", () => {
    const fSome = sinon.fake();
    const fNone = sinon.fake();
    Option.some(1).inspect(fSome);
    Option.none.inspect(fNone);
    expect(fSome.called);
    expect(fNone.notCalled);
  });

  it("inspectAsync", async () => {
    const fSome = sinon.fake();
    const fNone = sinon.fake();
    await toAsync(Option.some(1)).inspectAsync(fSome);
    await toAsync(Option.none).inspectAsync(fNone);
    expect(fSome.called);
    expect(fNone.notCalled);
  });
}
