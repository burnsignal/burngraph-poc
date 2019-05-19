import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit } from "../generated/schema"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let entity = new AnonymousDeposit(event.transaction.hash.toHex())
  entity.SenderAddr = event.params.from
  entity.ContriValue = event.params.value
  entity.PropName = event.params.name
  entity.Choice = event.params.option
  entity.save()
}