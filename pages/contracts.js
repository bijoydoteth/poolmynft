import {
  ContractCallContext, ContractCallResults, Multicall
} from 'ethereum-multicall';
import { ethers } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getExistingPools } from './existingpools.js';
import poolContract from './poolContract.json';


// NFT pool factory address: 0xb67dc4B5A296C3068E8eEc16f02CdaE4c9A255e5

const Contracts = () => {
    const [existingPoolsWithName, setExistingPoolsWithName] = useState(null)
    const handleGetExistingPools = async () =>{
        const existingPools = await getExistingPools()
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });
        const contractCallContext = [];

        existingPools.map((pool) => {
        contractCallContext.push({
            reference: `${pool}`,
            contractAddress: pool,
            abi: poolContract.poolContract.abi,
            calls: [
            { reference: `${pool}`, methodName: 'name', methodParameters: [] }, 
            { reference: `${pool}`, methodName: 'symbol', methodParameters: [] }, 
            ]
        })
        })

        try {
            const callResults = (await multicall.call(contractCallContext)).results;
            const poolDetail = (Object.keys(callResults).map((key) => callResults[key])).map(e => {
      
              return {
                name: e.callsReturnContext[0].returnValues[0],
                symbol: e.callsReturnContext[1].returnValues[0], 
                poolAddress: e.callsReturnContext[0].reference,
              }
            })

            setExistingPoolsWithName(poolDetail)
        }catch(err){
            console.log(err)
        }
    }

  return <div className='py-5'>
          <h1 className='text-3xl font-bold mb-4'>NFT Pool Contracts</h1>
          <p className='mb-4 font-bold'>Below are the list of contracts this website use</p>
          <div>
            <p className='mb-4'>
                {<a className='hover:text-blue-500' href={`https://etherscan.io/address/${poolContract.factoryContract.address}`} target='_blank'>NFT Pool Factory Contract: {poolContract.factoryContract.address}</a>}
            </p>
            <p className='mb-4'>
                {<a className='hover:text-blue-500' href={`https://etherscan.io/address/${poolContract.swapContract.address}`} target='_blank'>NFT Swap Contract: {poolContract.swapContract.address}</a>}
            </p>
          </div>
          <div className='flex flex-col'>
            <button className='right-0 top-0 h-full px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none' onClick={handleGetExistingPools}>Get Existing Pool Contracts</button>
            <div className='my-4'>
                {existingPoolsWithName?.map((pool,i)=>{
                    return <div key={uuidv4()}>{<a className='hover:text-blue-500' href={`https://etherscan.io/address/${pool.poolAddress}`} target='_blank'>[{i+1}] {pool.name}: {pool.poolAddress}</a>}</div>
                })}
            </div>
            
            
          </div>
        </div>
}



export default Contracts