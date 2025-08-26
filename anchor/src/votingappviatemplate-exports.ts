// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, address, getBase58Decoder, SolanaClient } from 'gill'
import { SolanaClusterId } from '@wallet-ui/react'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Votingappviatemplate, VOTINGAPPVIATEMPLATE_DISCRIMINATOR, VOTINGAPPVIATEMPLATE_PROGRAM_ADDRESS, getVotingappviatemplateDecoder } from './client/js'
import VotingappviatemplateIDL from '../target/idl/votingappviatemplate.json'

export type VotingappviatemplateAccount = Account<Votingappviatemplate, string>

// Re-export the generated IDL and type
export { VotingappviatemplateIDL }

// This is a helper function to get the program ID for the Votingappviatemplate program depending on the cluster.
export function getVotingappviatemplateProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
    case 'solana:devnet':
    case 'solana:testnet':
      // This is the program ID for the Votingappviatemplate program on devnet and testnet.
      return address('6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF')
    case 'solana:mainnet':
    default:
      return VOTINGAPPVIATEMPLATE_PROGRAM_ADDRESS
  }
}

export * from './client/js'

export function getVotingappviatemplateProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getVotingappviatemplateDecoder(),
    filter: getBase58Decoder().decode(VOTINGAPPVIATEMPLATE_DISCRIMINATOR),
    programAddress: VOTINGAPPVIATEMPLATE_PROGRAM_ADDRESS,
  })
}
