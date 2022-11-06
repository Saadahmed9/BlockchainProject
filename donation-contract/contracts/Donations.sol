//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract Donations {
    
    enum State {Open, Closed, Expired}

    struct Campaign {
        string description;
        uint id;
        uint fundLimit;
        uint totalFundsRaised;
        uint pot;
        address payable vendor;
        uint donationsHashed;
        State state;
    }

    struct donor{
        address donorAddress;
        uint donatedAmount;
    }

    mapping(uint => Campaign) public campaigns;
    uint public counter;
    
    constructor () {
        counter = 0;
    }  

    event Donation(uint campaignId, address _from, uint _value);

    function createCampaign(uint amountRequired, address payable vendor, string memory description) public {
        counter = counter + 1;
        Campaign storage campaign = campaigns[counter];
        campaign.description = description;
        campaign.id = counter;
        campaign.fundLimit = amountRequired;            
        campaign.totalFundsRaised = 0;
        campaign.vendor = vendor;
        campaign.state = State.Open;
        campaigns[counter] = campaign;
    }

    function donate(uint campaignId) public payable {
        // require(campaigns[campaignId] != 0);
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.totalFundsRaised + msg.value <= campaign.fundLimit);
        require(campaign.state == State.Open);
        
        // if (campaign.donations[msg.sender] != 0){
        //     campaign.donations[msg.sender] += msg.value;
        // }else {
        //     campaign.donations[msg.sender] = msg.value;
        //     campaign.donors.push(msg.sender);
        // }
        campaign.totalFundsRaised += msg.value;

        if (campaign.totalFundsRaised >= campaign.fundLimit){
            campaign.vendor.transfer(campaign.fundLimit);
            closeCampaign(campaign,State.Closed);
        }
        campaign.donationsHashed = uint(keccak256(abi.encodePacked(campaign.donationsHashed,msg.value,msg.sender)));
        emit Donation(campaignId, msg.sender, msg.value);
        
    }

    function expireCampaign(uint campaignId, donor[] calldata donors) public validExpiry(campaignId,donors) validTransition(campaignId,State.Open){
        Campaign storage campaign = campaigns[campaignId];

        for (uint i=0;i<donors.length;i++){
            payable(donors[i].donorAddress).transfer(donors[i].donatedAmount);
        }

        closeCampaign(campaign, State.Expired);
    }

    function closeCampaign(Campaign storage campaign, State state) private {
        campaign.state = state;
    }

    modifier validExpiry(uint campaignId, donor[] calldata donors) {
        uint hashValue;
        for (uint i=0;i<donors.length;i++){
            hashValue = uint(keccak256(abi.encodePacked(hashValue,donors[i].donatedAmount,donors[i].donorAddress)));
        }
        require(hashValue == campaigns[campaignId].donationsHashed);
        _;
    }

    modifier validTransition(uint campaignId, State state) {
        require(campaigns[campaignId].state == state);
        _;
    }

}