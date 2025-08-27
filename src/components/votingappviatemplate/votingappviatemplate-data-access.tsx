"use client"

import {
  VotingdappPollAccount,
  VotingdappCandidateAccount,
  getVotingdappPollAccounts,
  getVotingdappCandidateAccounts,
  getVotingdappProgramId,
  getInitializePollInstructionAsync,
  getInitializeCandidateInstructionAsync,
  getVoteInstructionAsync,
} from "@project/anchor"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"
import { useWalletUi } from "@wallet-ui/react"
import { useWalletTransactionSignAndSend } from "../solana/use-wallet-transaction-sign-and-send"
import { useWalletUiSigner } from "@/components/solana/use-wallet-ui-signer"
import { getProgramDerivedAddress, getU64Encoder, getUtf8Encoder } from "gill"

export function useVotingdappProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getVotingdappProgramId(cluster.id), [cluster])
}

export function useVotingdappClient() {
  const { client } = useWalletUi()
  return client
}

export function useVotingdappPollsQuery() {
  const client = useVotingdappClient()
  return useQuery({
    queryKey: ["votingdapp", "polls"],
    queryFn: async () => {
      if (!client) return [] as VotingdappPollAccount[]
      return await getVotingdappPollAccounts(client.rpc)
    },
    enabled: !!client,
  })
}

export function useVotingdappCandidatesQuery() {
  const client = useVotingdappClient()
  return useQuery({
    queryKey: ["votingdapp", "candidates"],
    queryFn: async () => {
      if (!client) return [] as VotingdappCandidateAccount[]
      return await getVotingdappCandidateAccounts(client.rpc)
    },
    enabled: !!client,
  })
}

export function useVotingdappCandidatesByPollId(pollId: number | bigint) {
  const client = useVotingdappClient()
  const programId = useVotingdappProgramId()
  return useQuery({
    queryKey: ["votingdapp", "candidates-by-poll", programId.toString(), String(pollId)],
    queryFn: async () => {
      if (!client) return [] as VotingdappCandidateAccount[]
      const all = await getVotingdappCandidateAccounts(client.rpc)
      // Filter by matching the PDA for this pollId and candidateName
      const filtered: VotingdappCandidateAccount[] = []
      for (const cand of all) {
        const name = cand.data.candidateName
        const [expectedAddr] = await getProgramDerivedAddress({
          programAddress: programId,
          seeds: [
            getU64Encoder().encode(BigInt(pollId)),
            getUtf8Encoder().encode(name),
          ],
        })
        if (String(expectedAddr) === String(cand.address)) {
          filtered.push(cand)
        }
      }
      return filtered
    },
    enabled: !!client && !!programId && pollId !== undefined && pollId !== null,
  })
}

export function useInitializePollMutation() {
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()
  const queryClient = useQueryClient()
  const programId = useVotingdappProgramId()

  return useMutation({
    mutationKey: ["votingdapp", "initializePoll"],
    mutationFn: async (args: { pollId: number | bigint; description: string; pollStart: number | bigint; pollEnd: number | bigint }) => {
      const ix = await getInitializePollInstructionAsync(
        {
          signer,
          pollId: args.pollId,
          description: args.description,
          pollStart: args.pollStart,
          pollEnd: args.pollEnd,
        },
        { programAddress: programId }
      )
      return await signAndSend(ix, signer)
    },
    onSuccess: (sig: string) => {
      toast.success(`Initialized poll. Tx: ${sig}`)
      // Refresh all poll lists
      queryClient.invalidateQueries({ queryKey: ["votingdapp"] })
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Initialize poll failed'
      toast.error(msg)
    },
  })
}

export function useInitializeCandidateMutation() {
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()
  const queryClient = useQueryClient()
  const programId = useVotingdappProgramId()

  return useMutation({
    mutationKey: ["votingdapp", "initializeCandidate"],
    mutationFn: async (args: { pollId: number | bigint; candidateName: string }) => {
      const [pollAddress] = await getProgramDerivedAddress({
        programAddress: programId,
        seeds: [getU64Encoder().encode(BigInt(args.pollId))],
      })
      const [candidateAddress] = await getProgramDerivedAddress({
        programAddress: programId,
        seeds: [
          getU64Encoder().encode(BigInt(args.pollId)),
          // IMPORTANT: raw UTF-8 bytes, no length prefix, to match Anchor seeds
          getUtf8Encoder().encode(args.candidateName),
        ],
      })

      const ix = await getInitializeCandidateInstructionAsync(
        {
          signer,
          poll: pollAddress,
          candidate: candidateAddress,
          pollId: args.pollId,
          candidateName: args.candidateName,
        },
        { programAddress: programId }
      )
      return await signAndSend(ix, signer)
    },
    onSuccess: (sig: string) => {
      toast.success(`Initialized candidate. Tx: ${sig}`)
      // Refresh candidate list (prefix match) and global caches
      queryClient.invalidateQueries({ queryKey: ["votingdapp", "candidates-by-poll"] })
      queryClient.invalidateQueries({ queryKey: ["votingdapp", "candidates"] })
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Initialize candidate failed'
      toast.error(msg)
    },
  })
}

export function useVoteMutation() {
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()
  const queryClient = useQueryClient()
  const programId = useVotingdappProgramId()

  return useMutation({
    mutationKey: ["votingdapp", "vote"],
    mutationFn: async (args: { pollId: number | bigint; candidateName: string }) => {
      const [pollAddress] = await getProgramDerivedAddress({
        programAddress: programId,
        seeds: [getU64Encoder().encode(BigInt(args.pollId))],
      })
      const [candidateAddress] = await getProgramDerivedAddress({
        programAddress: programId,
        seeds: [
          getU64Encoder().encode(BigInt(args.pollId)),
          getUtf8Encoder().encode(args.candidateName),
        ],
      })

      const ix = await getVoteInstructionAsync(
        {
          voter: signer,
          poll: pollAddress,
          candidate: candidateAddress,
          pollId: args.pollId,
          candidateName: args.candidateName,
        },
        { programAddress: programId }
      )
      return await signAndSend(ix, signer)
    },
    onSuccess: (sig: string) => {
      toast.success(`Voted. Tx: ${sig}`)
      // Refresh candidate list (prefix match) and global caches
      queryClient.invalidateQueries({ queryKey: ["votingdapp", "candidates-by-poll"] })
      queryClient.invalidateQueries({ queryKey: ["votingdapp", "candidates"] })
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Vote failed'
      toast.error(msg)
    },
  })
}
