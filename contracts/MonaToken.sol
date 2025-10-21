// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MonaToken
 * @dev ERC20-like token for MonaAI platform governance and rewards
 */
contract MonaToken {
    string public name = "MonaAI Token";
    string public symbol = "MONA";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 rewards;
    }

    mapping(address => Stake) public stakes;
    uint256 public stakingRewardRate = 10; // 10% APY
    uint256 public totalStaked;

    // Governance
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public proposalDuration = 7 days;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**decimals;
        balanceOf[msg.sender] = totalSupply;
    }

    /**
     * @dev Transfer tokens
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev Approve spender
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Transfer from approved address
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from], "Insufficient balance");
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");
        require(_to != address(0), "Invalid address");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    /**
     * @dev Stake tokens
     */
    function stake(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");

        // If already staking, calculate and add rewards
        if (stakes[msg.sender].amount > 0) {
            uint256 reward = calculateReward(msg.sender);
            stakes[msg.sender].rewards += reward;
        }

        balanceOf[msg.sender] -= _amount;
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].startTime = block.timestamp;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake() public {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 reward = calculateReward(msg.sender) + userStake.rewards;
        uint256 total = userStake.amount + reward;

        balanceOf[msg.sender] += total;
        totalStaked -= userStake.amount;

        emit Unstaked(msg.sender, userStake.amount, reward);

        delete stakes[msg.sender];
    }

    /**
     * @dev Calculate staking rewards
     */
    function calculateReward(address _staker) public view returns (uint256) {
        Stake storage userStake = stakes[_staker];
        if (userStake.amount == 0) return 0;

        uint256 duration = block.timestamp - userStake.startTime;
        uint256 reward = (userStake.amount * stakingRewardRate * duration) / (365 days * 100);

        return reward;
    }

    /**
     * @dev Create governance proposal
     */
    function createProposal(string memory _description) public returns (uint256) {
        require(balanceOf[msg.sender] >= 100 * 10**decimals, "Need 100 MONA to propose");

        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.description = _description;
        newProposal.endTime = block.timestamp + proposalDuration;
        newProposal.executed = false;

        emit ProposalCreated(proposalCount, msg.sender, _description);

        return proposalCount;
    }

    /**
     * @dev Vote on proposal
     */
    function vote(uint256 _proposalId, bool _support) public {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(balanceOf[msg.sender] > 0 || stakes[msg.sender].amount > 0, "No voting power");

        uint256 votingPower = balanceOf[msg.sender] + stakes[msg.sender].amount;

        if (_support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }

        proposal.hasVoted[msg.sender] = true;

        emit Voted(_proposalId, msg.sender, _support, votingPower);
    }

    /**
     * @dev Get proposal results
     */
    function getProposalResults(uint256 _proposalId) public view returns (
        address proposer,
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 endTime,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.endTime,
            proposal.executed
        );
    }

    /**
     * @dev Mint new tokens (owner only)
     */
    function mint(address _to, uint256 _amount) public onlyOwner {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }
}
