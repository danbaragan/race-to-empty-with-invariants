pragma solidity ^0.4.15;

contract VulnerableCoin {

    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    modifier checkInvariants {
        _;
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
            totalSupply -= amount;
            balanceOf[msg.sender] = 0;
        }
    }

    function () payable {

    }
}
