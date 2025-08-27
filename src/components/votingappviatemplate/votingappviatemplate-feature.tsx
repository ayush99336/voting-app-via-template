"use client"

import { useWalletUi } from "@wallet-ui/react"
import { AppHero } from "../app-hero"
import { CreatePollForm, PollList } from "./votingappviatemplate-ui"

export default function VotingappviatemplateFeature() {
    const { account } = useWalletUi()

    return (
        <div>
            <AppHero title="Voting Dapp" subtitle="Create polls and vote for your favorite candidates." />
            {account ? (
                <div className="space-y-8">
                    <CreatePollForm />
                    <PollList />
                </div>
            ) : (
                <div className="text-center">Connect your wallet to start.</div>
            )}
        </div>
    )
}
