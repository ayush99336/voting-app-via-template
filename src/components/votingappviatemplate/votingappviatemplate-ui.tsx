"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    useInitializePollMutation,
    useInitializeCandidateMutation,
    useVoteMutation,
    useVotingdappPollsQuery,
    useVotingdappCandidatesByPollId,
} from "./votingappviatemplate-data-access"

export function CreatePollForm() {
    const [pollId, setPollId] = useState(1)
    const [description, setDescription] = useState("")
    const [pollStart, setPollStart] = useState<number>(() => Math.floor(Date.now() / 1000))
    const [pollEnd, setPollEnd] = useState<number>(() => Math.floor(Date.now() / 1000) + 3600)

    const { mutateAsync, isPending } = useInitializePollMutation()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        await mutateAsync({
            pollId: BigInt(pollId),
            description,
            pollStart: BigInt(pollStart),
            pollEnd: BigInt(pollEnd),
        })
        setDescription("")
    }

    return (
        <Card className="p-4 space-y-3">
            <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor="pollId">Poll ID</Label>
                        <Input
                            id="pollId"
                            type="number"
                            value={pollId}
                            onChange={(e) => setPollId(parseInt(e.target.value || "0", 10))}
                            min={0}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the poll"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="pollStart">Start (unix seconds)</Label>
                        <Input
                            id="pollStart"
                            type="number"
                            value={pollStart}
                            onChange={(e) => setPollStart(parseInt(e.target.value || "0", 10))}
                            min={0}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="pollEnd">End (unix seconds)</Label>
                        <Input
                            id="pollEnd"
                            type="number"
                            value={pollEnd}
                            onChange={(e) => setPollEnd(parseInt(e.target.value || "0", 10))}
                            min={0}
                            required
                        />
                    </div>
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Poll"}
                </Button>
            </form>
        </Card>
    )
}

export function PollList() {
    const { data, isLoading, isError } = useVotingdappPollsQuery()

    if (isLoading) return <div>Loading polls...</div>
    if (isError) return <div>Failed to load polls</div>

    if (!data || data.length === 0) return <div>No polls yet.</div>

    return (
        <div className="space-y-4">
            {data.map((poll) => (
                <PollItem
                    key={poll.address}
                    pollId={Number(poll.data.pollId)}
                    description={poll.data.description}
                    pollStart={Number(poll.data.pollStart)}
                    pollEnd={Number(poll.data.pollEnd)}
                />
            ))}
        </div>
    )
}

function PollItem({ pollId, description, pollStart, pollEnd }: { pollId: number; description: string; pollStart: number; pollEnd: number }) {
    const [candidateName, setCandidateName] = useState("")
    const { mutateAsync: addCandidate, isPending: isAdding } = useInitializeCandidateMutation()
    const { mutateAsync: vote, isPending: isVoting } = useVoteMutation()
    const candidatesQuery = useVotingdappCandidatesByPollId(pollId)

    async function onAddCandidate(e: React.FormEvent) {
        e.preventDefault()
        await addCandidate({ pollId: BigInt(pollId), candidateName })
        setCandidateName("")
    }

    // Vote handler is triggered on each candidate row's button; no standalone form submit here.

    return (
        <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="font-medium">Poll #{pollId}</div>
                <Button variant="outline" size="sm" onClick={() => candidatesQuery.refetch()}>
                    Refresh
                </Button>
            </div>
            <div className="text-sm text-muted-foreground">{description}</div>

            <div className="text-sm text-muted-foreground flex gap-3">
                <div>
                    <span className="font-medium">Start:</span> {new Date(pollStart * 1000).toLocaleString()}
                </div>
                <div>
                    <span className="font-medium">End:</span> {new Date(pollEnd * 1000).toLocaleString()}
                </div>
            </div>

            <form onSubmit={onAddCandidate} className="flex gap-2 items-end">
                <div className="flex-1">
                    <Label htmlFor={`candidate-${pollId}`}>Candidate name</Label>
                    <Input
                        id={`candidate-${pollId}`}
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value.slice(0, 28))}
                        placeholder="e.g. Alice"
                        required
                    />
                </div>
                <div className="text-xs text-muted-foreground">Max 28 characters to fit PDA seed</div>
                <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Candidate"}
                </Button>
            </form>

            {candidatesQuery.data?.length ? (
                (() => {
                    const total = candidatesQuery.data.reduce((sum, c) => sum + Number(c.data.candidateVotes), 0)
                    if (total === 0) return null
                    return (
                        <div className="space-y-1">
                            <div className="text-sm">Total votes: {total}</div>
                            {candidatesQuery.data.map((c) => {
                                const votes = Number(c.data.candidateVotes)
                                const pct = Math.round((votes / total) * 100)
                                return (
                                    <div key={`bar-${c.address}`} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>{c.data.candidateName}</span>
                                            <span>{votes} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded">
                                            <div className="h-2 bg-primary rounded" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })()
            ) : null}

            {candidatesQuery.isLoading ? (
                <div>Loading candidates…</div>
            ) : candidatesQuery.isError ? (
                <div className="text-red-500 text-sm">Failed to load candidates</div>
            ) : (
                <div className="space-y-2">
                    {candidatesQuery.data?.length ? (
                        candidatesQuery.data.map((c) => (
                            <div key={c.address} className="flex items-center justify-between border rounded p-2">
                                <div>
                                    <div className="font-medium">{c.data.candidateName}</div>
                                    <div className="text-xs text-muted-foreground">Votes: {Number(c.data.candidateVotes)}</div>
                                </div>
                                <Button
                                    onClick={() => vote({ pollId: BigInt(pollId), candidateName: c.data.candidateName })}
                                    disabled={isVoting}
                                >
                                    {isVoting ? "Voting…" : "Vote"}
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground">No candidates yet.</div>
                    )}
                </div>
            )}
        </Card>
    )
}
