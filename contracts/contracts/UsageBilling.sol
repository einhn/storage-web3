// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Usage & Billing contract for storage-web3
/// @notice 월별 사용량/요금 + 스냅샷 해시를 기록하는 간단한 버전
contract UsageBilling {
    struct MonthlyUsage {
        uint64 totalBytes;      // 해당 월 총 사용량 (bytes)
        uint256 billedAmount;   // 해당 월 청구 금액 (예: 원이나 wei 등 단위는 off-chain에서 맞춤)
        bytes32 snapshotHash;   // off-chain 상세 스냅샷 해시 (예: Merkle root / SHA-256)
        bool settled;           // 결제 처리 여부
        bool paid;              // 결제 성공 여부
    }

    // usages[user][year][month] 형태로 접근
    mapping(address => mapping(uint16 => mapping(uint8 => MonthlyUsage))) public usages;

    event MonthlyUsageCommitted(
        address indexed user,
        uint16 indexed year,
        uint8 indexed month,
        uint64 totalBytes,
        uint256 billedAmount,
        bytes32 snapshotHash
    );

    event PaymentSettled(
        address indexed user,
        uint16 indexed year,
        uint8 indexed month,
        uint256 billedAmount,
        bool success
    );

    /// @notice 월별 사용량/요금을 온체인에 커밋
    function commitMonthlyUsage(
        address user,
        uint16 year,
        uint8 month,
        uint64 totalBytes,
        uint256 billedAmount,
        bytes32 snapshotHash
    ) external {
        MonthlyUsage storage u = usages[user][year][month];

        u.totalBytes = totalBytes;
        u.billedAmount = billedAmount;
        u.snapshotHash = snapshotHash;

        emit MonthlyUsageCommitted(
            user,
            year,
            month,
            totalBytes,
            billedAmount,
            snapshotHash
        );
    }

    /// @notice 결제 성공/실패 결과를 온체인에 기록
    function settlePayment(
        address user,
        uint16 year,
        uint8 month,
        bool success
    ) external {
        MonthlyUsage storage u = usages[user][year][month];

        // commitMonthlyUsage가 먼저 호출되었다는 가정 (혹은 UI/백엔드에서 체크)
        require(u.billedAmount > 0, "no billing record");

        u.settled = true;
        u.paid = success;

        emit PaymentSettled(
            user,
            year,
            month,
            u.billedAmount,
            success
        );
    }
}