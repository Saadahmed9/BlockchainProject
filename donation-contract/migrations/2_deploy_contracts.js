var Donations = artifacts.require("Donations");

module.exports = function(deployer) {
  deployer.deploy(Donations,10,200);
};
