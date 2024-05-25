import { expect } from "chai";
import { Option } from "../../../src";

export default function none() {
  it("Is an object", () => expect(Option.none).to.be.an("object"));
  it("Is matched by Option.is", () =>
    expect(Option.is(Option.none)).to.be.true);
  it("Is a single instance", () =>
    expect(Option.none.map(() => 1)).to.equal(Option.none));
}
