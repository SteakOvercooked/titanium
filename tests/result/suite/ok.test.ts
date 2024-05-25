import { expect } from "chai";
import { Result } from "../../../src";

export default function ok() {
  it("Creates Ok<T> when called with any other value", () =>
    expect(Result.ok(1)).to.be.an("object"));
  it("Can be nested with Ok.from", () =>
    expect(Result.ok(Result.ok(1)).unwrap().unwrap()).to.equal(1));
  it("Is matched by Result.is", () =>
    expect(Result.is(Result.ok(1))).to.be.true);
}
