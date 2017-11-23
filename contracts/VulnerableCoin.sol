pragma solidity ^0.4.15;

contract VulnerableCoin {

    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    modifier checkInvariants {
        _;
        // 1
        // If we use equality then anybody could send a small amount and make oru invariant fail (3)
        // The balance may exceed the recorded supply - this will get interesting...
        require(totalSupply <= this.balance);
    }

    function buy()
        payable
        checkInvariants
    {
        require(msg.value > 0);
        balanceOf[msg.sender] += msg.value;
        totalSupply += msg.value;
    }

    function transfer(address to, uint256 amount)
        checkInvariants
    {
        // should fail fast, not wrap in ifs
        // require(balanceOf[msg.sender] >= amount);
        if (balanceOf[msg.sender] >= amount) {
            balanceOf[to] += amount;
            balanceOf[msg.sender] -= amount;
        }
    }

    function withdraw()
        checkInvariants
    {
        uint256 amount = balanceOf[msg.sender];
        if (msg.sender.call.value(amount)()) {
            // 2
            // External effects were executed first. Wrong.
            // We can as well send at the end and all our changes will revert on failure (eg: revert())

            // At the end of the last EvilA withdraw it will return all ether back to this contract
            // And transfer it's amount of balaceOf tokens to EvilB
            totalSupply -= amount;
            // This will uselessly set the balance to 0 three times in a row (see EvilA)
            balanceOf[msg.sender] = 0;
            // At this point, after several (3 hardcoded in EvilA) withdrawals,
            // totalSupply will be lowered, eth balance the same, and EvilB will own EvilA balance
            // Invariant will thus pass (totalSupply > balance)
            // and EvilB can proceed with a known rae-to-empty attack stealing up to half of
            // VulnerableCoin balance. The remaining ether will be locked forever due to
            // totalSupply reaching 0
        }
    }

    // 3
    // We shouldn't allow payable here, this could solve the invariant weakening in (1)
    function () payable {

    }
}
