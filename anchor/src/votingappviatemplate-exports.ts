// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, address, getBase58Decoder, SolanaClient } from 'gill'
import { PublicKey } from '@solana/web3.js'
import { SolanaClusterId } from '@wallet-ui/react'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import {
  Poll,
  Candidate,
  VOTINGDAPP_PROGRAM_ADDRESS,
  getPollDecoder,
  getCandidateDecoder,
  POLL_DISCRIMINATOR,
  CANDIDATE_DISCRIMINATOR,
} from './client/js'
import VotingdappIDL from '../target/idl/votingdapp.json'

export type VotingdappPollAccount = Account<Poll, string>
export type VotingdappCandidateAccount = Account<Candidate, string>

// Re-export the generated IDL and type
export { VotingdappIDL }

// This is a helper function to get the program ID for the Votingdapp program depending on the cluster.
export function getVotingdappProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
    case 'solana:devnet':
    case 'solana:testnet':
      // This is the program ID for the Votingdapp program on devnet and testnet.
      return address('M93Hz8r6aaDDP7J5iKdJb3ZWrcE2RCJ8P8rFyPV6rvU')
    case 'solana:mainnet':
    default:
      return VOTINGDAPP_PROGRAM_ADDRESS
  }
}

export * from './client/js'

export function getVotingdappPollAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getPollDecoder(),
    filter: getBase58Decoder().decode(POLL_DISCRIMINATOR),
    programAddress: VOTINGDAPP_PROGRAM_ADDRESS,
  })
}

export function getVotingdappCandidateAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getCandidateDecoder(),
    filter: getBase58Decoder().decode(CANDIDATE_DISCRIMINATOR),
    programAddress: VOTINGDAPP_PROGRAM_ADDRESS,
  })
}
