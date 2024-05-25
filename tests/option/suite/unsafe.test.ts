import { expect } from "chai";
import { Option } from "../../../src";

export default function unsafe() {
  it("Should contain a value that the Promise resolves to", async () => {
    expect(
      await Option.unsafe(Promise.resolve(Option.some(10))).unwrapAsync()
    ).to.equal(10);
    expect(await Option.unsafe(Promise.resolve(Option.none)).isNoneAsync()).to
      .be.true;
  });

  it("Should throw if the provided Promise rejects", async () => {
    await Option.unsafe(Promise.reject())
      .then(() => {
        throw Error("Option.unsafe is supposed to throw");
      })
      .catch(() => undefined);
  });
}
