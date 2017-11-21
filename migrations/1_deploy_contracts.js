const VulnerableCoin = artifacts.require("VulnerableCoin");
const EvilA = artifacts.require("EvilA");
const EvilB = artifacts.require("EvilB");


module.exports = function(deployer) {
  const futureVulnerableCoin = deployer.deploy(VulnerableCoin);
  const futureEvilB = futureVulnerableCoin.then( () => deployer.deploy(EvilB, VulnerableCoin.address) );
  futureEvilB.then( () => deployer.deploy(EvilA, VulnerableCoin.address, EvilB.address));
};
