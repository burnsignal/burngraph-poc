import { AnonymousDeposit as AnonymousDepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { AnonymousDeposit, QuadraticTotals } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function getQuadraticTotals(event: AnonymousDepositEvent): void {
  let quadratics = QuadraticTotals.load(event.params.name)

  if(quadratics === null) quadratics = new QuadraticTotals(event.params.name)

  let burners = quadratics.burners as Array<string>
  let rejectSqrt = BigInt.fromI32(0)
  let totalValue = BigInt.fromI32(0)
  let passSqrt = BigInt.fromI32(0)

  burners.push(event.transaction.hash.toHex())

  for(var index = 0; index < burners.length; index++){
    let transactionHash = burners[index]
    let burn = AnonymousDeposit.load(transactionHash)

    if(burn.choice === "yes") {
      passSqrt = burn.value.pow(0.5) + passSqrt
    } else {
      rejectSqrt = burn.value.pow(0.5) + rejectSqrt
    }

    totalValue = totalValue + burn.value;
  }

  quadratics.proposal = event.params.name
  quadratics.decline = rejectSqrt
  quadratics.approve = passSqrt
  quadratics.total = totalValue
  quadratics.burners = burners
  quadratics.save()
}
