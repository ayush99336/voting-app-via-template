import {
  VotingappviatemplateAccount,
  getCloseInstruction,
  getVotingappviatemplateProgramAccounts,
  getVotingappviatemplateProgramId,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '@project/anchor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { generateKeyPairSigner } from 'gill'
import { useWalletUi } from '@wallet-ui/react'
import { useWalletTransactionSignAndSend } from '../solana/use-wallet-transaction-sign-and-send'
import { useClusterVersion } from '@/components/cluster/use-cluster-version'
import { toastTx } from '@/components/toast-tx'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { install as installEd25519 } from '@solana/webcrypto-ed25519-polyfill'

// polyfill ed25519 for browsers (to allow `generateKeyPairSigner` to work)
installEd25519()

export function useVotingappviatemplateProgramId() {
  const { cluster } = useWalletUi()
  return useMemo(() => getVotingappviatemplateProgramId(cluster.id), [cluster])
}

export function useVotingappviatemplateProgram() {
  const { client, cluster } = useWalletUi()
  const programId = useVotingappviatemplateProgramId()
  const query = useClusterVersion()

  return useQuery({
    retry: false,
    queryKey: ['get-program-account', { cluster, clusterVersion: query.data }],
    queryFn: () => client.rpc.getAccountInfo(programId).send(),
  })
}

export function useVotingappviatemplateInitializeMutation() {
  const { cluster } = useWalletUi()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => {
      const votingappviatemplate = await generateKeyPairSigner()
      return await signAndSend(getInitializeInstruction({ payer: signer, votingappviatemplate }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await queryClient.invalidateQueries({ queryKey: ['votingappviatemplate', 'accounts', { cluster }] })
    },
    onError: () => toast.error('Failed to run program'),
  })
}

export function useVotingappviatemplateDecrementMutation({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const invalidateAccounts = useVotingappviatemplateAccountsInvalidate()
  const signer = useWalletUiSigner()
  const signAndSend = useWalletTransactionSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ votingappviatemplate: votingappviatemplate.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingappviatemplateIncrementMutation({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const invalidateAccounts = useVotingappviatemplateAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ votingappviatemplate: votingappviatemplate.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingappviatemplateSetMutation({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const invalidateAccounts = useVotingappviatemplateAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          votingappviatemplate: votingappviatemplate.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingappviatemplateCloseMutation({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const invalidateAccounts = useVotingappviatemplateAccountsInvalidate()
  const signAndSend = useWalletTransactionSignAndSend()
  const signer = useWalletUiSigner()

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, votingappviatemplate: votingappviatemplate.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}

export function useVotingappviatemplateAccountsQuery() {
  const { client } = useWalletUi()

  return useQuery({
    queryKey: useVotingappviatemplateAccountsQueryKey(),
    queryFn: async () => await getVotingappviatemplateProgramAccounts(client.rpc),
  })
}

function useVotingappviatemplateAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useVotingappviatemplateAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}

function useVotingappviatemplateAccountsQueryKey() {
  const { cluster } = useWalletUi()

  return ['votingappviatemplate', 'accounts', { cluster }]
}
