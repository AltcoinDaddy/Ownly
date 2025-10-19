exports.id=798,exports.ids=[798],exports.modules={10596:()=>{},28291:(e,t,r)=>{"use strict";r.d(t,{HG:()=>c,Rf:()=>f,h8:()=>p,j$:()=>u,s5:()=>d});var i=r(26207),l=r(53829);let a=`
import NonFungibleToken from 0x${(0,l.RZ)("NonFungibleToken").replace("0x","")}
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,l.RZ)("MetadataViews").replace("0x","")}

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
import NonFungibleToken from 0x${(0,l.RZ)("NonFungibleToken").replace("0x","")}
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,l.RZ)("MetadataViews").replace("0x","")}

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
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}

pub fun main(address: Address): Bool {
  let account = getAccount(address)
  
  return account.getCapability(/public/DapperCollectiblesCollection)
    .borrow<&{DapperCollectibles.CollectionPublic}>() != nil
}
`,o=`
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}

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
`;async function c(e,t=[]){try{return await i.query({cadence:e,args:t})}catch(e){throw console.error("Script execution error:",e),e}}async function p(e){return c(a,[i.arg(e,i.t.Address)])}async function u(e,t){return c(n,[i.arg(e,i.t.Address),i.arg(t,i.t.UInt64)])}async function d(e){return c(s,[i.arg(e,i.t.Address)])}async function f(e){return c(o,[i.arg(e,i.t.Address)])}},45590:()=>{},50138:(e,t,r)=>{"use strict";r.d(t,{v:()=>a});var i=r(52268);class l{generateCacheKey(e){if(!e)return"default";let t=new URLSearchParams;return e.cursor&&t.append("cursor",e.cursor),e.limit&&t.append("limit",e.limit.toString()),e.category&&t.append("category",e.category),e.minPrice&&t.append("minPrice",e.minPrice.toString()),e.maxPrice&&t.append("maxPrice",e.maxPrice.toString()),e.sortBy&&t.append("sortBy",e.sortBy),e.sortOrder&&t.append("sortOrder",e.sortOrder),t.toString()||"default"}async getMarketplaceListings(e,t=!0){let r=this.generateCacheKey(e);if(t){let e=this.getFromCache(r);if(e)return e.data}try{let t=await i.K.getMarketplaceListings(e);return this.setCache(r,t),t}catch(t){console.error("Error fetching marketplace listings:",t);let e=this.cache.get(r);if(e)return e.data;throw t}}getFromCache(e){let t=this.cache.get(e);return t?Date.now()>t.expires_at?(this.cache.delete(e),null):t:null}setCache(e,t){if(this.cache.size>=this.MAX_CACHE_SIZE){let e=this.cache.keys().next().value;e&&this.cache.delete(e)}let r={key:e,data:t,cached_at:Date.now(),expires_at:Date.now()+this.CACHE_TTL};this.cache.set(e,r)}clearCache(e){e?this.cache.delete(e):this.cache.clear()}getCacheStats(){return{size:this.cache.size,maxSize:this.MAX_CACHE_SIZE,ttl:this.CACHE_TTL}}invalidateCache(){this.cache.clear()}constructor(){this.cache=new Map,this.CACHE_TTL=12e4,this.MAX_CACHE_SIZE=50}}let a=new l},52268:(e,t,r)=>{"use strict";r.d(t,{K:()=>n,S:()=>a});var i=r(76036),l=r(18393);class a{async mintOwnlyNFT(e,t){let r={metadata_url:e,recipient:t,collection_id:l.Wr};return i.Y.mintNFT(r)}async transferNFT(e,t,r){return i.Y.transferNFT({nft_id:e,from:t,to:r})}async listNFTForSale(e,t,r){return i.Y.listNFT({nft_id:e,price:t,currency:"FLOW",seller:r})}async buyNFT(e,t){return i.Y.buyNFT({nft_id:e,buyer:t})}async getUserCollection(e){return i.Y.getUserNFTs(e)}async getRecentEvents(e){return i.Y.getEvents(e)}async getMarketplaceListings(e){let t=new URLSearchParams;return e?.cursor&&t.append("cursor",e.cursor),e?.limit&&t.append("limit",e.limit.toString()),e?.category&&t.append("category",e.category),e?.minPrice&&t.append("min_price",e.minPrice.toString()),e?.maxPrice&&t.append("max_price",e.maxPrice.toString()),e?.sortBy&&t.append("sort_by",e.sortBy),e?.sortOrder&&t.append("sort_order",e.sortOrder),i.Y.getMarketplaceListings(t.toString())}static isValidFlowAddress(e){return/^0x[a-fA-F0-9]{16}$/.test(e)}static formatFlowAddress(e){return e?e.startsWith("0x")?e:`0x${e}`:""}}let n=new a},52367:()=>{},53829:(e,t,r)=>{"use strict";r.d(t,{AS:()=>o,NP:()=>s,RZ:()=>n,i7:()=>c});var i=r(26207);let l="testnet";i.config().put("app.detail.title","Ownly").put("app.detail.icon","https://ownly.app/icon.png").put("flow.network",l).put("accessNode.api","https://rest-testnet.onflow.org").put("discovery.wallet","https://fcl-discovery.onflow.org/testnet/authn").put("discovery.wallet.method","IFRAME/RPC");let a={testnet:{NonFungibleToken:"0x631e88ae7f1d7c20",MetadataViews:"0x631e88ae7f1d7c20",DapperCollectibles:"0x82ec283f88a62e65",DapperMarket:"0x94b06cfca1d8a476",NFTStorefront:"0x94b06cfca1d8a476",FungibleToken:"0x9a0766d93b6608b7",FlowToken:"0x7e60df042a9c0868"},mainnet:{NonFungibleToken:"0x1d7e57aa55817448",MetadataViews:"0x1d7e57aa55817448",DapperCollectibles:"0x82ec283f88a62e65",DapperMarket:"0x4eb8a10cb9f87357",NFTStorefront:"0x4eb8a10cb9f87357",FungibleToken:"0xf233dcee88fe0abe",FlowToken:"0x1654653399040a61"}},n=e=>a[l][e],s="ownly_collectibles",o="https://nftstorage.link/ipfs/",c=process.env.NEXT_PUBLIC_NFT_STORAGE_KEY||""},64397:()=>{},95489:(e,t,r)=>{"use strict";r.d(t,{$:()=>p});var i=r(26207),l=r(53829);async function a(e,t=[],r){try{let l=await i.mutate({cadence:e,args:t,limit:9999,authorizations:[i.currentUser().authorization]});console.log("Transaction submitted:",l),r?.onStatusUpdate&&i.tx(l).subscribe(r.onStatusUpdate);let a=await i.tx(l).onceSealed();return console.log("Transaction sealed:",a),r?.onSealed&&r.onSealed(l),l}catch(e){throw console.error("Transaction error:",e),e}}var n=r(28291);let s=`
import DapperMarket from 0x${(0,l.RZ)("DapperMarket").replace("0x","")}
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,l.RZ)("MetadataViews").replace("0x","")}

pub fun main(): [ListingData] {
  let listings: [ListingData] = []
  
  // Get all active listings from DapperMarket
  let listingIDs = DapperMarket.getListingIDs()
  
  for listingID in listingIDs {
    if let listing = DapperMarket.borrowListing(listingID: listingID) {
      // Get NFT metadata
      let nftRef = listing.borrowNFT()
      var name = ""
      var description = ""
      var thumbnail = ""
      
      if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
        name = display.name
        description = display.description
        thumbnail = display.thumbnail.uri()
      }
      
      listings.append(ListingData(
        listingID: listingID,
        nftID: listing.getNFTID(),
        seller: listing.getSeller(),
        price: listing.getPrice(),
        currency: "FLOW",
        status: "active",
        createdAt: listing.getCreatedAt(),
        nftMetadata: NFTMetadata(
          name: name,
          description: description,
          image: thumbnail,
          collectionId: "ownly_collectibles"
        )
      ))
    }
  }
  
  return listings
}

pub struct ListingData {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftMetadata: NFTMetadata
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftMetadata: NFTMetadata
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftMetadata = nftMetadata
  }
}

pub struct NFTMetadata {
  pub let name: String
  pub let description: String
  pub let image: String
  pub let collectionId: String
  
  init(name: String, description: String, image: String, collectionId: String) {
    self.name = name
    self.description = description
    self.image = image
    self.collectionId = collectionId
  }
}
`,o=`
import DapperMarket from 0x${(0,l.RZ)("DapperMarket").replace("0x","")}
import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
import MetadataViews from 0x${(0,l.RZ)("MetadataViews").replace("0x","")}

pub fun main(listingID: UInt64): ListingDetails? {
  if let listing = DapperMarket.borrowListing(listingID: listingID) {
    // Get NFT metadata
    let nftRef = listing.borrowNFT()
    var name = ""
    var description = ""
    var thumbnail = ""
    
    if let display = nftRef.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
      name = display.name
      description = display.description
      thumbnail = display.thumbnail.uri()
    }
    
    return ListingDetails(
      listingID: listingID,
      nftID: listing.getNFTID(),
      seller: listing.getSeller(),
      price: listing.getPrice(),
      currency: "FLOW",
      status: "active",
      createdAt: listing.getCreatedAt(),
      nftName: name,
      nftDescription: description,
      nftImage: thumbnail
    )
  }
  
  return nil
}

pub struct ListingDetails {
  pub let listingID: UInt64
  pub let nftID: UInt64
  pub let seller: Address
  pub let price: UFix64
  pub let currency: String
  pub let status: String
  pub let createdAt: UFix64
  pub let nftName: String
  pub let nftDescription: String
  pub let nftImage: String
  
  init(
    listingID: UInt64,
    nftID: UInt64,
    seller: Address,
    price: UFix64,
    currency: String,
    status: String,
    createdAt: UFix64,
    nftName: String,
    nftDescription: String,
    nftImage: String
  ) {
    self.listingID = listingID
    self.nftID = nftID
    self.seller = seller
    self.price = price
    self.currency = currency
    self.status = status
    self.createdAt = createdAt
    self.nftName = nftName
    self.nftDescription = nftDescription
    self.nftImage = nftImage
  }
}
`;class c{async listNFTForSale(e,t,r){try{return console.log(`[Flow] Listing NFT ${e} for ${t} FLOW`),{transactionId:await a(`
        import NonFungibleToken from 0x${(0,l.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
        import DapperMarket from 0x${(0,l.RZ)("DapperMarket").replace("0x","")}
        import FungibleToken from 0x${(0,l.RZ)("FungibleToken").replace("0x","")}
        import FlowToken from 0x${(0,l.RZ)("FlowToken").replace("0x","")}

        transaction(nftID: UInt64, price: UFix64) {
          let sellerCollection: &DapperCollectibles.Collection
          let paymentReceiver: Capability<&{FungibleToken.Receiver}>
          
          prepare(signer: AuthAccount) {
            // Get seller's collection reference
            self.sellerCollection = signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection)
              ?? panic("Could not borrow seller collection")
            
            // Get payment receiver capability
            self.paymentReceiver = signer.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            // Verify NFT exists in collection
            let nftRef = self.sellerCollection.borrowCollectible(id: nftID)
              ?? panic("NFT does not exist in collection")
          }
          
          execute {
            // Create listing on DapperMarket
            DapperMarket.createListing(
              nftID: nftID,
              price: price,
              seller: signer.address,
              paymentReceiver: self.paymentReceiver
            )
          }
        }
        `,[i.arg(e,i.t.UInt64),i.arg(t,i.t.UFix64)],{onStatusUpdate:r}),status:"completed"}}catch(e){return console.error("[Flow] List NFT error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to list NFT"}}}async purchaseNFT(e,t,r){try{if(console.log(`[Flow] Purchasing NFT ${e} from ${t}`),!(await i.currentUser().snapshot()).addr)throw Error("Wallet not connected");return{transactionId:await a(`
        import NonFungibleToken from 0x${(0,l.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}
        import DapperMarket from 0x${(0,l.RZ)("DapperMarket").replace("0x","")}
        import FungibleToken from 0x${(0,l.RZ)("FungibleToken").replace("0x","")}
        import FlowToken from 0x${(0,l.RZ)("FlowToken").replace("0x","")}

        transaction(nftID: UInt64, seller: Address) {
          let paymentVault: @FlowToken.Vault
          let buyerCollection: &{DapperCollectibles.CollectionPublic}
          let listing: &DapperMarket.Listing
          
          prepare(signer: AuthAccount) {
            // Ensure buyer has collection set up
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
            
            // Get buyer's collection reference
            self.buyerCollection = signer.getCapability(/public/DapperCollectiblesCollection)
              .borrow<&{DapperCollectibles.CollectionPublic}>()
              ?? panic("Could not borrow buyer collection")
            
            // Get listing reference
            self.listing = DapperMarket.borrowListing(nftID: nftID, seller: seller)
              ?? panic("Could not find listing for this NFT")
            
            // Get listing price
            let price = self.listing.getPrice()
            
            // Withdraw payment from buyer's Flow token vault
            let mainVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow Flow token vault")
            
            // Check sufficient balance
            if mainVault.balance < price {
              panic("Insufficient FLOW balance for purchase")
            }
            
            self.paymentVault <- mainVault.withdraw(amount: price) as! @FlowToken.Vault
          }
          
          execute {
            // Purchase NFT from DapperMarket
            let nft <- DapperMarket.purchase(
              nftID: nftID,
              seller: seller,
              payment: <-self.paymentVault
            )
            
            // Deposit NFT to buyer's collection
            self.buyerCollection.deposit(token: <-nft)
            
            log("NFT purchase completed successfully")
          }
        }
        `,[i.arg(e,i.t.UInt64),i.arg(t,i.t.Address)],{onStatusUpdate:r}),status:"completed"}}catch(t){console.error("[Flow] Purchase NFT error:",t);let e="Failed to purchase NFT";return t instanceof Error&&(e=t.message.includes("Insufficient FLOW balance")?"Insufficient FLOW balance for this purchase":t.message.includes("Could not find listing")?"This NFT is no longer available for purchase":t.message.includes("User rejected")?"Transaction was cancelled by user":t.message),{transactionId:"",status:"failed",error:e}}}async removeListing(e,t){try{return console.log(`[Flow] Removing listing for NFT ${e}`),{transactionId:await a(`
        import DapperMarket from 0x${(0,l.RZ)("DapperMarket").replace("0x","")}

        transaction(nftID: UInt64) {
          prepare(signer: AuthAccount) {
            // Verify signer is the seller
            let listing = DapperMarket.borrowListing(nftID: nftID, seller: signer.address)
              ?? panic("No listing found or not authorized")
          }
          
          execute {
            // Remove listing from DapperMarket
            DapperMarket.removeListing(nftID: nftID, seller: signer.address)
          }
        }
        `,[i.arg(e,i.t.UInt64)],{onStatusUpdate:t}),status:"completed"}}catch(e){return console.error("[Flow] Remove listing error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to remove listing"}}}async getMarketplaceListings(){try{return console.log("[Flow] Fetching marketplace listings"),await (0,n.HG)(s)||[]}catch(e){return console.error("[Flow] Get listings error:",e),[]}}async getListingDetails(e){try{return console.log(`[Flow] Fetching listing details for ${e}`),await (0,n.HG)(o,[i.arg(e,i.t.UInt64)])}catch(e){return console.error("[Flow] Get listing details error:",e),null}}async checkFlowBalance(e,t){try{let r=await (0,n.HG)(`
        import FlowToken from 0x${(0,l.RZ)("FlowToken").replace("0x","")}
        import FungibleToken from 0x${(0,l.RZ)("FungibleToken").replace("0x","")}

        pub fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
          
          return vaultRef.balance
        }
      `,[i.arg(e,i.t.Address)]),a=parseFloat(t);return parseFloat(r.toString())>=a}catch(e){return console.error("[Flow] Check balance error:",e),!1}}async setupUserCollection(e){try{return console.log("[Flow] Setting up user collection"),{transactionId:await a(`
        import NonFungibleToken from 0x${(0,l.RZ)("NonFungibleToken").replace("0x","")}
        import DapperCollectibles from 0x${(0,l.RZ)("DapperCollectibles").replace("0x","")}

        transaction() {
          prepare(signer: AuthAccount) {
            // Check if collection already exists
            if signer.borrow<&DapperCollectibles.Collection>(from: /storage/DapperCollectiblesCollection) == nil {
              // Create new collection
              let collection <- DapperCollectibles.createEmptyCollection()
              
              // Save collection to storage
              signer.save(<-collection, to: /storage/DapperCollectiblesCollection)
              
              // Create public capability
              signer.link<&{DapperCollectibles.CollectionPublic}>(
                /public/DapperCollectiblesCollection,
                target: /storage/DapperCollectiblesCollection
              )
            }
          }
        }
        `,[],{onStatusUpdate:e}),status:"completed"}}catch(e){return console.error("[Flow] Setup collection error:",e),{transactionId:"",status:"failed",error:e instanceof Error?e.message:"Failed to setup collection"}}}}let p=new c}};