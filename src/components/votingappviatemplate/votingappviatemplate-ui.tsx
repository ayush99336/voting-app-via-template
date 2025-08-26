import { ellipsify } from '@wallet-ui/react'
import {
  useVotingappviatemplateAccountsQuery,
  useVotingappviatemplateCloseMutation,
  useVotingappviatemplateDecrementMutation,
  useVotingappviatemplateIncrementMutation,
  useVotingappviatemplateInitializeMutation,
  useVotingappviatemplateProgram,
  useVotingappviatemplateProgramId,
  useVotingappviatemplateSetMutation,
} from './votingappviatemplate-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import { VotingappviatemplateAccount } from '@project/anchor'
import { ReactNode } from 'react'

export function VotingappviatemplateProgramExplorerLink() {
  const programId = useVotingappviatemplateProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function VotingappviatemplateList() {
  const votingappviatemplateAccountsQuery = useVotingappviatemplateAccountsQuery()

  if (votingappviatemplateAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!votingappviatemplateAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {votingappviatemplateAccountsQuery.data?.map((votingappviatemplate) => (
        <VotingappviatemplateCard key={votingappviatemplate.address} votingappviatemplate={votingappviatemplate} />
      ))}
    </div>
  )
}

export function VotingappviatemplateProgramGuard({ children }: { children: ReactNode }) {
  const programAccountQuery = useVotingappviatemplateProgram()

  if (programAccountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!programAccountQuery.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return children
}

function VotingappviatemplateCard({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Votingappviatemplate: {votingappviatemplate.data.count}</CardTitle>
        <CardDescription>
          Account: <ExplorerLink address={votingappviatemplate.address} label={ellipsify(votingappviatemplate.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <VotingappviatemplateButtonIncrement votingappviatemplate={votingappviatemplate} />
          <VotingappviatemplateButtonSet votingappviatemplate={votingappviatemplate} />
          <VotingappviatemplateButtonDecrement votingappviatemplate={votingappviatemplate} />
          <VotingappviatemplateButtonClose votingappviatemplate={votingappviatemplate} />
        </div>
      </CardContent>
    </Card>
  )
}

export function VotingappviatemplateButtonInitialize() {
  const mutationInitialize = useVotingappviatemplateInitializeMutation()

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Votingappviatemplate {mutationInitialize.isPending && '...'}
    </Button>
  )
}

export function VotingappviatemplateButtonIncrement({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const incrementMutation = useVotingappviatemplateIncrementMutation({ votingappviatemplate })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}

export function VotingappviatemplateButtonSet({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const setMutation = useVotingappviatemplateSetMutation({ votingappviatemplate })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', votingappviatemplate.data.count.toString() ?? '0')
        if (!value || parseInt(value) === votingappviatemplate.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}

export function VotingappviatemplateButtonDecrement({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const decrementMutation = useVotingappviatemplateDecrementMutation({ votingappviatemplate })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}

export function VotingappviatemplateButtonClose({ votingappviatemplate }: { votingappviatemplate: VotingappviatemplateAccount }) {
  const closeMutation = useVotingappviatemplateCloseMutation({ votingappviatemplate })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
