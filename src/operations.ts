import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { User } from "../generated/schema"

export function initialiseUser(address: string): User {
  let user = User.load(address)

  if(user == null){
    user = new User(address)
    user.burns = new Array<string>()
    user.polls = new Array<string>()
    user.burned = BigInt.fromI32(0)
  } return user
}

export function legacyNumber(number: BigInt): number {
  let decimal = new BigDecimal(number)
  return parseFloat(number.toString())
}
