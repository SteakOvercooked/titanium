import { expect } from "chai";
import { Result } from "../../../src";

export default function err() {
  it("Creates Err<E> when called with any other value", () =>
    expect(Result.err(1)).to.be.an("object"));
  it("Can be nested", () =>
    expect(Result.err(Result.err(1)).unwrapErr().unwrapErr()).to.equal(1));
  it("Is matched by Result.is", () =>
    expect(Result.is(Result.err(1))).to.be.true);
}
