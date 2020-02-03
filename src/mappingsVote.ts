import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotals, Burner } from "../generated/schema"
import { getQuadraticTotals } from "./quadraticTotals.ts"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let proposalId = event.params.name.toHex()
  let entity = new AnonymousDeposit(transactionHash)
  let quadratics = QuadraticTotals.load(proposalId)

  if(quadratics === null) quadratics = new QuadraticTotals(proposalId)

  entity.timestamp = event.block.timestamp
  entity.signaller = event.params.from
  entity.choice = event.params.option
  entity.value = event.params.value
  entity.proposal = proposalId
  entity.save()

  let burners = quadratics.burners
  burners.push(transactionHash)

  let quadraticTotals = getQuadraticTotals(burners)

  quadratics.decline = quadraticTotals.reject
  quadratics.approve = quadraticTotals.pass
  quadratics.total = quadraticTotals.sum
  quadratics.proposal = proposalId
  quadratics.burners = burners
  quadratics.save()
}
