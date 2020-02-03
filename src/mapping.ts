import { newProposalIssued as newProposalIssuedEvent} from "../generated/VoteProposalPool/VoteProposalPool"
import { VoteOption } from "../generated/VoteProposalPool/templates"
import { newProposalIssued } from "../generated/schema"
import { Address } from "@graphprotocol/graph-ts";

export function handleFundsSent(event: newProposalIssuedEvent): void {
  let entity = new newProposalIssued(event.transaction.hash.toHex())
  entity.issuer  = event.params.issuer
  entity.deadline = event.params.deadline
  entity.name = event.params.name
  entity.data = event.params.data
  entity.optionA = event.params.optionA
  entity.optionAaddr = event.params.optionAaddr
  entity.optionB = event.params.optionB
  entity.optionBaddr = event.params.optionBaddr
  entity.save()

  VoteOption.create(entity.optionAaddr as Address)
  VoteOption.create(entity.optionBaddr as Address)
}
