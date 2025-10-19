import * as fcl from "@onflow/fcl"

// Flow network configuration
export const FLOW_NETWORK = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet"

// Configure FCL
fcl
  .config()
  .put("app.detail.title", "Ownly")
  .put("app.detail.icon", "https://ownly.app/icon.png")
  .put("flow.network", FLOW_NETWORK)
  .put(
    "accessNode.api",
    FLOW_NETWORK === "mainnet" ? "https://rest-mainnet.onflow.org" : "https://rest-testnet.onflow.org",
  )
  .put(
    "discovery.wallet",
    FLOW_NETWORK === "mainnet"
      ? "https://fcl-discovery.onflow.org/authn"
      : "https://fcl-discovery.onflow.org/testnet/authn",
  )
  .put("discovery.wallet.method", "IFRAME/RPC")

// Dapper Core Contract Addresses
export const DAPPER_CONTRACTS = {
  testnet: {
    NonFungibleToken: "0x631e88ae7f1d7c20",
    MetadataViews: "0x631e88ae7f1d7c20",
    DapperCollectibles: "0x82ec283f88a62e65", // Dapper Core NFT contract
    DapperMarket: "0x94b06cfca1d8a476", // Dapper marketplace contract
    NFTStorefront: "0x94b06cfca1d8a476",
    FungibleToken: "0x9a0766d93b6608b7",
    FlowToken: "0x7e60df042a9c0868",
  },
  mainnet: {
    NonFungibleToken: "0x1d7e57aa55817448",
    MetadataViews: "0x1d7e57aa55817448", 
    DapperCollectibles: "0x82ec283f88a62e65", // Dapper Core NFT contract
    DapperMarket: "0x4eb8a10cb9f87357", // Dapper marketplace contract
    NFTStorefront: "0x4eb8a10cb9f87357",
    FungibleToken: "0xf233dcee88fe0abe",
    FlowToken: "0x1654653399040a61",
  },
}

export const getContractAddress = (contractName: keyof typeof DAPPER_CONTRACTS.testnet) => {
  return DAPPER_CONTRACTS[FLOW_NETWORK as keyof typeof DAPPER_CONTRACTS][contractName]
}

// Enhanced contract address resolution with validation
export const resolveContractAddress = (contractName: string, network?: string): string => {
  const targetNetwork = network || FLOW_NETWORK
  const contracts = DAPPER_CONTRACTS[targetNetwork as keyof typeof DAPPER_CONTRACTS]
  
  if (!contracts) {
    throw new Error(`Unsupported network: ${targetNetwork}`)
  }
  
  const address = contracts[contractName as keyof typeof contracts]
  if (!address) {
    throw new Error(`Contract ${contractName} not found for network ${targetNetwork}`)
  }
  
  return address
}

// Collection ID for Ownly collectibles
export const OWNLY_COLLECTION_ID = "ownly_collectibles"

// Flow Access API configuration
export const FLOW_ACCESS_API = {
  testnet: {
    rest: "https://rest-testnet.onflow.org",
    grpc: "access-testnet.onflow.org:9000",
  },
  mainnet: {
    rest: "https://rest-mainnet.onflow.org", 
    grpc: "access-mainnet.onflow.org:9000",
  },
}

export const getAccessAPIEndpoint = (type: 'rest' | 'grpc' = 'rest') => {
  return FLOW_ACCESS_API[FLOW_NETWORK as keyof typeof FLOW_ACCESS_API][type]
}

// IPFS Configuration
export const IPFS_GATEWAY = "https://nftstorage.link/ipfs/"
export const NFT_STORAGE_API_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || ""
