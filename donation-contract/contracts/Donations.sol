//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract Donations {
    
    enum State {Open, Closed, Expired}

    struct Campaign {
        string description;
        uint id;
        uint fundLimit;
        uint totalFundsRaised;
        address payable vendor;
        bytes32 donationsHashed;
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
        emit Donation(campaignId, msg.sender, msg.value);
    }

    // function expireCampaign(uint campaignId) public {
    //     Campaign storage campaign = campaigns[campaignId];

    //     for (uint i=0;i<campaign.donors.length;i++){
    //         payable(campaign.donors[i]).transfer(campaign.donations[campaign.donors[i]]);
    //     }

    //     closeCampaign(campaign, State.Expired);
    // }

    function closeCampaign(Campaign storage campaign, State state) private {
        campaign.state = state;
    }

}
