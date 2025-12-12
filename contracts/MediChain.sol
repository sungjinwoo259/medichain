// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MediChain is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    struct Batch {
        string batchId;
        address currentOwner;
        string pointer; // off-chain pointer (e.g. Firestore doc id)
        bool exists;
    }

    struct EventEntry {
        string eventType; // BatchCreated | BatchTransferred | PrescriptionAdded
        address actor;
        uint256 timestamp;
        string pointer; // generic off-chain pointer
    }

    mapping(string => Batch) private batches;
    mapping(string => EventEntry[]) private batchEvents;

    event BatchCreated(string indexed batchId, address indexed manufacturer, string pointer);
    event BatchTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        string pointer
    );
    event PrescriptionAdded(
        string indexed batchId,
        address indexed pharmacy,
        string prescriptionPointer
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    modifier onlyManufacturer() {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "Not manufacturer");
        _;
    }

    modifier onlyDistributor() {
        require(hasRole(DISTRIBUTOR_ROLE, msg.sender), "Not distributor");
        _;
    }

    modifier onlyPharmacy() {
        require(hasRole(PHARMACY_ROLE, msg.sender), "Not pharmacy");
        _;
    }

    function createBatch(string calldata batchId, string calldata pointer) external onlyManufacturer {
        require(!batches[batchId].exists, "Batch exists");

        batches[batchId] = Batch({
            batchId: batchId,
            currentOwner: msg.sender,
            pointer: pointer,
            exists: true
        });

        batchEvents[batchId].push(
            EventEntry({
                eventType: "BatchCreated",
                actor: msg.sender,
                timestamp: block.timestamp,
                pointer: pointer
            })
        );

        emit BatchCreated(batchId, msg.sender, pointer);
    }

    function transferBatch(
        string calldata batchId,
        address to,
        string calldata pointer
    ) external {
        Batch storage batch = batches[batchId];
        require(batch.exists, "Batch missing");
        require(batch.currentOwner == msg.sender, "Not owner");

        batch.currentOwner = to;
        batch.pointer = pointer;

        batchEvents[batchId].push(
            EventEntry({
                eventType: "BatchTransferred",
                actor: msg.sender,
                timestamp: block.timestamp,
                pointer: pointer
            })
        );

        emit BatchTransferred(batchId, msg.sender, to, pointer);
    }

    function addPrescription(
        string calldata batchId,
        string calldata prescriptionPointer
    ) external onlyPharmacy {
        Batch storage batch = batches[batchId];
        require(batch.exists, "Batch missing");
        require(batch.currentOwner == msg.sender, "Not owner");

        batchEvents[batchId].push(
            EventEntry({
                eventType: "PrescriptionAdded",
                actor: msg.sender,
                timestamp: block.timestamp,
                pointer: prescriptionPointer
            })
        );

        emit PrescriptionAdded(batchId, msg.sender, prescriptionPointer);
    }

    function getCurrentOwner(string calldata batchId) external view returns (address) {
        Batch storage batch = batches[batchId];
        require(batch.exists, "Batch missing");
        return batch.currentOwner;
    }

    function getEvents(string calldata batchId) external view returns (EventEntry[] memory) {
        return batchEvents[batchId];
    }
}


