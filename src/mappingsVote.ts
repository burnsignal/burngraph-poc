import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit } from "../generated/schema"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let entity = new AnonymousDeposit(event.transaction.hash.toHex())

  entity.timestamp = event.block.timestamp
  entity.signaller = event.params.from
  entity.proposal = event.params.name
  entity.choice = event.params.option
  entity.value = event.params.value
  entity.save()
}
