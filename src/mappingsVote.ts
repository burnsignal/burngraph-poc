import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, Proposal, Signaller } from "../generated/schema"
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"

function legacyNumber(number: BigInt): number {
  let decimal = new BigDecimal(number)
  return parseInt(number.toString())
}

export function handleAnonymousDeposit(event: AnonymousDepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let entity = new AnonymousDeposit(transactionHash)

  entity.timestamp = event.block.timestamp
  entity.signaller = event.params.from
  entity.proposal = event.params.name
  entity.choice = event.params.option
  entity.value = event.params.value
  entity.save()

  storeSignallerMetadata(event)
  storeProposal(event)
}

function storeSignallerMetadata(event: AnonymousDepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let signaller = Signaller.load(event.params.from)

  if(signaller == null) signaller = new Signaller(event.params.from)

  let total: BigInt = signaller.burned + event.params.value
  let burns: string[] = signaller.burns

  if(burns == null) burns = new Array()

  burns.push(transactionHash)

  signaller.burned = total
  signaller.burns = burns
  signaller.save()
}

function storeProposal(event: AnonymousDepositEvent): void {
  let proposalId = event.params.name
  let transactionHash = event.transaction.hash.toHex()
  let proposal = Proposal.load(proposalId)

  if(proposal == null) proposal = new Proposal(proposalId)

  let burns :string[] = proposal.burn as Array<string>
  let rejections: Option = proposal.reject
  let approvals: Option = proposal.approve

  if(rejections == null) rejections = new Option(`${proposalId}@no`)
  if(approvals == null) approvals = new Option(`${proposalId}@yes`)
  if(burners == null) burners = new Array()

  if(event.params.choice == "no") storeOption(rejections, event)
  else if(event.params.choice == "yes") storeOption(approvals, event)

  proposal.sum = event.params.value + proposal.sum
  proposal.reject = rejections
  proposal.approve = approvals
  proposal.burns = burns
  proposal.save()
}

function storeOption(option: Option, event: AnonymousDepositEvent): void {
  let contributions = option.contributions
  let quadratics = option.quadratics
  let signallers = option.signallers
  let burn: BigInt = event.params.value
  let signaller: Bytes = event.params.from
  let parsed: string = ""

  if(quadratics.length > 0){
    let previous: string = quadratics[quadratics.length-1]
    let quad: number = Math.sqrt(parseInt(previous) + legacyNumber(burn))
    parsed = quad.toString()
  } else {
    let neophyte: number = Math.sqrt(legacyNumber(burn))
    parsed = neophyte.toString()
  }

  signallers.push(signaller)
  contributions.push(burn)
  quadratics.push(parsed)

  option.contributions = contributions
  option.signallers = signallers
  option.quadratics = quadratics
  option.save()
}
