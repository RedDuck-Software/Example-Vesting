import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { DefaultERC20__factory, SignatureVesting, SignatureVesting__factory, ERC20 } from "../typechain";
import keccak256 from 'keccak256';

describe("SignatureVesting", function () {
  let erc20 : ERC20;
  let vesting : SignatureVesting;
  let defaultVestingBalance : BigNumber;
  
  beforeEach(async () => {
    let [signer] = await ethers.getSigners();
    erc20 = await new DefaultERC20__factory(signer).deploy();
    vesting = await new SignatureVesting__factory(signer).deploy(erc20.address);
    defaultVestingBalance = (await erc20.balanceOf(await signer.getAddress())).div(2);

    await erc20.transfer(vesting.address, defaultVestingBalance);
  })
  
  it("Should emit Vest event with correct data when vesting tokens", async function () {
    let address2 = await ethers.provider.getSigner(1).getAddress();
    let address3 = await ethers.provider.getSigner(2).getAddress();
    
    let message2 = ethers.utils.solidityPack(["address", "uint256", "uint256", "address"], [address2, defaultVestingBalance.div(2), 0, vesting.address]);
    let message3 = ethers.utils.solidityPack(["address", "uint256", "uint256", "address"], [address3, defaultVestingBalance.div(3), 0, vesting.address]);
    
    let signature2 = await (await ethers.provider.getSigner(0)).signMessage(keccak256(message2)); // owner signs the message
    let signature3 = await (await ethers.provider.getSigner(0)).signMessage(keccak256(message3));

    let claimTx2 = await vesting.connect(ethers.provider.getSigner(1)).claimTokens(defaultVestingBalance.div(2), 0, signature2).then(i => i.wait());
    let claimTx3 = await vesting.connect(ethers.provider.getSigner(2)).claimTokens(defaultVestingBalance.div(3), 0, signature3).then(i => i.wait());

    let balance2 = await erc20.balanceOf(address2);
    let balance3 = await erc20.balanceOf(address3);
    let vestingBalance = await erc20.balanceOf(vesting.address);

    expect(vestingBalance).to.be.equal(defaultVestingBalance.sub(balance2).sub(balance3));
    expect(balance2).to.be.equal(defaultVestingBalance.div(2));
    expect(balance3).to.be.equal(defaultVestingBalance.div(3));

    expect(claimTx2).to.emit(vesting, "Claim"); //todo: check type
    expect(claimTx3).to.emit(vesting, "Claim");
  });
});
