import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchVotingappviatemplate,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('votingappviatemplate', () => {
  let payer: KeyPairSigner
  let votingappviatemplate: KeyPairSigner

  beforeAll(async () => {
    votingappviatemplate = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Votingappviatemplate', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, votingappviatemplate: votingappviatemplate })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentVotingappviatemplate = await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    expect(currentVotingappviatemplate.data.count).toEqual(0)
  })

  it('Increment Votingappviatemplate', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      votingappviatemplate: votingappviatemplate.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Votingappviatemplate Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ votingappviatemplate: votingappviatemplate.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Votingappviatemplate', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      votingappviatemplate: votingappviatemplate.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set votingappviatemplate value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ votingappviatemplate: votingappviatemplate.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the votingappviatemplate account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      votingappviatemplate: votingappviatemplate.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchVotingappviatemplate(rpc, votingappviatemplate.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${votingappviatemplate.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
