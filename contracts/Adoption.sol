pragma solidity ^0.4.4;

contract Adoption {
    address[16] public adopters;
    bytes32[16] public petNames;

    event Rename(address indexed sender, uint indexed petId, bytes32 newName);

    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15);

        adopters[petId] = msg.sender;

        return petId;
    }

    function rename(uint petId, bytes32 newName) public returns (uint) {
        require(petId >= 0 && petId <= 15);

        petNames[petId] = newName;
        Rename(msg.sender, petId, newName);

        return petId;

    }

    function getAdopters() public returns (address[16]) {
        return adopters;
    }

    function getPetNames() public returns (bytes32[16]) {
        return petNames;
    }
}
