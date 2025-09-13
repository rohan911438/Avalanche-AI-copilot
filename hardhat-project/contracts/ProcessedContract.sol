// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// AUTOMATICALLY INLINED DEPENDENCIES

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// END OF INLINED DEPENDENCIES



// Ownable implementation inlined
// ReentrancyGuard implementation inlined

contract MidSemExams is Ownable, ReentrancyGuard {
    struct Exam {
        string subject;
        uint256 startTime;
        uint256 duration;
        bool isActive;
    }

    struct Student {
        string name;
        bool isRegistered;
        mapping(uint256 => bool) examAttempts;
    }

    // Exam ID counter
    uint256 private examCounter;
    
    // Mappings
    mapping(uint256 => Exam) public exams;
    mapping(address => Student) public students;

    // Events
    event ExamCreated(uint256 examId, string subject, uint256 startTime, uint256 duration);
    event StudentRegistered(address studentAddress, string name);
    event ExamAttempted(address studentAddress, uint256 examId);

    // Constructor
    constructor() {
        examCounter = 0;
    }

    // Register a new student
    function registerStudent(string memory _name) public {
        require(!students[msg.sender].isRegistered, "Student already registered");
        
        Student storage newStudent = students[msg.sender];
        newStudent.name = _name;
        newStudent.isRegistered = true;
        
        emit StudentRegistered(msg.sender, _name);
    }

    // Create a new exam (only owner)
    function createExam(string memory _subject, uint256 _startTime, uint256 _duration) public onlyOwner {
        uint256 examId = examCounter;
        
        exams[examId] = Exam({
            subject: _subject,
            startTime: _startTime,
            duration: _duration,
            isActive: true
        });
        
        examCounter++;
        
        emit ExamCreated(examId, _subject, _startTime, _duration);
    }

    // Attempt an exam
    function attemptExam(uint256 _examId) public nonReentrant {
        require(students[msg.sender].isRegistered, "Student not registered");
        require(exams[_examId].isActive, "Exam not active");
        require(block.timestamp >= exams[_examId].startTime, "Exam not started");
        require(block.timestamp <= exams[_examId].startTime + exams[_examId].duration, "Exam ended");
        require(!students[msg.sender].examAttempts[_examId], "Exam already attempted");
        
        students[msg.sender].examAttempts[_examId] = true;
        
        emit ExamAttempted(msg.sender, _examId);
    }

    // Deactivate an exam (only owner)
    function deactivateExam(uint256 _examId) public onlyOwner {
        require(exams[_examId].isActive, "Exam already inactive");
        exams[_examId].isActive = false;
    }

    // Check if student has attempted an exam
    function hasAttemptedExam(address _studentAddress, uint256 _examId) public view returns (bool) {
        return students[_studentAddress].examAttempts[_examId];
    }
}