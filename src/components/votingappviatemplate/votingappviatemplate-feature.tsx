import { WalletButton } from '../solana/solana-provider'
import { VotingappviatemplateButtonInitialize, VotingappviatemplateList, VotingappviatemplateProgramExplorerLink, VotingappviatemplateProgramGuard } from './votingappviatemplate-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function VotingappviatemplateFeature() {
  const { account } = useWalletUi()

  return (
    <VotingappviatemplateProgramGuard>
      <AppHero
        title="Votingappviatemplate"
        subtitle={
          account
            ? "Initialize a new votingappviatemplate onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <VotingappviatemplateProgramExplorerLink />
        </p>
        {account ? (
          <VotingappviatemplateButtonInitialize />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletButton />
          </div>
        )}
      </AppHero>
      {account ? <VotingappviatemplateList /> : null}
    </VotingappviatemplateProgramGuard>
  )
}
