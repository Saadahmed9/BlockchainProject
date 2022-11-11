//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract Donations {
    
    enum Status {OPEN, CLOSED, EXPIRED}

    struct Campaign {
        uint id;
        uint target;
        uint fundsRaised;
        uint deposit;
        address createdBy;
        address payable vendor;
        uint donationsHash;
        Status status;
    }

    struct Donor{
        address donorAddress;
        uint donatedAmount;
    }

    mapping(uint => Campaign) public campaigns;
    uint public counter;
    uint public percentToDeposit;
    
    constructor (uint percentToDepositValue) {
        counter = 0;
        percentToDeposit = percentToDepositValue;
    }  

    event Donation(uint campaignId, address _from, uint _value);
    event Transition(uint campaignId, Status status);
    event CreateCampaign(uint campaignId, uint target, uint deposit, address createdBy, address vendor);

    modifier validTransition(uint campaignId, Status status) {
        require(campaigns[campaignId].status == status);
        _;
    }

    modifier validCreateCampaign(uint amountRequired) {
        require(amountRequired*percentToDeposit == msg.value*100);
        _;
    }

    modifier validDonation(uint campaignId) {
        require(campaigns[campaignId].fundsRaised + msg.value <= campaigns[campaignId].target);
        _;
    }

    modifier validExpireCampaign(uint campaignId, Donor[] calldata donors) {
        require(campaigns[campaignId].createdBy == msg.sender);
        uint hashValue;
        for (uint i=0;i<donors.length;i++){
            hashValue = uint(keccak256(abi.encodePacked(hashValue,donors[i].donatedAmount,donors[i].donorAddress)));
        }
        require(hashValue == campaigns[campaignId].donationsHash);
        _;
    }

    function createCampaign(uint amountRequired, address payable vendor) public payable validCreateCampaign(amountRequired) {
        counter = counter + 1;
        Campaign storage campaign = campaigns[counter];
        campaign.id = counter;
        campaign.target = amountRequired;            
        campaign.fundsRaised = 0;
        campaign.createdBy = msg.sender;
        campaign.vendor = vendor;
        campaign.status = Status.OPEN;
        campaign.deposit = msg.value;
        campaigns[counter] = campaign;
        emit CreateCampaign(campaign.id,campaign.target,campaign.deposit,campaign.createdBy,campaign.vendor);
    }

    function donate(uint campaignId) public payable validTransition(campaignId, Status.OPEN) validDonation(campaignId) {
        Campaign storage campaign = campaigns[campaignId];
        campaign.fundsRaised += msg.value;

        campaign.donationsHash = uint(keccak256(abi.encodePacked(campaign.donationsHash,msg.value,msg.sender)));
        emit Donation(campaignId, msg.sender, msg.value);

        if (campaign.fundsRaised == campaign.target){
            campaign.vendor.transfer(campaign.target);
            payable(campaign.createdBy).transfer(campaign.deposit);
            closeCampaign(campaign,Status.CLOSED);
        }
    }

    function expireCampaign(uint campaignId, Donor[] calldata donors) public validTransition(campaignId,Status.OPEN) validExpireCampaign(campaignId,donors) {
        Campaign storage campaign = campaigns[campaignId];
        for (uint i=0;i<donors.length;i++){
            payable(donors[i].donorAddress).transfer(donors[i].donatedAmount);
        }
        payable(campaign.createdBy).transfer(campaign.deposit);
        closeCampaign(campaign, Status.EXPIRED);
    }

    function closeCampaign(Campaign storage campaign, Status status) private {
        campaign.status = status;
        emit Transition(campaign.id, status);
    }
}
