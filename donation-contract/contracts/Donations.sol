//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract Donations {
    
    enum Status {OPEN, CLOSED, EXPIRED}
    string public constant name = "MyToken";
    string public constant symbol = "DTC";
    uint8 public constant decimals = 0;  

    mapping(address => uint256) balances;

    mapping(address => mapping (address => uint256)) allowed;
    
    uint256 totalSupply_;

    using SafeMath for uint256;

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
    //address receiver;
    constructor (uint256 total) {
        counter = 0;
        totalSupply_ = total;
	    balances[msg.sender] = totalSupply_;
    }  

    //event Donation(uint campaignId, address _from, uint _value);
    event Transition(uint campaignId, Status status);
    event CreateCampaign(uint campaignId, uint target, uint deposit, address createdBy, address vendor);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
    event Donation(uint campaignId,address from, uint numTokens);
    event TransferToken(address to_);
    event GetBalance(uint numTokens);
    //event Transfer(address indexed from, address indexed to, uint tokens);
    

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

    //ERC20 functions
     function totalSupply() public view returns (uint256) {
	return totalSupply_;
    }
    
    function DtcBalance() public {
        emit GetBalance(balances[msg.sender]);
        //return balances[account];
    }

    function donate(uint campaignId, uint numTokens) public payable {
        require(numTokens <= balances[msg.sender]);
        Campaign storage campaign = campaigns[campaignId];
        campaign.fundsRaised += numTokens;
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        campaign.donationsHash = uint(keccak256(abi.encodePacked(campaign.donationsHash,numTokens,msg.sender)));
        emit Donation(campaignId,msg.sender, numTokens);
        if (campaign.fundsRaised == campaign.target){
            campaign.vendor.transfer(campaign.target);
            payable(campaign.createdBy).transfer(campaign.deposit);
            closeCampaign(campaign,Status.CLOSED);
        }
    }

    function transfertoken() public payable {
        uint numTokens=20;
        require(numTokens >= balances[msg.sender]);
        balances[msg.sender] = balances[msg.sender].add(numTokens);
        totalSupply_=totalSupply_-numTokens;
        emit TransferToken(address(this));
        //return true;
    }

    function approve(address delegate, uint numTokens) public returns (bool) {
        allowed[msg.sender][delegate] = numTokens;
        emit Approval(msg.sender, delegate, numTokens);
        return true;
    }

    function allowance(address owner, address delegate) public view returns (uint) {
        return allowed[owner][delegate];
    }


    //Internal Functions

    function createCampaign(uint amountRequired, address payable vendor) public payable {
        uint deposit1=2;
        counter = counter + 1;
        Campaign storage campaign = campaigns[counter];
        campaign.id = counter;
        campaign.target = amountRequired;            
        campaign.fundsRaised = 0;
        campaign.createdBy = msg.sender;
        campaign.vendor = vendor;
        campaign.status = Status.OPEN;
        campaign.deposit = deposit1;
        campaigns[counter] = campaign;
        //deposit1=(percentToDeposit*amountRequired)/100;
        balances[msg.sender] = balances[msg.sender].sub(deposit1);
        emit CreateCampaign(campaign.id,campaign.target,campaign.deposit,campaign.createdBy,campaign.vendor);
    }


    function expireCampaign(uint campaignId, Donor[] calldata donors) public validTransition(campaignId,Status.OPEN) {
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

library SafeMath { 
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
      assert(b <= a);
      return a - b;
    }
    
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
      uint256 c = a + b;
      assert(c >= a);
      return c;
    }
}
