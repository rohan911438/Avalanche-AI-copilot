// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

contract MidSemExams is Ownable, ReentrancyGuard, Pausable {

    // Struct to represent a mid-semester exam
    struct Exam {
        uint256 examId;
        string subject;
        uint256 startTime; // Unix timestamp
        uint256 endTime;   // Unix timestamp
        uint256 totalMarks;
    }

    // Mapping from exam ID to Exam struct
    mapping(uint256 => Exam) public exams;
    
    //Keep track of the next available examId.
    uint256 public nextExamId;

    // Event emitted when a new exam is created
    event ExamCreated(uint256 examId, string subject, uint256 startTime, uint256 endTime, uint256 totalMarks);

    // Event emitted when an exam is paused
    event ExamPaused(uint256 examId);

    // Event emitted when an exam is unpaused
    event ExamUnpaused(uint256 examId);

    /**
     * @dev Constructor. Initializes the contract with the first examId as 1.
     */
    constructor() {
        nextExamId = 1;
    }


    /**
     * @dev Creates a new mid-semester exam. Only callable by the owner.
     * @param subject The name of the subject.
     * @param startTime The start time of the exam (Unix timestamp).
     * @param endTime The end time of the exam (Unix timestamp).
     * @param totalMarks The total marks for the exam.
     */
    function createExam(string memory subject, uint256 startTime, uint256 endTime, uint256 totalMarks) public onlyOwner whenNotPaused {
        require(startTime < endTime, "End time must be after start time");
        require(totalMarks > 0, "Total marks must be greater than zero");

        exams[nextExamId] = Exam(nextExamId, subject, startTime, endTime, totalMarks);
        emit ExamCreated(nextExamId, subject, startTime, endTime, totalMarks);
        nextExamId++;
    }

    /**
     * @dev Pauses a specific exam. Only callable by the owner.
     * @param _examId The ID of the exam to pause.
     */
    function pauseExam(uint256 _examId) public onlyOwner {
        require(exams[_examId].examId != 0, "Exam does not exist");
        _pause(); //Pauses the entire contract - more secure than individual exam pausing
        emit ExamPaused(_examId);
    }

    /**
     * @dev Unpauses a specific exam. Only callable by the owner.
     * @param _examId The ID of the exam to unpause.
     */
    function unpauseExam(uint256 _examId) public onlyOwner {
        require(exams[_examId].examId != 0, "Exam does not exist");
        _unpause(); //Unpauses the entire contract
        emit ExamUnpaused(_examId);
    }

    /**
     * @dev Returns the details of a specific exam.
     * @param _examId The ID of the exam.
     * @return Exam struct containing the exam details.
     */
    function getExam(uint256 _examId) public view returns (Exam memory) {
        return exams[_examId];
    }


    //Example of a payable function (requires further logic depending on the use case)
    //This function is included to demonstrate a payable function.  It needs further development to be truly useful.
    receive() external payable {}

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}