import { useWalletUi } from '@wallet-ui/react'
import type { Instruction, TransactionSendingSigner } from 'gill'
import { createTransaction, getBase58Decoder, signAndSendTransactionMessageWithSigners } from 'gill'

export function useWalletTransactionSignAndSend() {
  const { client } = useWalletUi()

  return async (ix: Instruction | Instruction[], signer: TransactionSendingSigner) => {
    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send()

    const transaction = createTransaction({
      feePayer: signer,
      version: 0,
      latestBlockhash,
      instructions: Array.isArray(ix) ? ix : [ix],
    })

    // Pre-flight simulation to surface detailed errors/logs.
    try {
      type SimResult = { value?: { err?: unknown; logs?: string[] } }
      type SimulateFn = (tx: unknown, opts?: { commitment?: 'processed' | 'confirmed' | 'finalized' }) => Promise<SimResult>
      const simulate = (client as { simulateTransaction?: SimulateFn }).simulateTransaction
      if (simulate) {
        const sim = await simulate(transaction as unknown, { commitment: 'processed' })
        const err = sim?.value?.err
        const logs = sim?.value?.logs
        if (err) {
          const reason = typeof err === 'string' ? err : JSON.stringify(err)
          const logText = logs?.length ? `\nLogs:\n${logs.join('\n')}` : ''
          throw new Error(`Simulation failed: ${reason}${logText}`)
        }
      }
    } catch (e) {
      // If simulation RPC fails for some reason, continue to send so wallets can show their own errors.
      // But still rethrow if it's a simulated program error.
      if (e instanceof Error && e.message.startsWith('Simulation failed')) {
        throw e
      }
    }

    const signature = await signAndSendTransactionMessageWithSigners(transaction)

    return getBase58Decoder().decode(signature)
  }
}
