import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { DefaultERC20__factory, MerkleVesting, MerkleVesting__factory, ERC20 } from "../typechain";
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { AbiCoder } from "ethers/lib/utils";

describe("MerkleVesting", function () {
  let erc20 : ERC20;
  let vesting : MerkleVesting;
  let merkleVestingBalance : BigNumber;
  
  beforeEach(async () => {
    let [signer] = await ethers.getSigners();
    erc20 = await new DefaultERC20__factory(signer).deploy();
    vesting = await new MerkleVesting__factory(signer).deploy(erc20.address);
    merkleVestingBalance = (await erc20.balanceOf(await signer.getAddress())).div(2);

    await erc20.transfer(vesting.address, merkleVestingBalance);
  })
  
  it("Should emit Vest event with correct data when vesting tokens", async function () {
    let address2 = await ethers.provider.getSigner(1).getAddress();
    let address3 = await ethers.provider.getSigner(2).getAddress();
    
    let vestData1 = ethers.utils.solidityPack(["address", "uint256"], [address2, merkleVestingBalance.div(2)]);
    let vestData2 = ethers.utils.solidityPack(["address", "uint256"], [address3, merkleVestingBalance.div(3)]);

    console.log(vestData1);
    console.log(vestData2);

    let merkleTree = new MerkleTree([vestData1, vestData2], keccak256, { hashLeaves: true, sortPairs: true });

    let vestTx = await vesting.vestTokens(merkleTree.getHexRoot()).then(i => i.wait());

    // we need to specify exact data that leaf has in case of off-chain pattern, ...
    let claimTx2 = await vesting.connect(ethers.provider.getSigner(1)).claimTokens(merkleVestingBalance.div(2), merkleTree.getHexProof(keccak256(vestData1))).then(i => i.wait());
    let claimTx3 = await vesting.connect(ethers.provider.getSigner(2)).claimTokens(merkleVestingBalance.div(3), merkleTree.getHexProof(keccak256(vestData2))).then(i => i.wait());

    let balance2 = await erc20.balanceOf(address2);
    let balance3 = await erc20.balanceOf(address3);
    let vestingBalance = await erc20.balanceOf(vesting.address);

    expect(vestingBalance).to.be.equal(merkleVestingBalance.sub(balance2).sub(balance3));
    expect(balance2).to.be.equal(merkleVestingBalance.div(2));
    expect(balance3).to.be.equal(merkleVestingBalance.div(3));

    expect(claimTx2).to.emit(vesting, "Claim"); //todo: check type
    expect(claimTx3).to.emit(vesting, "Claim");
  });
});
