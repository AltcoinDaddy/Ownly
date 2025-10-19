exports.id=57,exports.ids=[57],exports.modules={10596:()=>{},28291:(t,e,a)=>{"use strict";a.d(e,{HG:()=>c,Rf:()=>f,h8:()=>d,j$:()=>p,s5:()=>u});var i=a(26207),r=a(53829);let l=`
import NonFungibleToken from 0x${(0,r.RZ)("NonFungibleToken").replace("0x","")}
import DapperCollectibles from 0x${(0,r.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,r.RZ)("MetadataViews").replace("0x","")}

pub fun main(address: Address): [NFTData] {
  let account = getAccount(address)
  
  // Get reference to the user's DapperCollectibles collection
  let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>()
  
  if collectionRef == nil {
    return []
  }
  
  let ids = collectionRef!.getIDs()
  let nftData: [NFTData] = []
  
  for id in ids {
    if let nft = collectionRef!.borrowCollectible(id: id) {
      if let display = nft.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
        nftData.append(NFTData(
          id: id,
          name: display.name,
          description: display.description,
          thumbnail: display.thumbnail.uri(),
          owner: address,
          collectionId: "ownly_collectibles"
        ))
      }
    }
  }
  
  return nftData
}

pub struct NFTData {
  pub let id: UInt64
  pub let name: String
  pub let description: String
  pub let thumbnail: String
  pub let owner: Address
  pub let collectionId: String
  
  init(id: UInt64, name: String, description: String, thumbnail: String, owner: Address, collectionId: String) {
    self.id = id
    self.name = name
    self.description = description
    self.thumbnail = thumbnail
    self.owner = owner
    self.collectionId = collectionId
  }
}
`,n=`
import NonFungibleToken from 0x${(0,r.RZ)("NonFungibleToken").replace("0x","")}
import DapperCollectibles from 0x${(0,r.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,r.RZ)("MetadataViews").replace("0x","")}

pub fun main(address: Address, nftID: UInt64): NFTDetails? {
  let account = getAccount(address)
  
  // Get reference to the user's DapperCollectibles collection
  let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>()
  
  if collectionRef == nil {
    return nil
  }
  
  if let nft = collectionRef!.borrowCollectible(id: nftID) {
    var name = ""
    var description = ""
    var thumbnail = ""
    var externalURL = ""
    var royalties: [MetadataViews.Royalty] = []
    var traits: {String: AnyStruct} = {}
    
    // Get Display metadata
    if let display = nft.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
      name = display.name
      description = display.description
      thumbnail = display.thumbnail.uri()
    }
    
    // Get ExternalURL metadata
    if let extURL = nft.resolveView(Type<MetadataViews.ExternalURL>()) as? MetadataViews.ExternalURL {
      externalURL = extURL.url
    }
    
    // Get Royalties metadata
    if let royaltiesView = nft.resolveView(Type<MetadataViews.Royalties>()) as? MetadataViews.Royalties {
      royalties = royaltiesView.getRoyalties()
    }
    
    // Get Traits metadata
    if let traitsView = nft.resolveView(Type<MetadataViews.Traits>()) as? MetadataViews.Traits {
      for trait in traitsView.traits {
        traits[trait.name] = trait.value
      }
    }
    
    return NFTDetails(
      id: nftID,
      name: name,
      description: description,
      thumbnail: thumbnail,
      externalURL: externalURL,
      owner: address,
      royalties: royalties,
      traits: traits,
      collectionId: "ownly_collectibles"
    )
  }
  
  return nil
}

pub struct NFTDetails {
  pub let id: UInt64
  pub let name: String
  pub let description: String
  pub let thumbnail: String
  pub let externalURL: String
  pub let owner: Address
  pub let royalties: [MetadataViews.Royalty]
  pub let traits: {String: AnyStruct}
  pub let collectionId: String
  
  init(
    id: UInt64, 
    name: String, 
    description: String, 
    thumbnail: String, 
    externalURL: String,
    owner: Address, 
    royalties: [MetadataViews.Royalty],
    traits: {String: AnyStruct},
    collectionId: String
  ) {
    self.id = id
    self.name = name
    self.description = description
    self.thumbnail = thumbnail
    self.externalURL = externalURL
    self.owner = owner
    self.royalties = royalties
    self.traits = traits
    self.collectionId = collectionId
  }
}
`,s=`
import DapperCollectibles from 0x${(0,r.RZ)("DapperCollectibles").replace("0x","")}

pub fun main(address: Address): Bool {
  let account = getAccount(address)
  
  return account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>() != nil
}
`,o=`
import DapperCollectibles from 0x${(0,r.RZ)("DapperCollectibles").replace("0x","")}

pub fun main(address: Address): CollectionInfo? {
  let account = getAccount(address)
  
  if let collectionRef = account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>() {
    
    let ids = collectionRef.getIDs()
    
    return CollectionInfo(
      address: address,
      totalNFTs: UInt64(ids.length),
      nftIDs: ids
    )
  }
  
  return nil
}

pub struct CollectionInfo {
  pub let address: Address
  pub let totalNFTs: UInt64
  pub let nftIDs: [UInt64]
  
  init(address: Address, totalNFTs: UInt64, nftIDs: [UInt64]) {
    self.address = address
    self.totalNFTs = totalNFTs
    self.nftIDs = nftIDs
  }
}
`;async function c(t,e=[]){try{return await i.query({cadence:t,args:e})}catch(t){throw console.error("Script execution error:",t),t}}async function d(t){return c(l,[i.arg(t,i.t.Address)])}async function p(t,e){return c(n,[i.arg(t,i.t.Address),i.arg(e,i.t.UInt64)])}async function u(t){return c(s,[i.arg(t,i.t.Address)])}async function f(t){return c(o,[i.arg(t,i.t.Address)])}},45590:()=>{},52268:(t,e,a)=>{"use strict";a.d(e,{K:()=>n,S:()=>l});var i=a(76036),r=a(18393);class l{async mintOwnlyNFT(t,e){let a={metadata_url:t,recipient:e,collection_id:r.Wr};return i.Y.mintNFT(a)}async transferNFT(t,e,a){return i.Y.transferNFT({nft_id:t,from:e,to:a})}async listNFTForSale(t,e,a){return i.Y.listNFT({nft_id:t,price:e,currency:"FLOW",seller:a})}async buyNFT(t,e){return i.Y.buyNFT({nft_id:t,buyer:e})}async getUserCollection(t){return i.Y.getUserNFTs(t)}async getRecentEvents(t){return i.Y.getEvents(t)}async getMarketplaceListings(t){let e=new URLSearchParams;return t?.cursor&&e.append("cursor",t.cursor),t?.limit&&e.append("limit",t.limit.toString()),t?.category&&e.append("category",t.category),t?.minPrice&&e.append("min_price",t.minPrice.toString()),t?.maxPrice&&e.append("max_price",t.maxPrice.toString()),t?.sortBy&&e.append("sort_by",t.sortBy),t?.sortOrder&&e.append("sort_order",t.sortOrder),i.Y.getMarketplaceListings(e.toString())}static isValidFlowAddress(t){return/^0x[a-fA-F0-9]{16}$/.test(t)}static formatFlowAddress(t){return t?t.startsWith("0x")?t:`0x${t}`:""}}let n=new l},52367:()=>{},53829:(t,e,a)=>{"use strict";a.d(e,{AS:()=>o,NP:()=>s,RZ:()=>n,i7:()=>c});var i=a(26207);let r="testnet";i.config().put("app.detail.title","Ownly").put("app.detail.icon","https://ownly.app/icon.png").put("flow.network",r).put("accessNode.api","https://rest-testnet.onflow.org").put("discovery.wallet","https://fcl-discovery.onflow.org/testnet/authn").put("discovery.wallet.method","IFRAME/RPC");let l={testnet:{NonFungibleToken:"0x631e88ae7f1d7c20",MetadataViews:"0x631e88ae7f1d7c20",DapperCollectibles:"0x82ec283f88a62e65",DapperMarket:"0x94b06cfca1d8a476",NFTStorefront:"0x94b06cfca1d8a476",FungibleToken:"0x9a0766d93b6608b7",FlowToken:"0x7e60df042a9c0868"},mainnet:{NonFungibleToken:"0x1d7e57aa55817448",MetadataViews:"0x1d7e57aa55817448",DapperCollectibles:"0x82ec283f88a62e65",DapperMarket:"0x4eb8a10cb9f87357",NFTStorefront:"0x4eb8a10cb9f87357",FungibleToken:"0xf233dcee88fe0abe",FlowToken:"0x1654653399040a61"}},n=t=>l[r][t],s="ownly_collectibles",o="https://nftstorage.link/ipfs/",c=process.env.NEXT_PUBLIC_NFT_STORAGE_KEY||""},64397:()=>{},80565:(t,e,a)=>{"use strict";a.d(e,{c:()=>n});var i=a(52268),r=a(28291);class l{async getUserCollection(t,e=!0){if(!i.S.isValidFlowAddress(t))throw Error("Invalid Flow address format");let a=i.S.formatFlowAddress(t);if(e){let t=this.getFromCache(a);if(t)return t.data}try{if(!await (0,r.s5)(a)){let t={address:a,totalNFTs:0,nfts:[],hasCollection:!1,lastUpdated:new Date().toISOString()};return this.setCache(a,t),t}let[t,e]=await Promise.all([(0,r.h8)(a),(0,r.Rf)(a)]),i=await this.enrichNFTsWithDapperData(t,a),l={address:a,totalNFTs:e?.totalNFTs||i.length,nfts:i,hasCollection:!0,lastUpdated:new Date().toISOString()};return this.setCache(a,l),l}catch(e){console.error("Error fetching user collection:",e);let t=this.cache.get(a);if(t)return t.data;throw e}}async getNFTDetails(t,e){let a=i.S.formatFlowAddress(t);try{let t=await (0,r.j$)(a,e);if(!t)return null;return await this.enrichSingleNFT(t,a)}catch(t){return console.error("Error fetching NFT details:",t),null}}async enrichNFTsWithDapperData(t,e){if(!t||0===t.length)return[];try{let a=await i.K.getUserCollection(e),r=new Map(a.nfts.map(t=>[t.nft_id,t])),l=[];for(let a of t){let t=r.get(a.id.toString()),i={id:a.id.toString(),name:a.name||"Untitled",description:a.description||"",image:a.thumbnail||"",thumbnail:a.thumbnail||"",owner:a.owner||e,collection_id:a.collectionId||"ownly_collectibles",metadata_url:t?.metadata_url,minted_at:t?.owned_at,external_url:a.externalURL,royalties:a.royalties,traits:a.traits};if(i.metadata_url)try{let t=await this.fetchMetadata(i.metadata_url);t&&(i.attributes=t.attributes,i.animation_url=t.animation_url,i.external_url=i.external_url||t.external_url,i.creator=t.creator)}catch(t){console.warn("Failed to fetch metadata for NFT",i.id,t)}l.push(i)}return l}catch(a){return console.warn("Failed to enrich with Dapper data, using Flow data only:",a),t.map(t=>({id:t.id.toString(),name:t.name||"Untitled",description:t.description||"",image:t.thumbnail||"",thumbnail:t.thumbnail||"",owner:t.owner||e,collection_id:t.collectionId||"ownly_collectibles",external_url:t.externalURL,royalties:t.royalties,traits:t.traits}))}}async enrichSingleNFT(t,e){let a={id:t.id.toString(),name:t.name||"Untitled",description:t.description||"",image:t.thumbnail||"",thumbnail:t.thumbnail||"",owner:t.owner||e,collection_id:t.collectionId||"ownly_collectibles",external_url:t.externalURL,royalties:t.royalties,traits:t.traits};try{let t=(await i.K.getUserCollection(e)).nfts.find(t=>t.nft_id===a.id);if(t&&(a.metadata_url=t.metadata_url,a.minted_at=t.owned_at,a.metadata_url)){let t=await this.fetchMetadata(a.metadata_url);t&&(a.attributes=t.attributes,a.animation_url=t.animation_url,a.external_url=a.external_url||t.external_url,a.creator=t.creator)}}catch(t){console.warn("Failed to enrich single NFT with Dapper data:",t)}return a}async fetchMetadata(t){try{let e=t;t.startsWith("ipfs://")&&(e=t.replace("ipfs://","https://nftstorage.link/ipfs/"));let a=await fetch(e,{signal:AbortSignal.timeout(5e3)});if(!a.ok)throw Error(`HTTP ${a.status}`);return await a.json()}catch(e){return console.warn("Failed to fetch metadata from",t,e),null}}getFromCache(t){let e=this.cache.get(t);return e?Date.now()>e.expires_at?(this.cache.delete(t),null):e:null}setCache(t,e){if(this.cache.size>=this.MAX_CACHE_SIZE){let t=this.cache.keys().next().value;t&&this.cache.delete(t)}let a={address:t,data:e,cached_at:Date.now(),expires_at:Date.now()+this.CACHE_TTL};this.cache.set(t,a)}clearCache(t){if(t){let e=i.S.formatFlowAddress(t);this.cache.delete(e)}else this.cache.clear()}getCacheStats(){return{size:this.cache.size,maxSize:this.MAX_CACHE_SIZE,ttl:this.CACHE_TTL}}constructor(){this.cache=new Map,this.CACHE_TTL=3e5,this.MAX_CACHE_SIZE=100}}let n=new l}};