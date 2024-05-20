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

  it("intoAsync", async () => {
    expect(await toAsync(Some(1)).intoAsync()).to.equal(1);
    expect(await toAsync(None).intoAsync()).to.equal(undefined);
    expect(await toAsync(None).intoAsync(false)).to.equal(false);
    expect(await toAsync(None).intoAsync(null)).to.equal(null);
  });

  it("isSome", () => {
    expect(Some(1).isSome()).to.be.true;
    expect(None.isSome()).to.be.false;
  });

  it("isSomeAsync", async () => {
    expect(await toAsync(Some(1)).isSomeAsync()).to.be.true;
    expect(await toAsync(None).isSomeAsync()).to.be.false;
  });

  it("isSomeAnd", () => {
    expect(Some(1).isSomeAnd((val) => val === 1)).to.be.true;
    expect(Some(1).isSomeAnd((val) => val > 1)).to.be.false;
    expect(None.isSomeAnd((val) => val === 1)).to.be.false;
  });

  it("isSomeAndAsync", async () => {
    expect(await Some(1).isSomeAndAsync(async (val) => val === 1)).to.be.true;
    expect(await Some(1).isSomeAndAsync(async (val) => val > 1)).to.be.false;
    expect(await None.isSomeAndAsync(async (val) => val === 1)).to.be.false;

    expect(await toAsync(Some(1)).isSomeAndAsync(async (val) => val === 1)).to
      .be.true;
    expect(await toAsync(Some(1)).isSomeAndAsync((val) => val > 1)).to.be.false;
    expect(await toAsync(None).isSomeAndAsync((val) => val === 1)).to.be.false;
  });

  it("isNone", () => {
    expect(Some(1).isNone()).to.be.false;
    expect(None.isNone()).to.be.true;
  });

  it("isNoneAsync", async () => {
    expect(await toAsync(Some(1)).isNoneAsync()).to.be.false;
    expect(await toAsync(None).isNoneAsync()).to.be.true;
  });

  it("filter", () => {
    const lessThan5 = (val: number) => val < 5;
    expect(Some(1).filter(lessThan5).unwrap()).to.equal(1);
    expect(Some(10).filter(lessThan5).isNone()).to.be.true;
    expect(None.filter(lessThan5).isNone()).to.be.true;
  });

  it("filterAsync", async () => {
    const lessThan5 = async (val: number) => val < 5;
    expect(await Some(1).filterAsync(lessThan5).unwrapAsync()).to.equal(1);
    expect(await Some(10).filterAsync(lessThan5).isNoneAsync()).to.be.true;
    expect(await None.filterAsync(lessThan5).isNoneAsync()).to.be.true;

    expect(
      await toAsync(Some(1)).filterAsync(lessThan5).unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Some(10)).filterAsync(lessThan5).isNoneAsync()).to.be
      .true;
    expect(await toAsync(None).filterAsync(lessThan5).isNoneAsync()).to.be.true;
  });

  it("flatten", () => {
    expect(Some(Some(1)).flatten().unwrap()).to.equal(1);
    expect(Some(None).flatten().isNone()).to.be.true;
    expect(None.flatten().isNone()).to.be.true;
  });

  it("flattenAsync", async () => {
    expect(
      await Some(toAsync(Some(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(await Some(toAsync(None)).flattenAsync().isNoneAsync()).to.be.true;
    expect(await None.flattenAsync().isNoneAsync()).to.be.true;

    expect(
      await toAsync(Some(Some(1)))
        .flattenAsync()
        .unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(Some(None)).flattenAsync().isNoneAsync()).to.be.true;
    expect(await toAsync(None).flattenAsync().isNoneAsync()).to.be.true;
  });

  it("expect", () => {
    expect(Some(1).expect("test")).to.equal(1);
    expect(() => None.expect("test")).to.throw("test");
  });

  it("expectAsync", async () => {
    expect(await toAsync(Some(1)).expectAsync("test")).to.equal(1);
    await toAsync(None)
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
    expect(Some(1).unwrap()).to.equal(1);
    expect(() => None.unwrap()).to.throw("expected Some, got None");
  });

  it("unwrapAsync", async () => {
    expect(await toAsync(Some(1)).unwrapAsync()).to.equal(1);
    await toAsync(None)
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
    expect(Some(1).unwrapOr(2)).to.equal(1);
    expect(asOpt(None).unwrapOr(2)).to.equal(2);
  });

  it("unwrapOrAsync", async () => {
    expect(await toAsync(Some(1)).unwrapOrAsync(2)).to.equal(1);
    expect(await toAsync(asOpt(None)).unwrapOrAsync(2)).to.equal(2);
  });

  it("unwrapOrElse", () => {
    expect(Some(1).unwrapOrElse(() => 2)).to.equal(1);
    expect(asOpt(None).unwrapOrElse(() => 2)).to.equal(2);
  });

  it("unwrapOrElseAsync", async () => {
    expect(await Some(1).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(await asOpt(None).unwrapOrElseAsync(async () => 2)).to.equal(2);

    expect(await toAsync(Some(1)).unwrapOrElseAsync(async () => 2)).to.equal(1);
    expect(
      await toAsync(asOpt(None)).unwrapOrElseAsync(async () => 2)
    ).to.equal(2);
  });

  it("unwrapUnchecked", () => {
    expect(Some(1).unwrapUnchecked()).to.equal(1);
    expect(None.unwrapUnchecked()).to.be.undefined;
  });

  it("unwrapUncheckedAsync", async () => {
    expect(await toAsync(Some(1)).unwrapUncheckedAsync()).to.equal(1);
    expect(await toAsync(None).unwrapUncheckedAsync()).to.be.undefined;
  });

  it("or", () => {
    expect(Some(1).or(Some(2)).unwrap()).to.equal(1);
    expect(asOpt(None).or(Some(2)).unwrap()).to.equal(2);
  });

  it("orAsync", async () => {
    expect(
      await Some(1)
        .orAsync(toAsync(Some(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asOpt(None)
        .orAsync(toAsync(Some(2)))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Some(1))
        .orAsync(toAsync(Some(2)))
        .unwrapAsync()
    ).to.equal(1);
    expect(await toAsync(asOpt(None)).orAsync(Some(2)).unwrapAsync()).to.equal(
      2
    );
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
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await asOpt(None)
        .orElseAsync(async () => Some(2))
        .unwrapAsync()
    ).to.equal(2);

    expect(
      await toAsync(Some(1))
        .orElseAsync(async () => Some(2))
        .unwrapAsync()
    ).to.equal(1);
    expect(
      await toAsync(asOpt(None))
        .orElseAsync(() => Some(2))
        .unwrapAsync()
    ).to.equal(2);
  });

  it("and", () => {
    expect(Some(1).and(None).isNone()).to.be.true;
    expect(asOpt(None).and(Some(2)).isNone()).to.be.true;
    expect(Some(1).and(Some("two")).unwrap()).to.equal("two");
  });

  it("andAsync", async () => {
    expect(await Some(1).andAsync(toAsync(None)).isNoneAsync()).to.be.true;
    expect(
      await asOpt(None)
        .andAsync(toAsync(Some(2)))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await Some(1)
        .andAsync(toAsync(Some("two")))
        .unwrapAsync()
    ).to.equal("two");

    expect(await toAsync(Some(1)).andAsync(toAsync(None)).isNoneAsync()).to.be
      .true;
    expect(
      await toAsync(asOpt(None))
        .andAsync(toAsync(Some(2)))
        .isNoneAsync()
    ).to.be.true;
    expect(await toAsync(Some(1)).andAsync(Some("two")).unwrapAsync()).to.equal(
      "two"
    );
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
        .isNoneAsync()
    ).to.be.true;
    expect(
      await asOpt(None)
        .andThenAsync(async () => Some(2))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await Some(1)
        .andThenAsync(async (n) => Some(`num ${n + 1}`))
        .unwrapAsync()
    ).to.equal("num 2");

    expect(
      await toAsync(Some(1))
        .andThenAsync(async () => None)
        .isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(asOpt(None))
        .andThenAsync(async () => Some(2))
        .isNoneAsync()
    ).to.be.true;
    expect(
      await toAsync(Some(1))
        .andThenAsync(async (n) => Some(`num ${n + 1}`))
        .unwrapAsync()
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

  it("mapAsync", async () => {
    expect(
      await Some(1)
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(await None.mapAsync(async (val) => val + 1).isNoneAsync()).to.be
      .true;

    expect(
      await toAsync(Some(1))
        .mapAsync(async (val) => val + 1)
        .unwrapAsync()
    ).to.equal(2);
    expect(
      await toAsync(None)
        .mapAsync((val) => val + 1)
        .isNoneAsync()
    ).to.be.true;
  });

  it("mapOr", () => {
    expect(Some(1).mapOr(3, (val) => val + 1)).to.equal(2);
    expect(None.mapOr(3, (val) => val + 1)).to.equal(3);
  });

  it("mapOrAsync", async () => {
    expect(await Some(1).mapOrAsync(3, async (val) => val + 1)).to.equal(2);
    expect(await None.mapOrAsync(3, async (val) => val + 1)).to.equal(3);

    expect(
      await toAsync(Some(1)).mapOrAsync(3, async (val) => val + 1)
    ).to.equal(2);
    expect(await toAsync(None).mapOrAsync(3, async (val) => val + 1)).to.equal(
      3
    );
  });

  it("mapOrElse", () => {
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
  });

  it("mapOrElseAsync", async () => {
    expect(
      await Some(1).mapOrElseAsync(
        async () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await None.mapOrElseAsync(
        async () => 3,
        (val) => val + 1
      )
    ).to.equal(3);

    expect(
      await toAsync(Some(1)).mapOrElseAsync(
        () => 3,
        async (val) => val + 1
      )
    ).to.equal(2);
    expect(
      await toAsync(None).mapOrElseAsync(
        () => 3,
        (val) => val + 1
      )
    ).to.equal(3);
  });

  it("okOr", () => {
    expect(Some(1).okOr("err").isOk()).to.be.true;
    expect(Some(1).okOr("err").unwrap()).to.equal(1);
    expect(None.okOr("err").isErr()).to.be.true;
    expect(None.okOr("err").unwrapErr()).to.equal("err");
  });

  it("okOrAsync", async () => {
    expect(await toAsync(Some(1)).okOrAsync("err").isOkAsync()).to.be.true;
    expect(await toAsync(Some(1)).okOrAsync("err").unwrapAsync()).to.equal(1);
    expect(await toAsync(None).okOrAsync("err").isErrAsync()).to.be.true;
    expect(await toAsync(None).okOrAsync("err").unwrapErrAsync()).to.equal(
      "err"
    );
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
    const ok = Some(1).okOrElseAsync(async () => "err");
    expect(await ok.isOkAsync()).to.be.true;
    expect(await ok.unwrapAsync()).to.equal(1);

    const err = None.okOrElseAsync(async () => "err");
    expect(await err.isErrAsync()).to.be.true;
    expect(await err.unwrapErrAsync()).to.equal("err");

    const okAsync = toAsync(Some(1)).okOrElseAsync(async () => "err");
    expect(await okAsync.isOkAsync()).to.be.true;
    expect(await okAsync.unwrapAsync()).to.equal(1);

    const errAsync = toAsync(None).okOrElseAsync(() => "err");
    expect(await errAsync.isErrAsync()).to.be.true;
    expect(await errAsync.unwrapErrAsync()).to.equal("err");
  });

  it("inspect", () => {
    const fSome = sinon.fake();
    const fNone = sinon.fake();
    Some(1).inspect(fSome);
    None.inspect(fNone);
    expect(fSome.called);
    expect(fNone.notCalled);
  });

  it("inspectAsync", async () => {
    const fSome = sinon.fake();
    const fNone = sinon.fake();
    await toAsync(Some(1)).inspectAsync(fSome);
    await toAsync(None).inspectAsync(fNone);
    expect(fSome.called);
    expect(fNone.notCalled);
  });
}
