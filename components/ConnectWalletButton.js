import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

export default function ConnectWalletButton({connectedAddress, setAddress}) {
    
    const connectWallet = async()=>{
        
        if (typeof window.ethereum !== 'undefined') {
            if (connectedAddress) {
                setAddress(connectedAddress);
            } else {
                if (typeof window.ethereum !== 'undefined') {
                    try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const chainId = await provider.getNetwork().then(network => network.chainId);
                    if (chainId === 1) {
                      await provider.send('eth_requestAccounts', []);
                      const signer = provider.getSigner();
                      const address = await signer.getAddress();
                      setAddress(address);
                    }else{
                      alert('Please switch wallet to mainnet');
                    }
                    
                    } catch (error) {
                    console.error(error);
                    alert('Failed to connect to wallet');
                    }
                } else {
                    alert('Please install MetaMask to use this feature');
                }
            }
        } else {
            alert('Please install MetaMask to use this feature');
        }
   }

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      window.ethereum.on('accountsChanged', async (accounts) => {
        if(accounts.length > 0){
            setAddress(await signer.getAddress());
        } else {
            setAddress(null);
        }
      });
    }
  }, []);

  return (

    <div className='border-2 border-black p-1'>
      {connectedAddress ? (
        <div>{connectedAddress.substring(0, 4) + '...' + connectedAddress.substring(38)}</div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
