// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ethers } from 'ethers';

export default async function handler(req, res) {
    const param = req.query

    // query format /api/getWalletNft?nftCollection=0xd9b78A2F1dAFc8Bb9c60961790d2beefEBEE56f4&walletAddress=0x13EB216eb78b0048e8E584C77A096ff37eDb7A06

    try{

        // const test_param = {nftCollection:'0xd9b78A2F1dAFc8Bb9c60961790d2beefEBEE56f4',walletAddress:'0x13EB216eb78b0048e8E584C77A096ff37eDb7A06'}

        // Check if the address is valid
        function isValidAddress(address) {
            return /^(0x)?[0-9a-f]{40}$/i.test(address);
        }

        const walletAddress = param.walletAddress
        const nftCollection = param.nftCollection
        if(!isValidAddress(walletAddress)||!isValidAddress(nftCollection)){
            res.status(400).json({error:'Invalid address'})
            return
        }

        // Print all NFTs returned in the response:
        let pageKey
        let tokens = []

        do {
            let query_url = `${process.env.ALCHEMY_URL}/getNFTs?owner=${walletAddress}&pageSize=100&contractAddresses[]=${nftCollection}&withMetadata=true${pageKey ? `&pageKey=${pageKey}`:''}`


            let response = await (await fetch(query_url)).json()
            let newTokens = response.ownedNfts.map((nft) => {
                const id = ethers.BigNumber.from(nft.id.tokenId).toString()
                const thumbnail = nft.media[0].thumbnail
                return {id,thumbnail}
            })
            tokens.push(newTokens)
            pageKey = response.pageKey
          } while (pageKey);
        
        tokens = tokens.flat()
        res.status(200).json({nftCollection,walletAddress,tokens})
      
    

    }catch(err){
        console.log(err);
        res.status(400).json({error:err})
    }
    
    
  }
  