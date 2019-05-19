import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/Contract/Contract"
import { AnonymousDeposit } from "../generated/schema"

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let entity = new AnonymousDeposit(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.value = event.params.value
  entity.name = event.params.name
  entity.option = event.params.option
  entity.save()
}
