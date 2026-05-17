// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GymCoursePayment {
    address payable public constant ADMIN_WALLET =
        payable(0xC91DD3d721f7146e4DC759716b158546F2a4E551);

    address public immutable owner;

    mapping(uint256 => uint256) public totalPaidByCourse;
    mapping(address => mapping(uint256 => uint256)) public paidByStudent;

    event CoursePaid(
        address indexed student,
        uint256 indexed courseId,
        uint256 amount
    );
    event FundsWithdrawn(address indexed admin, uint256 amount);

    error NotOwner();
    error InvalidCourseId();
    error InvalidPaymentAmount();
    error PaymentForwardFailed();
    error WithdrawFailed();
    error NoFundsToWithdraw();

    constructor() {
        owner = ADMIN_WALLET;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function payForCourse(uint256 courseId) external payable {
        if (courseId == 0) revert InvalidCourseId();
        if (msg.value == 0) revert InvalidPaymentAmount();

        paidByStudent[msg.sender][courseId] += msg.value;
        totalPaidByCourse[courseId] += msg.value;

        (bool success, ) = ADMIN_WALLET.call{value: msg.value}("");
        if (!success) revert PaymentForwardFailed();

        emit CoursePaid(msg.sender, courseId, msg.value);
    }

    function withdrawFunds() external onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFundsToWithdraw();

        (bool success, ) = ADMIN_WALLET.call{value: amount}("");
        if (!success) revert WithdrawFailed();

        emit FundsWithdrawn(ADMIN_WALLET, amount);
    }

    receive() external payable {
        revert InvalidPaymentAmount();
    }
}
