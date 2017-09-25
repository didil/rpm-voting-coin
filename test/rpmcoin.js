var RPMCoin = artifacts.require("./RPMCoin.sol");

function catchOpcodeErr(err) {
  if (err.toString().indexOf("invalid opcode") < 0) {
    assert(false, err.toString());
  }
}

contract('RPMCoin', function (accounts) {
  it("should put 10000 RPMCoin in the first account", function () {
    var instance;

    return RPMCoin.deployed().then(function (_instance) {
      instance = _instance;
      return instance.balanceOf.call(accounts[0]);
    }).then(balance => {
      assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    }).then(function () {
      return instance.voterAddresses.call(0);
    }).then(function (address) {
      assert.equal(address, accounts[0], "Owner address not added to voters list");
    });
  });

  it("should send coin correctly and address to voters list", function () {
    var instance;

    //    Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 4000;

    return RPMCoin.deployed().then(function (_instance) {
      instance = _instance;
      return instance.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_starting_balance = balance.toNumber();
      return instance.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_starting_balance = balance.toNumber();
      return instance.transferAndAddVoterAddress(account_two, amount, {from: account_one});
    }).then(function () {
      return instance.balanceOf.call(account_one);
    }).then(function (balance) {
      account_one_ending_balance = balance.toNumber();
      return instance.balanceOf.call(account_two);
    }).then(function (balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, 6000, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, 4000, "Amount wasn't correctly sent to the receiver");
    }).then(function () {
      return instance.voterAddresses.call(1);
    }).then(function (address) {
      assert.equal(address, account_two, "Receiver address no added to voters list");
    });
  });

  describe("distributeVotes", function () {
    it("not allowed if not owner", function () {
      var instance;

      return RPMCoin.deployed().then(function (_instance) {
        instance = _instance;
        return instance.distributeVotes(100, {from: accounts[1]});
      }).then(assert.fail).catch(catchOpcodeErr);
    });

    it("increases votesToUse", function () {
      var instance;

      return RPMCoin.deployed().then(function (_instance) {
        instance = _instance;
        return instance.distributeVotes(100, {from: accounts[0]});
      }).then(function () {
        return instance.votesToUse.call(accounts[0]);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 60, "Votes not distributed properly to account 1");
      }).then(function () {
        return instance.votesToUse.call(accounts[1]);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 40, "Votes not distributed properly to account 2");
      });
    });
  });

  describe("vote", function () {
    let projectAddress = accounts[2];

    it("not allowed if not owner", function () {
      var instance;

      return RPMCoin.deployed().then(function (_instance) {
        instance = _instance;
        return instance.vote(accounts[0], projectAddress, {from: accounts[1]});
      }).then(assert.fail).catch(catchOpcodeErr);
    });

    it("upvotes", function () {
      var instance;

      return RPMCoin.deployed().then(function (_instance) {
        instance = _instance;
        return instance.vote(accounts[0], projectAddress, {from: accounts[0]});
      }).then(function () {
        return instance.votesToUse.call(accounts[0]);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 59, "Votes not decreased properly");
      }).then(function () {
        return instance.upvotesReceivedThisWeek.call(projectAddress);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 1, "Upvotes not increased properly");
      }).then(function () {
        return instance.vote(accounts[1], projectAddress, {from: accounts[1]});
      }).then(function () {
        return instance.votesToUse.call(accounts[1]);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 39, "Votes not decreased properly");
      }).then(function () {
        return instance.upvotesReceivedThisWeek.call(projectAddress);
      }).then(function (votes) {
        assert.equal(votes.toNumber(), 2, "Upvotes not increased properly");
      });
    });


  });

});