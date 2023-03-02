import {
  ContractCallContext, ContractCallResults, Multicall
} from 'ethereum-multicall';
import { ethers } from 'ethers';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { FaSync } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import poolContract from './poolcontract.json';



// NFT pool factory address: 0xb67dc4B5A296C3068E8eEc16f02CdaE4c9A255e5
// Test NFT collection address: 0xd4307e0acd12cf46fd6cf93bc264f5d5d1598792

export const getExistingPools = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });

  const nftPoolFactory = new ethers.Contract(poolContract.factoryContract.address, poolContract.factoryContract.abi, provider);
  const poolLength = (await nftPoolFactory.allPoolsLength()).toNumber()

  const pools = [];
  for (let i = 0; i < poolLength; i++) pools.push(i);

  const contractCallContext = [];
  pools.map((pool) => {
    contractCallContext.push({
      reference: `${pool}`,
      contractAddress: poolContract.factoryContract.address,
      abi: poolContract.factoryContract.abi,
      calls: [{ reference: `pool${pool}`, methodName: 'allPools', methodParameters: [pool] }]
    })
  })

  try{
    const callResults = (await multicall.call(contractCallContext)).results;
    const newPool = (Object.keys(callResults).map((key) => callResults[key])).map(e => e.callsReturnContext[0].returnValues[0])
    return newPool
  }catch(err){
    console.log(err);
  }

}

const ExistingPools = ({connectedAddress}) => {
  const [poolsDetail, setPoolsDetail] = useState(null)
  const [userSelected, setUserSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const depositInputText = useRef(null);
  const withdrawInputText = useRef(null);
  const swapInInputText = useRef(null);
  const swapOutInputText = useRef(null);
  const buttonStyle = 'right-0 top-0 h-full px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none';
  const hoverEffect = 'hover:transform hover:-translate-y-2 transition duration-300 hover:opacity-80 hover:cursor-pointer'

  useEffect(() => {
    const poolsDetail = JSON.parse(localStorage.getItem('poolsDetail'));
    if (poolsDetail) setPoolsDetail(poolsDetail);   
  }, []);

  useEffect(() => {
    localStorage.setItem('poolsDetail', JSON.stringify(poolsDetail))
  }, [poolsDetail])
  

  const handleGetExistingPoolsDetail = async(existingPools)=> {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });;
    const contractCallContext = [];

    existingPools.map((pool) => {
      contractCallContext.push({
        reference: `${pool}`,
        contractAddress: pool,
        abi: poolContract.poolContract.abi,
        calls: [
          { reference: `${pool}`, methodName: 'name', methodParameters: [] }, 
          { reference: `${pool}`, methodName: 'symbol', methodParameters: [] }, 
          { reference: `${pool}`, methodName: 'asset', methodParameters: [] }, 
          { reference: `${pool}`, methodName: 'holdingsLength', methodParameters: [] },
          { reference: `${pool}`, methodName: 'balanceOf', methodParameters: [connectedAddress] },
          { reference: `${pool}`, methodName: 'decimals', methodParameters: [] },
          { reference: `${pool}`, methodName: 'allowance', methodParameters: [connectedAddress,pool] },
        ]
      })
    })

    try {
      const callResults = (await multicall.call(contractCallContext)).results;
      const poolDetail = (Object.keys(callResults).map((key) => callResults[key])).map(e => {
        const poolTokenDecimals = (ethers.BigNumber.from(e.callsReturnContext[5].returnValues[0]))
        const poolTokenWalletBalance = ethers.utils.formatUnits((ethers.BigNumber.from(e.callsReturnContext[4].returnValues[0].hex)).toString(),poolTokenDecimals)
        const poolTokenApproved = ethers.utils.formatUnits((ethers.BigNumber.from(e.callsReturnContext[6].returnValues[0].hex)).toString(),poolTokenDecimals)>1

        return {
          name: e.callsReturnContext[0].returnValues[0],
          symbol: e.callsReturnContext[1].returnValues[0], 
          poolAddress: e.callsReturnContext[0].reference,
          collectionAddress: e.callsReturnContext[2].returnValues[0],
          holdingsLength: (ethers.BigNumber.from(e.callsReturnContext[3].returnValues[0].hex)).toNumber(),
          poolTokenWalletBalance,
          poolTokenDecimals,
          poolTokenApproved,
          poolTokens:[],
          walletTokens:[],
        }
      })

      const contractCallContextURI = poolDetail.map(e => {
        return {
          reference: `${e.collectionAddress}`,
          contractAddress: e.collectionAddress,
          abi: poolContract.erc721.abi,
          calls: [
            { reference: `${e.collectionAddress}`, methodName: 'tokenURI', methodParameters: [1] },
            { reference: `${e.collectionAddress}`, methodName: 'name', methodParameters: [] },
            { reference: `${e.collectionAddress}`, methodName: 'balanceOf', methodParameters: [connectedAddress] },
            { reference: `${e.collectionAddress}`, methodName: 'isApprovedForAll', methodParameters: [connectedAddress,e.poolAddress] },
            { reference: `${e.collectionAddress}`, methodName: 'isApprovedForAll', methodParameters: [connectedAddress,poolContract.swapContract.address] }
          ]
        }
      });

      const callResultsURI = (await multicall.call(contractCallContextURI)).results;
      const poolDetailwithURI = (Object.keys(callResultsURI).map((key) => callResultsURI[key])).map((e, i) => {
        const tokenURI = e.callsReturnContext[0].returnValues[0]
        const collectionName = e.callsReturnContext[1].returnValues[0]
        const nftTokenWalletBalance = (ethers.BigNumber.from(e.callsReturnContext[2].returnValues[0].hex)).toNumber()
        const isDepositApproved = e.callsReturnContext[3].returnValues[0]
        const isSwapApproved = e.callsReturnContext[4].returnValues[0]
        return { ...poolDetail[i], tokenURI, collectionName,uuid:uuidv4(),isDepositApproved,isSwapApproved,nftTokenWalletBalance}
      })

      return poolDetailwithURI
    } catch (err) {
      console.log(err);
    }


  }

  const handleGetExistingPools = async()=> {
    setIsLoading(true)
   
    try {
      const newPool = await getExistingPools()
      setUserSelected(null)
      const poolDetail = await handleGetExistingPoolsDetail(newPool)
      // console.log(poolDetail);
      setPoolsDetail(poolDetail)
      
    } catch (err) {
      console.log(err);
      setIsLoading(false)
    }

    setIsLoading(false)

  }

  const getNftBalance = async (nftCollection,walletAddress) => {
    const request_url = `/api/getWalletNft?walletAddress=${walletAddress}&nftCollection=${nftCollection}`
    const response = await fetch(request_url);
    const data = await response.json();
    return data;
  }

  const getPoolTokenBalance = async (poolAddress,walletAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });;
    const contractCallContext = [{
      reference: poolAddress,
      contractAddress: poolAddress,
      abi: poolContract.poolContract.abi,
      calls: [
        { reference: poolAddress, methodName: 'balanceOf', methodParameters: [connectedAddress] },
        { reference: poolAddress, methodName: 'decimals', methodParameters: [] },
      ]
    }];

    try{
      const callResults = (await multicall.call(contractCallContext)).results;
      const poolTokenBalance = (Object.keys(callResults).map((key) => callResults[key])).map(e => {
        const poolTokenDecimals = (ethers.BigNumber.from(e.callsReturnContext[1].returnValues[0]))
        const balance = ethers.utils.formatUnits((ethers.BigNumber.from(e.callsReturnContext[0].returnValues[0].hex)).toString(),poolTokenDecimals)
        return balance
      })

      return poolTokenBalance[0]

    }catch(err){
      console.log(err);
    }
  }

  const handleGetWalletAndPoolBalance = async (nftCollection,walletAddress,poolAddress) => {
    setIsLoading(true)
    const walletBalance = await getNftBalance(nftCollection,walletAddress);
    const poolBalance = await getNftBalance(nftCollection,poolAddress);
    const poolTokenWalletBalance = await getPoolTokenBalance(poolAddress,walletAddress)

    const poolTokens = poolBalance.tokens
    const walletTokens = walletBalance.tokens
    setPoolsDetail(prev=>prev.map((pool)=>{
      if(pool.poolAddress===poolAddress){
        const newPoolDetail = {...pool,poolTokens,walletTokens,poolTokenWalletBalance,isUpdated:true}
        return newPoolDetail
      }
      return pool
    }))
    setIsLoading(false)
    return {walletBalance,poolBalance}
  }


  const handleSelectPool = (pool) => {
    setUserSelected({id:pool.uuid,activePool:pool.poolAddress});
  };

  const handleDepositSection = (pool) => {
    setUserSelected({id:pool.uuid,activePool:pool.poolAddress,depositClicked:true})
  }

  const handleWithdrawSection = (pool) => {
    setUserSelected({id:pool.uuid,activePool:pool.poolAddress,withdrawClicked:true})
  }

  const handleSwapSection = (pool) => {
    setUserSelected({id:pool.uuid,activePool:pool.poolAddress,swapClicked:true})
  }

  const handleApproveDeposit = async(pool) => {
    
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftCollectionContract = new ethers.Contract(pool.collectionAddress, poolContract.erc721.abi, signer);
      const tx = await nftCollectionContract.setApprovalForAll(pool.poolAddress, true);
      const receipt = await tx.wait();
      
      // Update setPooldetail state to set isDepositApproved to true
      const newPoolDetail = poolsDetail.map(e=>{
        if(e.poolAddress===pool.poolAddress){
          return {...e,isDepositApproved:true}
        }else{
          return e;
        }
      })
      setPoolsDetail(newPoolDetail);

    }catch(err){
      console.log(err);
    }
  }

  const handleApproveSwap = async(pool) => {
    
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftCollectionContract = new ethers.Contract(pool.collectionAddress, poolContract.erc721.abi, signer);
      const tx = await nftCollectionContract.setApprovalForAll(poolContract.swapContract.address, true);
      const receipt = await tx.wait();

      // Update setPooldetail state to set isSwapApproved to true
      const newPoolDetail = poolsDetail.map(e=>{
        if(e.poolAddress===pool.poolAddress){
          return {...e,isSwapApproved:true}
        }else{
          return e;
        }
      })
      setPoolsDetail(newPoolDetail);

    }catch(err){
      console.log(err);
    }
  }

  const handleApprovePoolToken = async(pool) => {
      
      try{
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const poolTokenContract = new ethers.Contract(pool.poolAddress, poolContract.poolContract.abi, signer);
        const tx = await poolTokenContract.approve(pool.poolAddress, ethers.constants.MaxUint256);
        const receipt = await tx.wait();

        // Update setPooldetail state to set poolTokenApproved to true
        const newPoolDetail = poolsDetail.map(e=>{
          if(e.poolAddress===pool.poolAddress){
            return {...e,poolTokenApproved:true}
          }else{
            return e;
          }
        })
        setPoolsDetail(newPoolDetail);
        

      }catch(err){
        console.log(err);
      }
  }

  const handleDepositNFT = async(pool) => {
    try{
      const nftID = (depositInputText.current.value).split(',').map(e=>{
        const num = Number(e)
        return Number.isInteger(num)?num:''
      }).filter(e=>e!=='');
      
      if(nftID.length===0) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftPoolContract = new ethers.Contract(pool.poolAddress, poolContract.poolContract.abi, signer);
      const tx = await nftPoolContract.deposit(nftID);
      const receipt = await tx.wait();
      alert("NFT deposited, refresh wallet to see the changes")
    }catch(err){
      console.log(err);
      if(err.message==="Internal JSON-RPC error."){
        alert("Metamask Error: Please make sure you enter the correct NFT id (check nft id available in your wallet) and try again")
      }
    }
  }

  const handleWithdrawNFT = async(pool) => {
    try{
      const nftID = (withdrawInputText.current.value).split(',').map(e=>{
        const num = Number(e)
        return Number.isInteger(num)?num:''
      }).filter(e=>e!=='');
      
      if(nftID.length===0) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftPoolContract = new ethers.Contract(pool.poolAddress, poolContract.poolContract.abi, signer);
      const tx = await nftPoolContract.withdraw(nftID);
      const receipt = await tx.wait();
      alert("NFT withdrawed, refresh wallet to see the changes")
    }catch(err){
      console.log(err);
      if(err.message==="Internal JSON-RPC error."){
        alert("Metamask Error: Please make sure you have enough pool token/enter the correct NFT id (check nft id available in the pool) and try again")
      }
      
    }
  }

  const handleSwapNFT = async (pool) => {
    const {collectionAddress} = pool
    const swapOutIds = (swapOutInputText.current.value).split(',').map(e=>{
      const num = Number(e)
      return Number.isInteger(num)?num:''
    }).filter(e=>e!=='');
    const swapInIds = (swapInInputText.current.value).split(',').map(e=>{
      const num = Number(e)
      return Number.isInteger(num)?num:''
    }).filter(e=>e!=='');
    if(swapOutIds.length===0 || swapInIds.length===0) {
      alert("Invalid NFT id input")
      return;
    };
    
    try{
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftSwapContract = new ethers.Contract(poolContract.swapContract.address, poolContract.swapContract.abi, signer);

      const tx = await nftSwapContract.swapTokens(collectionAddress,swapOutIds,swapInIds);
      const receipt = await tx.wait();
      alert("NFT swapped, refresh wallet to see the changes")
    }catch(err){
      console.log(err);
      if(err.message==="Internal JSON-RPC error."){
        alert("Metamask Error: Please make sure you input the correct NFT ids and try again")
      }
      
    }
    
    
  }

  const handleInputClear = ()=>{
    if(withdrawInputText.current){
      withdrawInputText.current.value = '';
    }
    if(depositInputText.current){
      depositInputText.current.value = '';
    }

    if(swapOutInputText.current){
      swapOutInputText.current.value = '';
    }

    if(swapInInputText.current){
      swapInInputText.current.value = '';
    }
    
  }

  const handleAddSelected = (id,type)=>{
    if(type==='deposit'&&depositInputText.current){
      const currentDepositValue = depositInputText.current.value;
      if(currentDepositValue.split(',').includes(id)) return;
      const newValue = currentDepositValue===''?`${id}`:`,${id}`
      depositInputText.current.value = currentDepositValue + newValue;
    }

    if(type==='withdraw'&&withdrawInputText.current){
      const currentWithdrawValue = withdrawInputText.current.value;
      if(currentWithdrawValue.split(',').includes(id)) return;
      const newValue = currentWithdrawValue===''?`${id}`:`,${id}`
      withdrawInputText.current.value = currentWithdrawValue + newValue;
    }

    if(type==='swapOut'&&swapOutInputText.current){
      swapOutInputText.current.value = `${id}`
    }

    if(type==='swapIn'&&swapInInputText.current){
      swapInInputText.current.value = `${id}`
    }
    
  }

  const displayNFTGrid = (pool,type)=>{
    if(!pool.isUpdated){
      return (<div>
        Click load to get NFTs
      </div>)
    }

    if(type==='deposit'){
      return (pool.walletTokens.length>0?
        <div className="my-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[50vh] overflow-y-scroll">
        {pool.walletTokens.map((token, index) => (
          <div onClick={()=>handleAddSelected(token.id,'deposit')} key={`${pool.uuid}-${token.id}`} className={`relative ${hoverEffect}`}>
            <div className='relative'>
            <Image
              src={`${token.thumbnail}`}
              alt={`${pool.collectionName} ${token.id}`}
              width={200}
              height={200}
              className="w-full h-full object-cover rounded-lg"
            />
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black bg-opacity-50 rounded-b-lg">
              <p className="text-white text-sm font-medium">{`${pool.collectionName} #${token.id}`}</p>
            </div>
          </div>
        ))}
      </div>
      :<p>No NFT found in your wallet</p>)
    }else if(type==='withdraw'){
      return (pool.poolTokens.length>0?
        <div className="my-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[50vh] overflow-y-scroll">
        {pool.poolTokens.map((token, index) => (
          <div onClick={()=>handleAddSelected(token.id,'withdraw')} key={`${pool.uuid}-${token.id}`} className={`relative ${hoverEffect}`}>
            <div className='relative'>
            <Image
              src={`${token.thumbnail}`}
              alt={`${pool.collectionName} ${token.id}`}
              width={200}
              height={200}
              className="w-full h-full object-cover rounded-lg"
            />
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black bg-opacity-50 rounded-b-lg">
              <p className="text-white text-sm font-medium">{`${pool.collectionName} #${token.id}`}</p>
            </div>
          </div>
        ))}
      </div>
      :<p>No NFT found in the pool</p>)
    }else if(type==='swap'){
      return (
        <div>
          {pool.nftTokenWalletBalance>0?<h3>{`${pool.nftTokenWalletBalance} ${pool.collectionName}`} you have</h3>:<h3>You don&apos;t have any {`${pool.collectionName}`}</h3>}
          {pool.walletTokens.length>0?
            <div className="my-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[50vh] overflow-y-scroll">
            {pool.walletTokens.map((token, index) => (
              <div onClick={()=>handleAddSelected(token.id,'swapOut')} key={`${pool.uuid}-${token.id}`} className={`relative ${hoverEffect}`}>
                <div className='relative'>
                <Image
                  src={`${token.thumbnail}`}
                  alt={`${pool.collectionName} ${token.id}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover rounded-lg"
                />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black bg-opacity-50 rounded-b-lg">
                  <p className="text-white text-sm font-medium">{`${pool.collectionName} #${token.id}`}</p>
                </div>
              </div>
            ))}
          </div>
          :<p>No NFT found in your wallet</p>}
          {pool.holdingsLength>0?<h3>{`${pool.holdingsLength} ${pool.collectionName}`} in the pool</h3>:<h3>This pool don&apos;t have any {`${pool.collectionName}`}</h3>}
          

          {(pool.poolTokens.length>0?
            <div className="my-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[50vh] overflow-y-scroll">
            {pool.poolTokens.map((token, index) => (
              <div onClick={()=>handleAddSelected(token.id,'swapIn')} key={`${pool.uuid}-${token.id}`} className={`relative ${hoverEffect}`}>
                <div className='relative'>
                <Image
                  src={`${token.thumbnail}`}
                  alt={`${pool.collectionName} ${token.id}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover rounded-lg"
                />
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black bg-opacity-50 rounded-b-lg">
                  <p className="text-white text-sm font-medium">{`${pool.collectionName} #${token.id}`}</p>
                </div>
              </div>
            ))}
          </div>
          :<p>No NFT found in the pool</p>)}
        </div>
      )
    }
    
            
  }

  const DepositInput = (pool)=>{
    pool = pool.pool
    return (
    <div className="py-2 px-4 bg-gray-200">
      <div className='flex justify-between'>
        <h2 className="text-3xl py-2">Deposit NFT </h2>
        <p className="text-3xl py-2">You have {Number(pool.nftTokenWalletBalance)} {pool.collectionName} </p>
      </div>
      {pool.nftTokenWalletBalance>=0?
      <div>
        <div>
        {pool.isDepositApproved?
        <div className="flex flex-row items-center space-x-4">
          <label> ID:</label>
          <input type="text" ref={depositInputText} placeholder="Enter NFT ID (use comma to separate multiple IDs)" className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
          <button className={`${buttonStyle}`} onClick={handleInputClear}>Clear</button>
          <button className={`${buttonStyle}`} onClick={()=>handleDepositNFT(pool)}>Deposit</button>
        </div>
        :
        null
        }

          <div className='flex justify-between my-2'>
              <button className={`${buttonStyle} w-2/5`} onClick={()=>handleGetWalletAndPoolBalance(pool.collectionAddress,connectedAddress,pool.poolAddress)}>
                    {pool.poolTokens.length===0?'Get':'Refresh'} wallet
              </button>
            {pool.isDepositApproved?
                <button className={`${buttonStyle} opacity-30 w-2/5`}>
                  Deposit Approved
                </button>
                :
                <button className={`${buttonStyle} w-2/5`} onClick={()=>handleApproveDeposit(pool)}>
                  Approve Deposit
                </button>
            }
          </div>
              {displayNFTGrid(pool,'deposit')}
        </div>
      </div>:
      <div>
        <p>You don&apos;t have any NFTs in this collection</p>
      </div>
        }
    </div>)
  }

  const WithdrawInput = (pool)=>{
    pool = pool.pool
    return (
    <div className="py-2 px-4 bg-gray-200">
      <div className='flex justify-between'>
        <h2 className="text-3xl py-2">Withdraw NFT </h2>
        <p className="text-xl py-2">Wallet Balance: {Number(pool.poolTokenWalletBalance).toFixed(4)} {pool.symbol} <br/> (can withdraw {Math.floor(Number(pool.poolTokenWalletBalance))} {pool.collectionName}) </p>
      </div>

      {pool.holdingsLength>=0?
      <div>
        <div>
          {pool.poolTokenApproved?
            <div className="flex flex-row items-center space-x-4">
              <label> ID:</label>
              <input type="text" ref={withdrawInputText} placeholder="Enter NFT ID (use comma to separate multiple IDs)" className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
              <button className={`${buttonStyle}`} onClick={handleInputClear}>Clear</button>
              <button className={`${buttonStyle}`} onClick={()=>handleWithdrawNFT(pool)}>Withdraw</button>
            </div>
            :
            null
          }
          
          <div className='flex justify-between my-2'>
          <button className={`${buttonStyle} w-2/5 my-2`} onClick={()=>handleGetWalletAndPoolBalance(pool.collectionAddress,connectedAddress,pool.poolAddress)}>
            {pool.poolTokens.length===0?'Get':'Refresh'} {pool.collectionName} pool
          </button>
            {pool.poolTokenApproved?
                <button className={`${buttonStyle} opacity-30 w-2/5`}>
                  Token Approved
                </button>
                :
                <button className={`${buttonStyle} w-2/5`} onClick={()=>handleApprovePoolToken(pool)}>
                  Approve Token
                </button>
            }
          </div>
              {displayNFTGrid(pool,'withdraw')}
        </div>
      </div>:
      <div>
        <p>This pool doesn&apos;t contain any NFT</p>
      </div>
      }
       
       
       
    </div>)
  }

  const SwapInput = (pool)=>{

    pool = pool.pool
    return (
    <div className="py-2 px-4 bg-gray-200">
       <div className='flex justify-between'>
          <h2 className="text-3xl py-2">Swap NFT </h2>
          <p className="text-xl py-2">Wallet Balance: {Number(pool.poolTokenWalletBalance).toFixed(4)} {pool.symbol} <br/> (can withdraw {Math.floor(Number(pool.poolTokenWalletBalance))} {pool.collectionName}) </p>
        </div>

       <div>
          {pool.isSwapApproved?
          <div className="flex flex-row items-center space-x-4 my-5">
            <label> Out:</label>
            <input type="text" ref={swapOutInputText} placeholder="Enter the ID you wish to send out" className="w-1/3 px-4 py-2 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
            <label> In:</label>
            <input type="text" ref={swapInInputText} placeholder="Enter the ID you wish to receive" className="w-1/3 px-4 py-2 text-gray-700 bg-white border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:border-blue-500" />
            <button className={`${buttonStyle}`} onClick={handleInputClear}>Clear</button>
            <button className={`${buttonStyle}`} onClick={()=>handleSwapNFT(pool)}>Swap</button>
          </div>
          :
          null}
          
          
          <div className='flex justify-between my-2'>
            <button className={`${buttonStyle} w-2/5`} onClick={()=>handleGetWalletAndPoolBalance(pool.collectionAddress,connectedAddress,pool.poolAddress)}>
                {pool.poolTokens.length===0?'Get':'Refresh'} {pool.collectionName} pool
            </button>
            {pool.isSwapApproved?
                <button className={`${buttonStyle} opacity-30 w-2/5`}>
                  Swap Approved
                </button>
                :
                <button className={`${buttonStyle} w-2/5`} onClick={()=>handleApproveSwap(pool)}>
                  Approve Swap
                </button> 
            }     
            
          </div>
            {displayNFTGrid(pool,'swap')}
        </div>
    </div>)
  }

  
  
  
  return (
    <div className='py-5'>
      {connectedAddress ?
        <div className="mx-auto w-90/100 bg-white shadow-lg rounded-lg p-4 ">
          
          <div className="relative flex justify-between">
            <h1 className='text-3xl font-bold mb-4'>Existing NFT Pools </h1>
            {isLoading?<FaSync className="animate-spin text-black text-3xl" />:
            <button onClick={handleGetExistingPools} className='right-0 top-0 h-full px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none'>{poolsDetail?.length>0?`Total pools: ${poolsDetail?.length} (Click to reload)`:'Get existing pools'}</button>
            }
          </div>
          <div className='overflow-y-scroll py-2 max-h-[85vh]'>
            {poolsDetail?.length>0 ? poolsDetail.map((pool) => {
              return (
                <div key={pool.uuid}> 
                  <div className={`flex flex-col mx-auto w-full shadow-lg rounded-lg my-4 ${userSelected?.id===pool.uuid?'bg-gray-300':'bg-white'}`} >
                    <div className="px-8 py-4 flex flex-col items-center sm:flex-row sm:items-start sm:justify-between">
                      <div className="relative w-full sm:w-auto mb-4 sm:mb-0">
                        <a href={`https://opensea.io/${pool.poolAddress}`} target="_blank" rel="noopener noreferrer">
                          <div className='relative'>
                          <Image 
                          className="w-24 h-24 rounded-lg object-cover mx-auto sm:mx-0" 
                          width={200}
                          height={200}
                          src={`/api/getCollectionImage?nftCollection=${pool.collectionAddress}&id=1&thumbnail=true`} 
                          alt={pool.collectionName} 
                          title={`Visit ${pool.collectionName} pool`} />
                          </div>
                        </a>
                      </div>
                      
                      <div className="text-center sm:text-left sm:pl-4">
                        <a href={`https://opensea.io/${pool.poolAddress}`} target="_blank" rel="noopener noreferrer">
                          <h1 className="text-2xl font-bold text-gray-800 hover:text-blue-500">{pool.name} </h1>
                        </a>
                        <div className="flex flex-col items-center sm:flex-row sm:justify-start mt-2">
                          <a href={`https://opensea.io/assets?search[query]=${pool.collectionAddress}`} target="_blank" rel="noopener noreferrer" className="mr-0 sm:mr-4">
                            <p className="text-md font-bold text-gray-500 hover:text-blue-500">Collection: {pool.collectionName}</p>
                          </a>
                        </div>
                      </div>        

                      <div>
                        <a href={`https://opensea.io/${pool.poolAddress}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500"> Opensea </a>
                        <a href={`https://info.uniswap.org/#/tokens/${pool.poolAddress}`} target="_blank" rel="noopener noreferrer" className="mx-1 text-gray-500 hover:text-blue-500"> Uniswap </a>
                        <a href={`https://etherscan.io/address/${pool.poolAddress}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500"> Etherscan </a>
                      </div>  
                    </div>

                    {userSelected?.id===pool.uuid?
                      <div className=''>
                        <div className="px-8 py-4 flex my-2 justify-between">
                          <button className={`${buttonStyle} w-1/4 h-full`} onClick={()=>handleDepositSection(pool)}> Deposit </button>
                          <button className={`${buttonStyle} w-1/4 h-full`} onClick={()=>handleWithdrawSection(pool)}> Withdraw </button>
                          <button className={`${buttonStyle} w-1/4 h-full`} onClick={()=>handleSwapSection(pool)}> Swap </button>
                        </div>
                        {(userSelected?.depositClicked)?<DepositInput pool={pool} />:null}
                        {(userSelected?.withdrawClicked)?<WithdrawInput pool={pool}/>:null}
                        {(userSelected?.swapClicked)?<SwapInput pool={pool}/>:null}
                      </div>
                      :
                      <div className="text-center m-4">
                          <button onClick={()=>handleSelectPool(pool,{id:pool.uuid})} className="right-0 top-0 w-full h-full px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none"> Select Pool (Pool Balance: {pool.holdingsLength})</button>
                      </div>
                      
                      }
                      
                  </div>
                </div>
              )
            }):
            <div>Click get existing pools to check all available pools</div>
            }
          </div>
          
        </div>
        : <p className='text-center text-2xl m-10'>Connect wallet to get existing nft pools</p>}


      

    </div>
  )
}

export default ExistingPools

