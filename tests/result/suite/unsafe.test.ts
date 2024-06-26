import { expect } from "chai";
import { Result } from "../../../src";

export default function unsafe() {
  it("Should contain a value that the Promise resolves to", async () => {
    expect(
      await Result.unsafe(Promise.resolve(Result.ok(10))).unwrapAsync()
    ).to.equal(10);
    expect(await Result.unsafe(Promise.resolve(Result.err(10))).isErrAsync()).to
      .be.true;
  });

  it("Should throw if the provided Promise rejects", async () => {
    await Result.unsafe(Promise.reject())
      .then(() => {
        throw Error("Result.unsafe is supposed to throw");
      })
      .catch(() => undefined);
  });
}
