# Hyperledger Burrow SendTx

## Problem 
- **Description**: Sending many async transactions to Burrow causes a Sequence/Nonce error.
- **Cause:** See [BURROW-PL-739](https://github.com/hyperledger/burrow/pull/739).

**Error-message**: "Error broadcasting transaction: Internal error: Error invalid sequence. Got 2, expected 3".

Burrow pulls the Sequence from the account associated with the transaction. However the account sequence gets updated only after a transaction has been validated and committed to a block.
This creates a problem when sending async transactions, which is what you would want to do to test performance.

Having to wait for the transaction to be committed to a block, before sending a new transaction, creates a significant throttle on performance.
Because you:
- Can't use multiple sources that send transactions. Since you can't be sure that the Sequence has been updated correctly. 
- Can't send a new transactions before the next one is committed. This essentially means you'll have to wait a few seconds before sending a new transaction.

## Solutions
Possible solutions to the problem.

### Track nonce client-side
#### Reasoning
Tracking the nonce client-side avoids the burrow mechanism responsible for adding it correctly.

#### Caveats
Slows down the sending mechanism because you'll have to keep track of the nonce client-side.

#### Attempts
- **Attempt**: Tried tracking the nonce client-side.
- **Outcome**: Tracking nonce was simple. However sending the correct json to the server for signing proved to difficult to continue. Error message were not clear on which property caused the type-error. Making debugging nigh impossible.


- **Attempt**: Self-signing of the transactions so that we can avoid the call to Burrow signing a transaction.
- **Outcome**: Impossible. The NodeJS client does not have a signing mechanism.

### Use synchronous transactions
#### Reasoning 
Synchronous transactions wait until the transaction has been committed to a block.
Sending a new transaction only when the previous transaction has been committed to block ensures that Burrow's transaction mechanism adds the correct Sequence/Nonce to a new transaction.

#### Caveats
Slows down performance significantly. Since you'll have to wait on each transaction being committed to a block before sending a new one.

#### Attempts
- **Attempt**: Tried this solution with random validators as remote.
- **Outcome**: Process crashed with a Sequence/Nonce error.

- **Attempt**: Tried this solution without random validators as remote.
- **Outcome**: Works.

### Use synchronous transactions and 1-on-1 relations
#### Reasoning
This would amount to a transacter per validator+account.
Each transacter would have:
- Only one validator to send transactions to.
- Only one account address to send send amounts to.

### Caveats
This would require multiple Jobs with anti-affinity. It would be yet another workaround.

#### Attempts
- **Attempt**: 
- **Outcome**: 

### Switch to GO-client and sign locally
#### Reasoning
This would skip all of the problems I'm facing right now.

#### Caveats
I don't know GO at all. So that would amount to more time spent on this.

#### Attempts
- **Attempt**: 
- **Outcome**: 
