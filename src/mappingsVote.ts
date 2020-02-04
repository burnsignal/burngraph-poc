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
  let rejectSqrt: BigDecimal = BigDecimal.fromString("0")
  let passSqrt: BigDecimal = BigDecimal.fromString("0")
  let quadratics = QuadraticTotal.load(proposal)
  let totalValue: BigInt = BigInt.fromI32(0)

  if(quadratics == null) quadratics = new QuadraticTotal(proposal)

  let burners :string[] = quadratics.burners as Array<string>

  if(burners == null) burners = new Array()

  burners.push(hash)

  for(var index = 0; index < burners.length; index++){
    let transactionHash = burners[index] as string
    let burn = AnonymousDeposit.load(transactionHash)

    if(burn != null){
      let value: number = Math.sqrt(legacyNumber(burn.value))

      if(burn.choice !== "yes") {
        rejectSqrt = BigDecimal.fromString(value.toString()) + rejectSqrt
      } else {
        passSqrt = BigDecimal.fromString(value.toString()) + passSqrt
      }

      totalValue = burn.value + totalValue
    }
  }

  quadratics.decline = rejectSqrt
  quadratics.approve = passSqrt
  quadratics.total = totalValue
  quadratics.burners = burners
  quadratics.save()
}
