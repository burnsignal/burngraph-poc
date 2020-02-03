import { AnonymousDeposit } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"

export function getQuadraticTotals(burners): void {
  let [ rejectSqrt, passSqrt, totalValue ] = [0, 0, 0]

  for(index in burners){
    let transactionHash = burners[index]
    let burn = AnonymousDeposit.load(transactionHash)

    if(burn.choice === "yes") passSqrt = burn.value.pow(0.5) + passSqrt
    else rejectSqrt = burn.value.pow(0.5) + rejectSqrt

    totalValue = totalValue + burn.value;
  } return {
    reject: rejectSqrt,
    total: totalValue,
    pass: passSqrt
  }
}
