import { Deposit as DepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { Deposit, Poll, User, Option, Yes, No } from "../generated/schema"
import { initialiseUser, legacyNumber } from "./operations.ts"
import { BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleDeposit(event: DepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let entity = new Deposit(transactionHash)

  entity.timestamp = event.block.timestamp
  entity.option = event.params.option
  entity.value = event.params.value
  entity.user = event.params.from
  entity.poll = event.params.name
  entity.save()

  storeUserMetadata(event)
  storePoll(event)
}

function storeUserMetadata(event: DepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let address = event.params.from.toHexString()
  let user = initialiseUser(address)
  let total = user.burned + event.params.value
  let burns = user.burns as Array<string>

  burns.push(transactionHash)

  signaller.burned = total
  signaller.burns = burns
  signaller.save()
}

function storePoll(event: DepositEvent): void {
  let address = event.params.from.toHexString()
  let poll = initialisePoll(event.params.name)
  let users = poll.users
  let yes = poll.yes
  let no = poll.no

  if(event.params.option == "yes") yes = yes + event.params.value
  else if(event.params.option == "no") no = no + event.params.value
  if(!checkValidity(users, address)) users.push(address)

  storeOption(event)

  poll.users = users
  poll.yes = yes
  poll.no = no
  poll.save()
}

function storeOption(event: DepositEvent): void {
  let transactionHash = event.transaction.hash.toHex()
  let address = event.params.from.toHexString()
  let optionId = address + "@" + event.params.name
  let burn = legacyNumber(event.params.value)
  let user = initialiseUsers(address)
  let type = event.params.option

  let option = type == "yes" ? Yes.load(optionId) : No.load(optionId)

  if(option == null){
     if(type == "yes") option = new Yes(optionId)
     else if(type == "no") option = new No(optionId)

     option.contributions = new Array<BigInt>()
     option.timestamps = new Array<BigInt>()
     option.value = new Array<BigInt>()
     option.total = new Array<string>()
     option.sqrt = new Array<string>()
  }

  let contributions = option.contributions
  let timestamp = event.block.timestamp
  let timestamps = option.timestamps
  let burn = event.params.value
  let total = option.total
  let value = option.value
  let sqrt = option.sqrt
  let root = ""
  let sum = ""

  if(quadratics.length > 0){
    let previous = quadratics[quadratics.length-1]
    let preceding = total[total.length-1]
    let quad = Math.sqrt(parseFloat(previous) + legacyNumber(burn))
    let gross = preceding + burn
    root = quad.toString()
    sum = gross.toString()
  } else {
    let rudimentary = Math.sqrt(legacyNumber(burn))
    let foundation = legacyNumber(burn)
    root = rudimentary.toString()
    sum = foundation.toString()
  }

  contributions.push(transactionHash)
  timestamps.push(timestamp)
  value.push(burn)
  total.push(sum)
  sqrt.push(root)

  option.contributions = contributions
  option.timestamps = timestamps
  option.value = value
  option.total = total
  option.sqrt = sqrt
  option.save()

  if(type == "yes") user.yes = option
  else if(type == "no") user.no = option

  user.save()  
}

function checkValidity(array: Array<string>, address: string): bool {
  for(let x = 0; x < array.length){
    if(array[x] == address) return true
  } return false
}

function initialisePoll(title: string): Poll {
  let poll = Poll.load(title)

  if(poll == null){
    poll = new poll(title)
    proposal.users = new Array<string>()
    poll.yes = BigInt.fromI32(0)
    poll.no = BigInt.fromI32(0)
  } return poll
}

function initialiseUsers(address: string): Users {
  let users = Users.load(address)

  if(users == null){
    users = new Users(address)
    users.yes = "NA"
    users.no =  "NA"
  } return users
}
