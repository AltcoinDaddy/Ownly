// Dapper Core API Integration - Main Export

export { dapperClient, DapperClient } from './client'
export { dapperService, DapperService } from './service'
export { getDapperConfig, DAPPER_ENDPOINTS, DAPPER_COLLECTION_ID } from './config'
export type {
  DapperConfig,
  DapperMintRequest,
  DapperMintResponse,
  DapperTransferRequest,
  DapperTransferResponse,
  DapperMarketplaceListRequest,
  DapperMarketplaceBuyRequest,
  DapperMarketplaceResponse,
  DapperUserResponse,
  DapperEventsResponse,
  DapperError
} from './types'
export { DapperAPIError, DapperErrorType } from './types'