import { expect } from "chai";
import { Option } from "../../../src";

export default function convert() {
  describe("from", from);
  describe("nonNull", nonNull);
}

function from() {
  it("Should cast falsey values to None", () => {
    [false, null, undefined, NaN, 0, -0, 0n, ""].forEach(
      (falsey) => expect(Option.from(falsey).isNone()).to.be.true
    );
  });

  it("Should cast Error (and subclasses) to None", () => {
    class TestError extends Error {}
    expect(Option.from(new Error("test")).isNone()).to.be.true;
    expect(Option.from(new TestError("test")).isNone()).to.be.true;
  });

  it("Should cast Invalid Date to None", () =>
    expect(Option.from(new Date("never")).isNone()).to.be.true);

  it("Should cast other values to Some<T>", () => {
    expect(Option.from("truthy").unwrap()).to.equal("truthy");
  });
}

function nonNull() {
  it("Should cast undefined, null and NaN to None", () => {
    expect(Option.nonNull(null).isNone()).to.be.true;
    expect(Option.nonNull(undefined).isNone()).to.be.true;
    expect(Option.nonNull(NaN).isNone()).to.be.true;
  });

  it("Should cast other values to Some<T>", () => {
    [false, 0, -0, 0n, "", new Date("never"), new Error("never")].forEach(
      (val) => expect(Option.nonNull(val).unwrap()).to.equal(val)
    );
  });
}
