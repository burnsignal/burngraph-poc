import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotals } from "../generated/schema"
import { getQuadraticTotals } from "./quadraticTotals"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let proposalId = event.params.name
  let transactionHash = event.transaction.hash.toHex()
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

  let quadraticTotals = getQuadraticTotals(burners as Array<String>)

  quadratics.approve = quadraticTotals[0]
  quadratics.decline = quadraticTotals[1]
  quadratics.total = quadraticTotals[2]
  quadratics.proposal = proposalId
  quadratics.burners = burners
  quadratics.save()
}
