//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract Donations {
    
    string public constant name = "DonateCoin";
    string public constant symbol = "DTC";
    uint8 public constant decimals = 2;  

    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
    event Transfer(address indexed from, address indexed to, uint tokens);

    mapping(address => uint256) balances;

    mapping(address => mapping (address => uint256)) allowed;
    
    uint256 totalSupply_;

    using SafeMath for uint256;


    function totalSupply() public view returns (uint256) {
	return totalSupply_;
    }
    
    function balanceOf(address tokenOwner) public view returns (uint) {
        return balances[tokenOwner];
    }

    function transfer(address receiver, uint numTokens) public returns (bool) {
        require(numTokens <= balances[msg.sender]);
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        balances[receiver] = balances[receiver].add(numTokens);
        emit Transfer(msg.sender, receiver, numTokens);
        return true;
    }

    function approve(address delegate, uint numTokens) public returns (bool) {
        allowed[msg.sender][delegate] = numTokens;
        emit Approval(msg.sender, delegate, numTokens);
        return true;
    }

    function allowance(address owner, address delegate) public view returns (uint) {
        return allowed[owner][delegate];
    }

    function transferFrom(address owner, address buyer, uint numTokens) public returns (bool) {
        require(numTokens <= balances[owner]);    
        require(numTokens <= allowed[owner][msg.sender]);
    
        balances[owner] = balances[owner].sub(numTokens);
        allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
        balances[buyer] = balances[buyer].add(numTokens);
        emit Transfer(owner, buyer, numTokens);
        return true;
    }

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

    constructor (uint256 total) {
        counter = 0;
        totalSupply_ = total;
	    balances[address(this)] = totalSupply_;
    }  

    event Transition(uint campaignId, Status status);
    event CreateCampaign(uint campaignId, uint target, uint deposit, address createdBy, address vendor);
    event Donation(uint campaignId,address from, uint numTokens);

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

    function getBalance() public payable {
        uint numTokens=20;
        transferFromContract(msg.sender,numTokens);
    }

    function transferFromContract(address receiver, uint numTokens) public payable {
        require(numTokens <= balances[address(this)]);
        balances[receiver] = balances[receiver].add(numTokens);
        balances[address(this)]=balances[address(this)].sub(numTokens);
    }

    function transferToContract(uint numTokens) public payable {
        require(numTokens <= balances[msg.sender]);
        balances[address(this)] = balances[address(this)].add(numTokens);
        balances[msg.sender]=balances[msg.sender].sub(numTokens);
    }

    function donate(uint campaignId, uint numTokens) public payable {
        Campaign storage campaign = campaigns[campaignId];
        require((campaign.fundsRaised+numTokens) <= campaign.target);
        campaign.fundsRaised += numTokens;
        transferToContract(numTokens);
        campaign.donationsHash = uint(keccak256(abi.encodePacked(campaign.donationsHash,numTokens+1,msg.sender)));
        emit Donation(campaignId,msg.sender, numTokens);
        if (campaign.fundsRaised == campaign.target){
            transferFromContract(campaign.vendor,campaign.target);
            transferFromContract(campaign.createdBy,campaign.deposit);
            closeCampaign(campaign,Status.CLOSED);
        }
    }

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
        transferToContract(deposit1);
        // balances[msg.sender] = balances[msg.sender].sub(deposit1);
        emit CreateCampaign(campaign.id,campaign.target,campaign.deposit,campaign.createdBy,campaign.vendor);
    }


    function expireCampaign(uint campaignId, Donor[] calldata donors) public validTransition(campaignId,Status.OPEN) {
        Campaign storage campaign = campaigns[campaignId];
        for (uint i=0;i<donors.length;i++){
            transferFromContract(donors[i].donorAddress,donors[i].donatedAmount);
        }
        transferFromContract(campaign.createdBy,campaign.deposit);
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