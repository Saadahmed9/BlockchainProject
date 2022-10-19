pragma solidity >=0.4.22 <=0.6.0;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';


contract DonationV2 {
    
    enum State {Open, Closed, Expired}

    struct Campaign {
        string description;
        uint id;
        uint fundLimit;
        uint totalFundsRaised;
        address payable vendor;
        address[] donors;
        mapping(address => uint) donations;
        State state;
    }

    struct donor{
        address donorAddress;
        uint donatedAmount;
    }

    mapping(uint => Campaign) public campaigns;
    uint public counter;
    
    constructor () public {
        counter = 0;
    }  

    function createCampaign(uint amountRequired, address payable vendor, string storage description) public {
        counter = counter + 1;
        Campaign storage campaign;
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
        
        if (campaign.donations[msg.sender] != 0){
            campaign.donations[msg.sender] += msg.value;
        }else {
            campaign.donations[msg.sender] = msg.value;
            campaign.donors.push(msg.sender);
        }
        campaign.totalFundsRaised += msg.value;

        if (campaign.totalFundsRaised >= campaign.fundLimit){
            campaign.vendor.transfer(campaign.fundLimit);
            closeCampaign(campaign,State.Closed);
        }
    }

    function expireCampaign(uint campaignId) public {
        Campaign storage campaign = campaigns[campaignId];

        for (uint i=0;i<campaign.donors.length;i++){
            payable(campaign.donors[i]).transfer(campaign.donations[campaign.donors[i]]);
        }

        closeCampaign(campaign, State.Expired);
    }

    function closeCampaign(Campaign storage campaign, State state) private {
        campaign.state = state;
    }

}
