# Study of race-to-empty with invariants exploit of ethereum network

This is an implementation of exploiting a smart contract due to wrong invarinats + 
too early external effects ( send() )
This is an example of what you should not do.

## Setup

You need nodejs and npm.
I have truffle and testrpc installed globaly. You need them to run this.
Global or locally - it's your choice

* ethereumjs-testrpc (@4.1.3)
* truffle (@3.4.9)

## Run

Simply let `testrpc` run and do a `truffle test`

## Further reading

An implementation of the attack described here
https://github.com/PeterBorah/smart-contract-security-examples/issues/3

There are more detailed explanations for the second part of the attack (race-to-empty)
here: https://github.com/danbaragan/ethereum-race-to-bottom-vulnerability-example
