import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotal } from "../generated/schema"
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

  getQuadraticTotals(event.params.name, transactionHash)
}

function getQuadraticTotals(proposal: string, hash: string): void {
  let quadratics = QuadraticTotal.load(proposal)
  let totalValue: number = 0
  let rejectSqrt: number = 0
  let passSqrt: number = 0

  if(quadratics == null) quadratics = new QuadraticTotal(proposal)

  let burners :string[] = quadratics.burners as Array<string>

  if(burners == null) burners = new Array()

  burners.push(hash)

  for(var index = 0; index < burners.length; index++){
    let transactionHash = burners[index] as string
    let burn = AnonymousDeposit.load(transactionHash)

    if(burn != null){
      let value: number = Math.sqrt(legacyNumber(burn.value))

      if(burn.choice == "no") rejectSqrt = value + rejectSqrt
      else if(burn.choice == "yes") passSqrt = value + passSqrt

      totalValue = legacyNumber(burn.value) + totalValue
    }
  }

  let decline: string = rejectSqrt.toString()
  let approve: string = passSqrt.toString()
  let total: string = totalValue.toString()

  quadratics.decline = decline
  quadratics.approve = approve
  quadratics.burners = burners
  quadratics.total = total
  quadratics.save()
}
