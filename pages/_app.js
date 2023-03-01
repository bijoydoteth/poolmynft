import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import '../styles/globals.css';


function MyApp({ Component, pageProps }) {
  
  const [connectedAddress, setAddress] = useState(null);

  useEffect(() => {
    const savedAddress = JSON.parse(localStorage.getItem('connectedAddress'));
    if (savedAddress) setAddress(savedAddress);
  }, []);

  // Store connectedAddress in local storage with useEffect
  useEffect(() => {
    localStorage.setItem('connectedAddress', JSON.stringify(connectedAddress))
  }, [connectedAddress])

  return <div className='mx-auto w-full sm:w-4/5'>
      <Navbar connectedAddress={connectedAddress} setAddress={setAddress} />
      <Component {...pageProps} connectedAddress={connectedAddress} setAddress={setAddress}/>
    </div>
}

export default MyApp
