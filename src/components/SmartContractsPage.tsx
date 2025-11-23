import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const VIP_PURCHASE_URL = 'https://functions.poehali.dev/d28b5823-1cfa-4ef4-9dd8-ac4a3c2ab44c';

interface SmartContractsPageProps {
  user?: User | null;
}

const SmartContractsPage = ({ user }: SmartContractsPageProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showVipDialog, setShowVipDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  const hasActiveVip = user?.vip_until && new Date(user.vip_until) > new Date();
  const canViewFullCode = isAdmin || hasActiveVip;

  const obfuscateLine = (line: string): string => {
    const criticalKeywords = [
      'flashFee',
      'FEE_DENOMINATOR',
      'flashMint',
      'flashExpiry',
      '_burnFlash',
      'isFlashToken',
      'FlashUSDT {',
      'string public name = "Flash USDT"',
      'string public symbol = "FUSDT"',
      '_initialSupply * 10 **',
      '1000, "Fee too high"',
      'event FlashMint(address indexed to, uint256 amount, uint256 expiry)'
    ];
    
    const hasCriticalKeyword = criticalKeywords.some(keyword => line.includes(keyword));
    
    if (hasCriticalKeyword && !canViewFullCode) {
      const indent = line.match(/^\s*/)?.[0] || '';
      return indent + '████████████████████████████████████';
    }
    
    return line;
  };

  const processCode = (code: string, contractId: string): string => {
    if (contractId !== 'flash-usdt' || canViewFullCode) {
      return code;
    }
    
    const lines = code.split('\n');
    return lines.map(obfuscateLine).join('\n');
  };

  const handlePurchaseVip = async () => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо войти в систему',
        variant: 'destructive'
      });
      return;
    }

    const userBalance = Number(user.balance) || 0;
    if (userBalance < 300) {
      toast({
        title: 'Недостаточно средств',
        description: `На балансе ${userBalance.toFixed(2)} USDT. Необходимо 300 USDT`,
        variant: 'destructive'
      });
      return;
    }

    setIsPurchasing(true);
    
    try {
      const response = await fetch(VIP_PURCHASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'purchase_vip'
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...user,
          balance: data.new_balance,
          vip_until: data.vip_until
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast({
          title: '🎉 VIP статус активирован!',
          description: data.message,
          duration: 5000
        });

        setShowVipDialog(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось приобрести VIP-статус',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Purchase VIP error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось приобрести VIP-статус',
        variant: 'destructive'
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const contracts = [
    {
      id: 'flash-usdt',
      title: 'Flash USDT TRC20',
      description: 'Контракт Flash USDT для сети TRON',
      difficulty: 'Средний',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlashUSDT {
    string public name = "Flash USDT";
    string public symbol = "FUSDT";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    
    address public owner;
    uint256 public flashFee = 100; // 1% комиссия
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isFlashToken;
    mapping(address => uint256) public flashExpiry;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event FlashMint(address indexed to, uint256 amount, uint256 expiry);
    event FlashBurn(address indexed from, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        if (isFlashToken[msg.sender] && block.timestamp > flashExpiry[msg.sender]) {
            _burnFlash(msg.sender);
            return false;
        }
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        if (isFlashToken[msg.sender]) {
            isFlashToken[_to] = true;
            flashExpiry[_to] = flashExpiry[msg.sender];
        }
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Invalid address");
        require(_value <= balanceOf[_from], "Insufficient balance");
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");
        
        if (isFlashToken[_from] && block.timestamp > flashExpiry[_from]) {
            _burnFlash(_from);
            return false;
        }
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        if (isFlashToken[_from]) {
            isFlashToken[_to] = true;
            flashExpiry[_to] = flashExpiry[_from];
        }
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function flashMint(address _to, uint256 _amount, uint256 _duration) public onlyOwner returns (bool) {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        uint256 fee = (_amount * flashFee) / FEE_DENOMINATOR;
        uint256 mintAmount = _amount - fee;
        
        balanceOf[_to] += mintAmount;
        balanceOf[owner] += fee;
        totalSupply += _amount;
        
        isFlashToken[_to] = true;
        flashExpiry[_to] = block.timestamp + _duration;
        
        emit FlashMint(_to, mintAmount, flashExpiry[_to]);
        emit Transfer(address(0), _to, mintAmount);
        emit Transfer(address(0), owner, fee);
        
        return true;
    }
    
    function burnFlash(address _account) public onlyOwner returns (bool) {
        return _burnFlash(_account);
    }
    
    function _burnFlash(address _account) private returns (bool) {
        require(isFlashToken[_account], "Not a flash token holder");
        
        uint256 amount = balanceOf[_account];
        if (amount > 0) {
            balanceOf[_account] = 0;
            totalSupply -= amount;
            emit FlashBurn(_account, amount);
            emit Transfer(_account, address(0), amount);
        }
        
        isFlashToken[_account] = false;
        flashExpiry[_account] = 0;
        
        return true;
    }
    
    function setFlashFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Максимум 10%
        flashFee = _newFee;
    }
    
    function checkFlashStatus(address _account) public view returns (bool isFlash, uint256 expiry, bool isExpired) {
        isFlash = isFlashToken[_account];
        expiry = flashExpiry[_account];
        isExpired = isFlash && block.timestamp > expiry;
    }
}`
    },
    {
      id: 'erc20',
      title: 'ERC-20 Token',
      description: 'Стандартный токен на Ethereum',
      difficulty: 'Начальный',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20Token {
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balanceOf[_from], "Insufficient balance");
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}`
    },
    {
      id: 'multisig',
      title: 'Multi-Signature Wallet',
      description: 'Кошелёк с множественными подписями',
      difficulty: 'Средний',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount);
    event Submit(uint indexed txId);
    event Approve(address indexed owner, uint indexed txId);
    event Revoke(address indexed owner, uint indexed txId);
    event Execute(uint indexed txId);

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approved;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txId) {
        require(_txId < transactions.length, "tx does not exist");
        _;
    }

    modifier notApproved(uint _txId) {
        require(!approved[_txId][msg.sender], "tx already approved");
        _;
    }

    modifier notExecuted(uint _txId) {
        require(!transactions[_txId].executed, "tx already executed");
        _;
    }

    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "owners required");
        require(_required > 0 && _required <= _owners.length, "invalid required number");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner is not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address _to, uint _value, bytes calldata _data) external onlyOwner {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        }));
        emit Submit(transactions.length - 1);
    }

    function approve(uint _txId) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        approved[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    function getApprovalCount(uint _txId) private view returns (uint count) {
        for (uint i = 0; i < owners.length; i++) {
            if (approved[_txId][owners[i]]) {
                count += 1;
            }
        }
    }

    function execute(uint _txId) external txExists(_txId) notExecuted(_txId) {
        require(getApprovalCount(_txId) >= required, "approvals < required");
        Transaction storage transaction = transactions[_txId];
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        emit Execute(_txId);
    }

    function revoke(uint _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        require(approved[_txId][msg.sender], "tx not approved");
        approved[_txId][msg.sender] = false;
        emit Revoke(msg.sender, _txId);
    }
}`
    },
    {
      id: 'nft',
      title: 'NFT (ERC-721)',
      description: 'Контракт для создания NFT',
      difficulty: 'Начальный',
      code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleNFT {
    string public name = "MyNFT";
    string public symbol = "MNFT";
    
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(uint256 => string) private _tokenURIs;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Invalid address");
        return _balances[owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    function mint(address to, string memory uri) public returns (uint256) {
        require(to != address(0), "Invalid address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _balances[to]++;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = uri;
        
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }
    
    function transfer(address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(to != address(0), "Invalid address");
        
        _balances[msg.sender]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        emit Transfer(msg.sender, to, tokenId);
    }
    
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner, "Not token owner");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }
}`
    }
  ];

  const guide = [
    {
      title: '1. Основы Solidity',
      content: 'Solidity — это объектно-ориентированный язык программирования для написания смарт-контрактов на блокчейне Ethereum и других совместимых платформах.',
      points: [
        'Статическая типизация',
        'Поддержка наследования',
        'Библиотеки и интерфейсы',
        'Модификаторы доступа'
      ]
    },
    {
      title: '2. Структура контракта',
      content: 'Каждый смарт-контракт начинается с указания лицензии и версии компилятора:',
      points: [
        '// SPDX-License-Identifier: MIT',
        'pragma solidity ^0.8.0;',
        'contract MyContract { ... }',
        'Переменные состояния, функции, модификаторы'
      ]
    },
    {
      title: '3. Типы данных',
      content: 'Solidity поддерживает различные типы данных:',
      points: [
        'uint / int - целые числа',
        'address - адреса Ethereum',
        'bool - логический тип',
        'string / bytes - строки и байты',
        'mapping - ассоциативные массивы',
        'struct - пользовательские структуры'
      ]
    },
    {
      title: '4. Функции и модификаторы',
      content: 'Функции определяют логику контракта:',
      points: [
        'function name() public view returns (type)',
        'Видимость: public, private, internal, external',
        'Модификаторы: view, pure, payable',
        'Кастомные модификаторы для проверок'
      ]
    },
    {
      title: '5. События (Events)',
      content: 'События позволяют логировать действия в блокчейне:',
      points: [
        'event Transfer(address indexed from, address indexed to, uint256 value);',
        'emit Transfer(msg.sender, recipient, amount);',
        'Используются для отслеживания транзакций',
        'Индексированные параметры для фильтрации'
      ]
    },
    {
      title: '6. Безопасность',
      content: 'Важные принципы безопасности при написании контрактов:',
      points: [
        'Checks-Effects-Interactions паттерн',
        'Защита от reentrancy атак',
        'Проверка переполнения (overflow/underflow)',
        'Валидация входных данных',
        'Использование OpenZeppelin библиотек'
      ]
    },
    {
      title: '7. Развёртывание',
      content: 'Процесс деплоя контракта в блокчейн:',
      points: [
        'Компиляция с помощью Remix, Hardhat или Truffle',
        'Подключение к сети (mainnet, testnet)',
        'Оплата газа за развёртывание',
        'Верификация кода на Etherscan',
        'Тестирование перед mainnet'
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Заголовок */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-600/10 border border-blue-500/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon name="FileCode" size={24} className="text-white sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Смарт-контракты Solidity</h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">
                Полное руководство и готовые примеры для разработки
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Руководство */}
      <Card className="p-4 sm:p-5 md:p-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 sm:gap-3">
          <Icon name="BookOpen" size={20} className="text-primary sm:w-6 sm:h-6 md:w-7 md:h-7" />
          Руководство по Solidity
        </h2>
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {guide.map((section, index) => (
            <div key={index} className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-primary">{section.title}</h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{section.content}</p>
              <ul className="space-y-1.5 sm:space-y-2 ml-3 sm:ml-4">
                {section.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 sm:gap-2">
                    <Icon name="ChevronRight" size={14} className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Примеры контрактов */}
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
          <Icon name="Code" size={20} className="text-primary sm:w-6 sm:h-6 md:w-7 md:h-7" />
          Примеры контрактов
        </h2>
        <div className="grid gap-4 sm:gap-5 md:gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">{contract.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{contract.description}</p>
                  <span className={`inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                    contract.difficulty === 'Начальный' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {contract.difficulty}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCode(processCode(contract.code, contract.id), contract.id)}
                  className="gap-1.5 sm:gap-2 w-full sm:w-auto text-xs sm:text-sm"
                  disabled={contract.id === 'flash-usdt' && !canViewFullCode}
                >
                  <Icon name={copiedCode === contract.id ? "Check" : contract.id === 'flash-usdt' && !canViewFullCode ? "Lock" : "Copy"} size={14} className="sm:w-4 sm:h-4" />
                  {copiedCode === contract.id ? 'Скопировано' : contract.id === 'flash-usdt' && !canViewFullCode ? 'Ограничено' : 'Копировать'}
                </Button>
              </div>

              <div className="relative">
                {contract.id === 'flash-usdt' && !canViewFullCode && (
                  <div className="mb-3 p-3 sm:p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Icon name="Lock" size={20} className="text-orange-400 flex-shrink-0 mt-0.5 sm:w-6 sm:h-6" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-orange-400 mb-1 text-sm sm:text-base">🔒 Ограниченный доступ</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">Некоторые критические части кода скрыты.</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Icon name="Crown" size={16} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-foreground mb-0.5">Для полного просмотра кода</p>
                          <p className="text-xs text-muted-foreground">Приобретите привилегию VIP</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setShowVipDialog(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Icon name="Crown" size={14} className="mr-1.5" />
                        VIP
                      </Button>
                    </div>
                  </div>
                )}
                <div className="bg-slate-950 rounded-lg sm:rounded-xl overflow-hidden border border-slate-800">
                  <pre className="text-slate-100 p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
                    <code className="block">{processCode(contract.code, contract.id)}</code>
                  </pre>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Полезные ресурсы */}
      <Card className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
          <Icon name="ExternalLink" size={20} className="text-primary sm:w-6 sm:h-6 md:w-7 md:h-7" />
          Полезные ресурсы
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { name: 'Solidity Documentation', url: 'https://docs.soliditylang.org/', icon: 'Book' },
            { name: 'OpenZeppelin Contracts', url: 'https://docs.openzeppelin.com/contracts/', icon: 'Shield' },
            { name: 'Remix IDE', url: 'https://remix.ethereum.org/', icon: 'Code' },
            { name: 'Etherscan', url: 'https://etherscan.io/', icon: 'Search' },
          ].map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all active:scale-[0.98] sm:hover:scale-[1.02]"
            >
              <Icon name={resource.icon as any} size={20} className="text-primary flex-shrink-0 sm:w-6 sm:h-6" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm truncate">{resource.name}</div>
                <div className="text-xs text-muted-foreground truncate">{resource.url}</div>
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* VIP Purchase Dialog */}
      <Dialog open={showVipDialog} onOpenChange={setShowVipDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md animate-scale-in">
          <DialogHeader>
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Icon name="Crown" size={32} className="text-white sm:w-10 sm:h-10" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl sm:text-2xl">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent font-bold">
                VIP Привилегия
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg sm:rounded-xl">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">Стоимость:</span>
                <span className="text-xl sm:text-2xl font-bold text-foreground">300 USDT</span>
              </div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">Срок действия:</span>
                <span className="text-xs sm:text-sm font-semibold text-foreground">30 дней</span>
              </div>
              {user && (
                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
                  <span className="text-xs sm:text-sm text-muted-foreground">Ваш баланс:</span>
                  <span className="text-xs sm:text-sm font-semibold">{Number(user.balance || 0).toFixed(2)} USDT</span>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Icon name="Sparkles" size={16} className="text-amber-500 sm:w-[18px] sm:h-[18px]" />
                Преимущества VIP:
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {[
                  'Полный доступ к коду Flash USDT контракта',
                  'Возможность копировать критические части',
                  'Доступ к будущим премиум-контрактам',
                  'Приоритетная поддержка'
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Icon name="Check" size={14} className="text-green-500 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 sm:pt-4 space-y-2">
              <Button
                onClick={handlePurchaseVip}
                disabled={isPurchasing || !user || Number(user.balance || 0) < 300}
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm sm:text-base shadow-lg"
              >
                {isPurchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="Crown" size={18} className="mr-2 sm:w-5 sm:h-5" />
                    Купить VIP за 300 USDT
                  </>
                )}
              </Button>
              {user && Number(user.balance || 0) < 300 && (
                <p className="text-xs text-center text-muted-foreground">
                  Недостаточно средств. Пополните баланс на {(300 - Number(user.balance || 0)).toFixed(2)} USDT
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartContractsPage;