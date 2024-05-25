import { expect } from "chai";
import { Option } from "../../../src";

export default function some() {
  it("Creates Some<T> when called with any other value", () =>
    expect(Option.some(1)).to.be.an("object"));
  it("Can be nested", () =>
    expect(Option.some(Option.some(1)).unwrap().unwrap()).to.equal(1));
  it("Is matched by Option.is", () =>
    expect(Option.is(Option.some(1))).to.be.true);
}
