import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotals } from "../generated/schema"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let entity = new AnonymousDeposit(event.transaction.hash.toHex())
  let proposal = QuadraticTotals.load(event.params.name)

  entity.timestamp = event.block.timestamp
  entity.signaller = event.params.from
  entity.value = event.params.value
  entity.proposal = event.params.name
  entity.choice = event.params.option
  
  entity.save()
}
