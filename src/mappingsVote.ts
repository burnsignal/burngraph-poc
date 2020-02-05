import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, Proposal, Signaller, Option } from "../generated/schema"
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
  let address = event.params.from.toHexString()
  let signaller = Signaller.load(address)

  if(signaller == null) signaller = new Signaller(address)

  let total: BigInt = signaller.burned + event.params.value
  let burns: string[] = signaller.burns as Array<string>

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

  let burns :string[] = proposal.burns as Array<string>
  let rejections = proposal.reject as Option
  let approvals = proposal.approve as Option

  if(rejections == null) rejections = new Option(`${proposalId}@no`)
  if(approvals == null) approvals = new Option(`${proposalId}@yes`)
  if(burns == null) burns = new Array()

  if(event.params.option == "no") storeOption(rejections, event)
  else if(event.params.option == "yes") storeOption(approvals, event)

  burns.push(transactionHash)

  proposal.sum = event.params.value + proposal.sum
  proposal.reject = rejections as string
  proposal.approve = approvals as string
  proposal.burns = burns
  proposal.save()
}

function storeOption(option: Option, event: AnonymousDepositEvent): void {
  let quadratics: string[] = option.quadratics as Array<string>
  let contributions = option.contributions
  let burn: BigInt = event.params.value
  let signallers = option.signallers
  let signaller = event.params.from
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
