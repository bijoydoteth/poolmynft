import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const paragraphStyle = 'my-4 text-center max-w-2xl'
  return (
    <div>
      <Head>
        <title>PoolMyNFT</title>
        <meta name="description" content="Pool NFT with ease" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        
        <div className='flex flex-col items-center'>
          <h1 className='text-4xl text-center m-5'>
            Welcome to PoolMyNFT
          </h1>
          <div className=''>
            <p className={paragraphStyle}>In PoolMyNFT, users deposit their NFTs (ERC-721) into collection-specific Pools and receive a standard ERC-20 token for each NFT deposited.</p>
            <p className={paragraphStyle}>This enables users to utilize their Pool Tokens in various Ethereum-based decentralized finance applications.</p>
            <p className={paragraphStyle}>Any user can deploy a Pool for a specific NFT collection, and the smart contracts ensure that each Pool NFT is fully backed by a corresponding NFT from its collection. The Pools allow for NFTs from the same collection to be interchangeable, and users can swap NFTs freely with each other. </p>
            <p className={paragraphStyle}>However, it&apos;s not guaranteed that any particular NFT from a collection will be in the pool at any given time. </p>
            <p className={paragraphStyle}> Pools are public and we don&apos;t charge any additional fee except gas fee.  </p>
            <p className={paragraphStyle}> The source code for the contracts are publicly available, but they have not been audited. Use at your own risk.  </p>
            
          </div>
          
          
          <div className="flex items-center m-5">
            <Link className='mx-2 right-0 top-0 px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none' href='/existingpools'> Swap NFT Now</Link>
            <Link className='mx-2 right-0 top-0 px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-black focus:outline-none' href='/contracts'> Check Contracts</Link>
          </div>
        </div>
        
      </main>

      <footer className='text-center'>
        <p> Made with ❤️ by <a href='https://twitter.com/bijoydoteth' target="_blank" className='text-blue-500 hover:underline'>bijoy</a> for the community</p>
        <p>This website is open-sourced. <a href='https://github.com/ho4848/poolmynft' target="_blank" className='text-blue-500 hover:underline'>Source Code</a></p>
      </footer>
      
    </div>
  )
}
