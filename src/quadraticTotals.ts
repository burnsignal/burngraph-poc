import { AnonymousDeposit } from "../generated/schema"
import { BigInt, ByteArray } from "@graphprotocol/graph-ts";

export function getQuadraticTotals(burners: Array<String>): Array<BigInt> {
  let rejectSqrt = BigInt.fromI32(0)
  let totalValue = BigInt.fromI32(0)
  let passSqrt = BigInt.fromI32(0)

  for(var index = 0; index < burners.length; index++){
    let transactionHash = burners[index]
    let burn = AnonymousDeposit.load(transactionHash)
    let value = Math.sqrt(burn.value.toI32())

    if(burn.choice === "yes") {
      passSqrt = BigInt.fromI32(value as i32) + passSqrt
    } else {
      rejectSqrt = BigInt.fromI32(value as i32) + rejectSqrt
    }

    totalValue = totalValue + burn.value;
  }

  return [ passSqrt, rejectSqrt, totalValue]
}
