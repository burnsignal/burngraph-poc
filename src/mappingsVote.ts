import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotal } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

let I32_MAX = "4294967295"

function isI32(number: BigInt): bool {
  let convert = number.toBigDecimal()
  return parseInt(I32_MAX) >= parseInt(convert.toString())
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

  if(quadratics == null) quadratics = new QuadraticTotal(proposal)

  let burners = quadratics.burners as Array<string>
  let rejectSqrt = BigInt.fromI32(0)
  let totalValue = BigInt.fromI32(0)
  let passSqrt = BigInt.fromI32(0)

  burners.push(hash)

  for(var index = 0; index < burners.length; index++){
    let transactionHash = burners[index] as string
    let burn = AnonymousDeposit.load(transactionHash)
    let value = 0

    if(burn != null){
      if(isI32(burn.value)) value = burn.value.toI32()

      if(burn.choice !== "yes") {
        rejectSqrt = BigInt.fromI32(Math.sqrt(value) as i32) + rejectSqrt
      } else {
        passSqrt = BigInt.fromI32(Math.sqrt(value) as i32) + passSqrt
      }

      totalValue = totalValue + burn.value
    }
  }

  quadratics.decline = rejectSqrt
  quadratics.approve = passSqrt
  quadratics.total = totalValue
  quadratics.burners = burners
  quadratics.save()
}
