import { ethers } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import poolContract from './poolContract.json';

// NFT pool factory address: 0xb67dc4B5A296C3068E8eEc16f02CdaE4c9A255e5

// Write an input box for the user to enter the NFT pool address
// Write a button that will call the function to create a new NFT pool

// Path: web3\website\nft_pool\nft_pool\pages\createpool.js

const CreatePool = ({connectedAddress}) => {
  const [newPoolhash, setnewPoolhash] = useState(null);
  const collectionAddress = useRef(null)

  async function createPoolButton(){
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftPoolFactory = new ethers.Contract(poolContract.factoryContract.address,poolContract.factoryContract.abi, signer);
      const tx = await nftPoolFactory.createPool(collectionAddress.current.value)
      const receipt = await tx.wait();
      setnewPoolhash(receipt)
      console.log('Pool created');
    }
  }

  return <div className='py-5'>
          {connectedAddress ? 
          <div className="mx-auto w-9/10 bg-white shadow-lg rounded-lg p-8">
            <h1 className='text-3xl font-bold mb-4'>Create New Pool</h1>
            <div className="relative">
              <input type="text" placeholder="NFT collection address" className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:bg-white focus:border-gray-700" ref={collectionAddress} />
              <button className="absolute right-0 top-0 h-full px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none" onClick={createPoolButton}>Create</button>
            </div>
            {newPoolhash ? <div>Pool created on hash: {newPoolhash.transactionHash}</div> : null}  
          </div> 
          : <p className='text-center text-2xl m-10'>Connect wallet to create nft pools</p>}
        </div>
}



export default CreatePool