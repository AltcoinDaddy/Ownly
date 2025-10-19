# Requirements Document

## Introduction

Ownly is a Flow blockchain–powered NFT and Digital Collectibles platform that allows fans, creators, and brands to mint, trade, and showcase authentic digital assets — from sports highlights to entertainment moments and digital art. Built using Dapper Core APIs and Flow's Access API, Ownly empowers users to truly own their digital world.

**Vision:** "Ownly gives everyone the power to truly own digital moments."

This specification defines the implementation of Dapper Core API integration and Flow blockchain functionality to deliver secure, decentralized NFT operations with real-time updates and seamless wallet connectivity.

## Requirements

### Requirement 1: Wallet Connection and User Identity

**User Story:** As a user, I want to connect my Flow wallet (Dapper/Blocto) to Ownly so that I can access my digital collectibles and perform blockchain transactions.

#### Acceptance Criteria

1. WHEN a user visits the platform THEN the system SHALL display a "Connect Wallet" option
2. WHEN a user clicks "Connect Wallet" THEN the system SHALL use Flow JS SDK + FCL to open supported wallets (Dapper/Blocto)
3. WHEN wallet connection is approved THEN the system SHALL retrieve and store the user's Flow address
4. WHEN wallet is connected THEN the system SHALL display the user's address as their digital identity
5. WHEN wallet connection fails THEN the system SHALL display appropriate error messages
6. WHEN a user disconnects their wallet THEN the system SHALL clear all user session data

### Requirement 2: NFT Minting with Dapper Core API

**User Story:** As a creator, I want to mint new digital collectibles using Dapper Core API so that I can create verified collectibles in the "ownly_collectibles" collection.

#### Acceptance Criteria

1. WHEN a creator uploads media THEN the system SHALL store it on IPFS/NFT.Storage and return a metadata_url
2. WHEN a creator fills metadata form THEN the system SHALL validate title, description, and category fields
3. WHEN a creator submits mint form THEN the system SHALL call POST /v1/nft/mint with metadata_url, recipient address, and collection_id "ownly_collectibles"
4. WHEN Dapper Core API processes mint THEN the system SHALL assign NFT ownership to creator's wallet address
5. WHEN mint transaction completes THEN the system SHALL emit A.<contract>.DapperCollectibles.CollectibleMinted event
6. WHEN mint is successful THEN the system SHALL display the new collectible in creator's dashboard immediately
7. IF mint API call fails THEN the system SHALL display error message and allow retry

### Requirement 3: User Dashboard and Collection Gallery

**User Story:** As a user, I want to view all my owned NFTs in a sleek Ownly Gallery UI so that I can manage my digital collectibles collection.

#### Acceptance Criteria

1. WHEN a user connects wallet THEN the system SHALL query DapperCollectibles contract to get NFT IDs owned by that address
2. WHEN NFT data is retrieved THEN the system SHALL call GET /api/user/:address to fetch user's NFTs
3. WHEN displaying NFTs THEN the system SHALL show image/video preview, title, creator, and metadata for each collectible
4. WHEN user views gallery THEN the system SHALL provide options to view details, transfer, or list for sale
5. WHEN NFT data changes on-chain THEN the system SHALL update the gallery view automatically via event listeners
6. IF no NFTs are owned THEN the system SHALL display appropriate empty state message with call-to-action

### Requirement 4: Marketplace Operations (Buy/Sell/Trade)

**User Story:** As a user, I want to buy and sell NFTs through a decentralized marketplace so that I can participate in the digital collectibles economy.

#### Acceptance Criteria

1. WHEN a user lists NFT for sale THEN the system SHALL call POST /api/marketplace/list endpoint
2. WHEN listing is created THEN the system SHALL execute Flow transaction using DapperMarket contract
3. WHEN another user clicks buy THEN the system SHALL call POST /api/marketplace/buy and prompt wallet confirmation
4. WHEN purchase is confirmed THEN the system SHALL execute fcl.mutate with DapperMarket.purchase transaction
5. WHEN payment completes THEN the system SHALL transfer NFT ownership to buyer via Flow transaction
6. WHEN sale completes THEN the system SHALL emit marketplace events on-chain
7. WHEN marketplace events occur THEN the system SHALL update frontend in real-time via event listeners
8. IF transaction fails THEN the system SHALL display error and maintain previous ownership state

### Requirement 5: Peer-to-Peer NFT Transfer

**User Story:** As a user, I want to transfer my NFTs to other users so that I can gift or send collectibles to friends.

#### Acceptance Criteria

1. WHEN user initiates transfer THEN the system SHALL prompt for recipient's Flow address
2. WHEN recipient address is entered THEN the system SHALL validate the address format
3. WHEN transfer is confirmed THEN the system SHALL call POST /v1/nft/transfer with nft_id, from, and to addresses
4. WHEN API processes transfer THEN the system SHALL emit A.<contract>.DapperCollectibles.CollectibleTransferred event
5. WHEN transfer completes THEN the system SHALL update both users' galleries automatically
6. WHEN transfer fails THEN the system SHALL display error message and maintain current ownership
7. IF recipient address is invalid THEN the system SHALL prevent API call submission

### Requirement 6: Real-time Blockchain Event Monitoring

**User Story:** As a user, I want to see real-time updates when blockchain events occur so that I have an immediate Web3 experience without page refreshes.

#### Acceptance Criteria

1. WHEN system starts THEN it SHALL subscribe to Flow events using fcl.events() for DapperCollectibles contract
2. WHEN A.<contractAddress>.DapperCollectibles.CollectibleMinted event occurs THEN the system SHALL display new drops in real-time
3. WHEN A.<contractAddress>.DapperCollectibles.CollectibleTransferred event occurs THEN the system SHALL update user collections immediately
4. WHEN marketplace events occur THEN the system SHALL refresh marketplace listings via GET /api/events
5. WHEN events are received THEN the system SHALL update UI without requiring page refresh
6. IF event listener connection fails THEN the system SHALL attempt reconnection with exponential backoff
7. WHEN multiple events occur simultaneously THEN the system SHALL process them in correct order

### Requirement 7: Backend Data Management

**User Story:** As a system, I need efficient backend operations to support fast UI loads and secure blockchain interactions while maintaining decentralized ownership.

#### Acceptance Criteria

1. WHEN NFT metadata is created THEN the system SHALL link IPFS assets properly
2. WHEN blockchain data is retrieved THEN the system SHALL cache NFT data for fast UI loads
3. WHEN users search collections THEN the system SHALL provide fast API endpoints for results
4. WHEN communicating with Dapper Core THEN the system SHALL use secure API connections
5. WHEN storing cached data THEN the system SHALL NOT custody any user assets
6. WHEN displaying data THEN the system SHALL only show blockchain-verified information
7. IF cache becomes stale THEN the system SHALL refresh from blockchain source

### Requirement 8: Backend API Endpoints

**User Story:** As a system, I need well-defined API endpoints to handle all NFT operations and provide fast access to blockchain data.

#### Acceptance Criteria

1. WHEN authentication is needed THEN the system SHALL provide POST /api/auth/connect endpoint
2. WHEN minting NFTs THEN the system SHALL provide POST /api/nft/mint endpoint
3. WHEN transferring NFTs THEN the system SHALL provide POST /api/nft/transfer endpoint
4. WHEN listing for sale THEN the system SHALL provide POST /api/marketplace/list endpoint
5. WHEN purchasing NFTs THEN the system SHALL provide POST /api/marketplace/buy endpoint
6. WHEN fetching user NFTs THEN the system SHALL provide GET /api/user/:address endpoint
7. WHEN querying events THEN the system SHALL provide GET /api/events endpoint
8. WHEN API calls are made THEN the system SHALL return appropriate HTTP status codes and error messages

### Requirement 9: Security and Ownership Verification

**User Story:** As a user, I want my NFTs to be securely owned in my wallet with tamper-proof transaction records so that I have true digital ownership.

#### Acceptance Criteria

1. WHEN user owns NFTs THEN they SHALL be stored directly in user's wallet, not platform custody
2. WHEN transactions are signed THEN they SHALL be signed client-side with no private key exposure using fcl.currentUser().authorization
3. WHEN transactions are recorded THEN Flow's finality system SHALL ensure tamper-proof records
4. WHEN displaying ownership THEN the system SHALL verify ownership through blockchain queries
5. IF ownership verification fails THEN the system SHALL not display NFT as owned
6. WHEN security issues are detected THEN the system SHALL prevent unauthorized operations