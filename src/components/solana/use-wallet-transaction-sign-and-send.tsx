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
      // Wallet UI client exposes simulateTransaction bound to its RPC
      const sim = await (client as any).simulateTransaction(transaction, { commitment: 'processed' })
      const err: any = (sim as any)?.value?.err
      const logs: string[] | undefined = (sim as any)?.value?.logs
      if (err) {
        const reason = typeof err === 'string' ? err : JSON.stringify(err)
        const logText = logs?.length ? `\nLogs:\n${logs.join('\n')}` : ''
        throw new Error(`Simulation failed: ${reason}${logText}`)
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
