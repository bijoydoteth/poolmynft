// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios';

// Parsing the tokenURI to get the image link

export default async function handler(req, res) {
    // Query format: /api/getCollectionImage?nftCollection=0xd9b78A2F1dAFc8Bb9c60961790d2beefEBEE56f4&id=1&thrumbnail=true

    const param = req.query

    // Check if the address is valid
    function isValidAddress(address) {
      return /^(0x)?[0-9a-f]{40}$/i.test(address);
    }
    const nftCollection = param.nftCollection
    const id = param.id
    if(!isValidAddress(nftCollection)){
      res.status(400).json({error:'Invalid address'})
      return
    }

    let imageResponse
    let imageLink

    try{
      const query_url = `${process.env.ALCHEMY_URL}/getNFTMetadata?contractAddress=${nftCollection}&tokenId=${id}&refreshCache=false`
      const response = (await axios.get(query_url)).data

      
      if(param.thumbnail){
        imageLink = response.media[0].thumbnail
      }else{
        imageLink = response.media[0].gateway
      }

      imageResponse = (await axios.get(imageLink, {
        responseType: 'arraybuffer'
      })).data

      // const imageBuffer = await imageResponse.buffer();
      

    }catch(err){
        // console.log('Error');
        console.log(err);
        res.status(400).json({error:err})
    }
    res.setHeader('Content-Type', 'text/plain');
    res.status(200);
    
    return res.send(imageResponse);


    
    
}
  