import { Issue as IssueEvent} from "../generated/VoteProposalPool/VoteProposalPool"
import { VoteOption } from "../generated/VoteProposalPool/templates"
import { Issue, User } from "../generated/schema"
import { Address } from "@graphprotocol/graph-ts";
import { initialiseUser } from "./operations.ts"

export function handleIssue(event: IssueEvent): void {
  let entity = new newProposalIssued(event.transaction.hash.toHex())
  entity.issuer  = event.params.issuer
  entity.deadline = event.params.deadline
  entity.title = event.params.name
  entity.body = event.params.data
  entity.optionA = event.params.optionA
  entity.optionAaddr = event.params.optionAaddr
  entity.optionB = event.params.optionB
  entity.optionBaddr = event.params.optionBaddr
  entity.save()

  VoteOption.create(entity.optionAaddr as Address)
  VoteOption.create(entity.optionBaddr as Address)
  storeIssue(event)
}

function storeIssue(event: IssueEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let address = event.params.from.toHexString()
  let user = initialiseUser(user)
  let polls = user.polls
  
  polls.push(event.params.name)

  user.polls = polls
  user.save()
}
