// test/SimpleStorageWithOZ.test.js - Test file for SimpleStorageWithOZ contract
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorageWithOZ", function () {
  let simpleStorage;
  let owner;
  let user;
  
  // Deploy the contract before each test
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    const SimpleStorageWithOZ = await ethers.getContractFactory("SimpleStorageWithOZ");
    simpleStorage = await SimpleStorageWithOZ.deploy();
    await simpleStorage.deployed();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simpleStorage.getOwner()).to.equal(owner.address);
    });
    
    it("Should initialize with value 0", async function () {
      expect(await simpleStorage.getValue()).to.equal(0);
    });
  });
  
  describe("Functions", function () {
    it("Should store the value correctly", async function () {
      const testValue = 42;
      await simpleStorage.setValue(testValue);
      expect(await simpleStorage.getValue()).to.equal(testValue);
    });
    
    it("Should store user values separately", async function () {
      const ownerValue = 42;
      const userValue = 100;
      
      await simpleStorage.setValue(ownerValue);
      await simpleStorage.connect(user).setValue(userValue);
      
      // getValue returns the last set value regardless of who set it
      expect(await simpleStorage.getValue()).to.equal(userValue);
      
      // getUserValue returns value set by specific user
      expect(await simpleStorage.getUserValue(owner.address)).to.equal(ownerValue);
      expect(await simpleStorage.getUserValue(user.address)).to.equal(userValue);
    });
    
    it("Should emit ValueChanged event", async function () {
      const testValue = 42;
      await expect(simpleStorage.setValue(testValue))
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(owner.address, testValue);
    });
    
    it("Should not allow setting value when paused", async function () {
      await simpleStorage.pauseContract();
      
      await expect(simpleStorage.setValue(42))
        .to.be.revertedWith("Pausable: paused");
      
      await simpleStorage.unpauseContract();
      await simpleStorage.setValue(42);
      expect(await simpleStorage.getValue()).to.equal(42);
    });
    
    it("Should only allow owner to pause/unpause", async function () {
      await expect(simpleStorage.connect(user).pauseContract())
        .to.be.revertedWith("Ownable: caller is not the owner");
        
      await expect(simpleStorage.connect(user).unpauseContract())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});