// create nav bar component with 3 options: home, existing pools, create pools
import Link from 'next/link';
import ConnectWalletButton from './connectWalletButton';


export default function Navbar({connectedAddress,setAddress}) {
    
    return (
        <div className='flex justify-between h-12 bg-white text-gray-800 w-full p-2'>
        <div className='flex items-center'>
            <Link href='/' className='font-bold text-xl mx-2'>PoolMyNFT</Link>
            <Link href='/'>
            <div className='ml-4'>Home</div>
            </Link>
            <Link href='/existingpools'>
            <div className='ml-4'>Existing Pools</div>
            </Link>
            <Link href='/createpool'>
            <div className='ml-4'>Create Pool</div>
            </Link>
            <Link href='/contracts'>
            <div className='ml-4'>Contracts</div>
            </Link>
        </div>
        <div className='flex items-center'>
            <ConnectWalletButton connectedAddress={connectedAddress} setAddress={setAddress}/>
        </div>
        </div>
    )
}





