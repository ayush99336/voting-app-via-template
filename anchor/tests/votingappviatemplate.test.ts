import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import assert from 'assert'
import { Votingdapp } from '../target/types/votingdapp'

describe('votingdapp (concise)', () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.votingdapp as Program<Votingdapp>

  // test wallets
  const creator = anchor.web3.Keypair.generate()
  const voter1 = anchor.web3.Keypair.generate()
  const voter2 = anchor.web3.Keypair.generate()

  // helpers
  async function airdrop(pubkey: PublicKey, lamports = 2 * LAMPORTS_PER_SOL) {
    const sig = await program.provider.connection.requestAirdrop(pubkey, lamports)
    await program.provider.connection.confirmTransaction(sig, 'confirmed')
  }

  const u64le = (n: number | bigint) => {
    const b = Buffer.alloc(8)
    b.writeBigUInt64LE(BigInt(n))
    return b
  }
  const getPollPda = (pollId: number) =>
    anchor.web3.PublicKey.findProgramAddressSync([u64le(pollId)], program.programId)
  const getCandidatePda = (pollId: number, name: string) =>
    anchor.web3.PublicKey.findProgramAddressSync([u64le(pollId), Buffer.from(name)], program.programId)

  // constants
  const POLL_ID = 1
  const DESC = 'What is your favorite peanut butter?'
  const CAND_A = 'Smooth'
  const CAND_B = 'Crunchy'

  it('fund wallets', async () => {
    await airdrop(creator.publicKey)
    await airdrop(voter1.publicKey)
    await airdrop(voter2.publicKey)
  })

  it('initialize poll', async () => {
    const [pollPda] = getPollPda(POLL_ID)

    const pollStart = new BN(0)
    const pollEnd = new BN(Math.floor(Date.now() / 1000) + 3600)

    await program.methods
      .initializePoll(new BN(POLL_ID), DESC, pollStart, pollEnd)
      .accounts({ signer: creator.publicKey, poll: pollPda, systemProgram: anchor.web3.SystemProgram.programId })
      .signers([creator])
      .rpc()

    const poll = await program.account.poll.fetch(pollPda)
    assert.equal(poll.pollId.toNumber(), POLL_ID)
    assert.equal(poll.description, DESC)
    assert.equal(poll.pollOptionIndex.toNumber(), 0)
  })

  it('initialize candidates', async () => {
    const [pollPda] = getPollPda(POLL_ID)
    const [candA] = getCandidatePda(POLL_ID, CAND_A)
    const [candB] = getCandidatePda(POLL_ID, CAND_B)

    await program.methods
      .initializeCandidate(CAND_A, new BN(POLL_ID))
      .accounts({
        signer: creator.publicKey,
        poll: pollPda,
        candidate: candA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc()

    await program.methods
      .initializeCandidate(CAND_B, new BN(POLL_ID))
      .accounts({
        signer: creator.publicKey,
        poll: pollPda,
        candidate: candB,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc()

    const smooth = await program.account.candidate.fetch(candA)
    const crunchy = await program.account.candidate.fetch(candB)
    assert.equal(smooth.candidateName, CAND_A)
    assert.equal(crunchy.candidateName, CAND_B)

    const pollAfter = await program.account.poll.fetch(pollPda)
    assert.equal(pollAfter.pollOptionIndex.toNumber(), 2)
  })

  it('vote and verify counts', async () => {
    const [pollPda] = getPollPda(POLL_ID)
    const [candA] = getCandidatePda(POLL_ID, CAND_A)

    await program.methods
      .vote(CAND_A, new BN(POLL_ID))
      .accounts({
        voter: voter1.publicKey,
        candidate: candA,
        poll: pollPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter1])
      .rpc()

    await program.methods
      .vote(CAND_A, new BN(POLL_ID))
      .accounts({
        voter: voter2.publicKey,
        candidate: candA,
        poll: pollPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([voter2])
      .rpc()

    const after = await program.account.candidate.fetch(candA)
    assert.equal(after.candidateVotes.toNumber(), 2)
  })
})
