import { newProposalIssued as IssueEvent } from "../generated/VoteProposalPool/VoteProposalPool"
import { VoteOption } from "../generated/templates"
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Issue, User } from "../generated/schema"

export function handleIssue(event: IssueEvent): void {
  let entity = new Issue(event.transaction.hash.toHex())
  entity.issuer  = event.params.issuer
  entity.deadline = event.params.deadline
  entity.poll = event.params.proposal
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
  let address = event.transaction.from.toHexString()
  let user = initialiseUser(address)
  let polls = user.polls

  polls.push(event.params.name)

  user.polls = polls
  user.save()
}

export function initialiseUser(address: string): User {
  let user = User.load(address)

  if(user == null){
    user = new User(address)
    user.burns = new Array<string>()
    user.polls = new Array<string>()
    user.burned = BigInt.fromI32(0)
  } return user as User
}
