import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, Proposal, Signaller, Option } from "../generated/schema"
import { BigInt, BigDecimal, Bytes } from "@graphprotocol/graph-ts"

function legacyNumber(number: BigInt): number {
  let decimal = new BigDecimal(number)
  return parseFloat(number.toString())
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

  if(signaller == null){
    signaller = new Signaller(address)
    signaller.burned = BigInt.fromI32(0)
  }

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

  if(proposal == null){
    proposal = new Proposal(proposalId)
    proposal.sum = BigInt.fromI32(0)
    proposal.decline = "NA"
    proposal.approve = "NA"
  }

  let optionId: string = event.params.name  + "@" + event.params.option
  let total: BigInt = event.params.value + proposal.sum
  let burns: string[] = proposal.burns as Array<string>
  let rejections: string = proposal.decline
  let approvals: string = proposal.approve

  if(burns == null) burns = new Array()

  if(event.params.option == "yes") approvals = optionId
  else if(event.params.option == "no") rejections = optionId

  storeOption(optionId, event)
  burns.push(transactionHash)

  proposal.decline = rejections
  proposal.approve = approvals
  proposal.burns = burns
  proposal.sum = total
  proposal.save()
}

function storeOption(id: string, event: AnonymousDepositEvent): void {
  let option = Option.load(id)

  if(option == null) option = new Option(id)

  let contributions: BigInt[] = option.contributions as Array<BigInt>
  let quadratics: string[] = option.quadratics as Array<string>
  let signallers: Bytes[] = option.signallers as Array<Bytes>
  let signaller = event.params.from
  let burn = event.params.value
  let parsed = ""

  if(contributions == null) contributions = new Array()
  if(signallers == null) signallers = new Array()
  if(quadratics == null) quadratics = new Array()

  if(quadratics.length > 0){
    let previous: string = quadratics[quadratics.length-1]
    let quad: number = Math.sqrt(parseFloat(previous) + legacyNumber(burn))
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
