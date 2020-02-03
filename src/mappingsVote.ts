import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotals, Burner } from "../generated/schema"
import { getQuadraticTotals } from "./quadraticTotals.ts"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let proposalId = event.params.name.toHex()
  let entity = new AnonymousDeposit(transactionHash)
  let proposal = QuadraticTotals.load(proposalId)

  if(proposal === null) proposal = new QuadraticTotals(proposalId)

  entity.timestamp = event.block.timestamp
  entity.signaller = event.params.from
  entity.choice = event.params.option
  entity.value = event.params.value
  entity.proposal = proposalId
  entity.save()

  let burners = proposal.burners
  burners.push(transactionHash)

  let quadraticTotals = getQuadraticTotals(burners)

  proposal.decline = quadraticTotals.reject
  proposal.approve = quadraticTotals.pass
  proposal.total = quadraticTotals.sum
  proposal.burners = burners
  proposal.save()
}
