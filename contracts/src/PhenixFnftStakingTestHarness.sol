// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PhenixFnftStaking} from "./PhenixFnftStaking.sol";

contract PhenixFnftStakingTestHarness is PhenixFnftStaking {
    constructor(address fnftAddress, address phenixAddress, address ownerMultisig)
        PhenixFnftStaking(fnftAddress, phenixAddress, ownerMultisig)
    {}

    function _timeUnit() internal pure override returns (uint64) {
        return 1 minutes;
    }

    function _lockUnits(uint8 planId) internal pure override returns (uint16) {
        if (planId == 0) return 2;
        if (planId == 1) return 4;
        if (planId == 2) return 6;
        if (planId == 3) return 8;
        revert InvalidPlan();
    }
}
