import { ReceivedDeposit as DepositEvent } from "../generated/templates/VoteOption/VoteOption"
import { Deposit, Poll, Users, User, Option } from "../generated/schema"
import { BigInt, Bytes, BigDecimal } from "@graphprotocol/graph-ts"

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

  user.burned = total
  user.burns = burns
  user.save()
}

function storePoll(event: DepositEvent): void {
  let address = event.params.from.toHexString()
  let poll = initialisePoll(event.params.name)
  let userId = address + "@" + event.params.name
  let users = poll.users
  let yes = poll.yes
  let no = poll.no

  if(event.params.option == "yes") yes = yes + event.params.value
  else if(event.params.option == "no") no = no + event.params.value
  if(!checkValidity(users, userId)) users.push(userId)

  storeOption(event)

  poll.users = users
  poll.yes = yes
  poll.no = no
  poll.save()
}

function storeOption(event: DepositEvent): void {
  let address = event.params.from.toHexString()
  let userId = address + "@" + event.params.name
  let yes = initaliseOption(userId + "@yes")
  let no = initaliseOption(userId + "@no")
  let user = initialiseUsers(event)

  embedOption(event, no as Option, "no")
  embedOption(event, yes as Option, "yes")

  user.yes = userId + "@yes"
  user.no = userId + "@no"
  user.save()
}

function embedOption(event: DepositEvent, option: Option, type: string): void {
  let transactionHash = event.transaction.hash.toHex()
  let timestamp = event.block.timestamp
  let contributions = option.contributions
  let total = option.total as Array<string>
  let sqrt = option.sqrt as Array<string>
  let timestamps = option.timestamps
  let burn = event.params.value
  let value = option.value

  if(event.params.option == type){
    let running = computeRunning(burn, total, sqrt)

    contributions.push(transactionHash)
    timestamps.push(timestamp)
    total.push(running[0])
    sqrt.push(running[1])
    value.push(burn)
  }

  option.contributions = contributions
  option.timestamps = timestamps
  option.value = value
  option.total = total
  option.sqrt = sqrt
  option.save()
}

function computeRunning(number: BigInt, total: Array<string>, sqrt: Array<string>): Array<string> {
  let root = ""
  let sum = ""

  if(sqrt.length > 0 || total.length > 0){
    let preceding = total[total.length-1]
    let previous = sqrt[sqrt.length-1]
    let quad = Math.sqrt(parseFloat(previous) + legacyNumber(number))
    let gross = parseFloat(preceding) + legacyNumber(number)
    root = quad.toString()
    sum = gross.toString()
  } else {
    let rudimentary = Math.sqrt(legacyNumber(number))
    let foundation = legacyNumber(number)
    root = rudimentary.toString()
    sum = foundation.toString()
  } return [ sum, root ]
}

function checkValidity(array: Array<string>, address: string): bool {
  for(let x = 0; x < array.length; x++){
    if(array[x] == address) return true
  } return false
}

function initialisePoll(title: string): Poll {
  let poll = Poll.load(title)

  if(poll == null){
    poll = new Poll(title)
    poll.users = new Array<string>()
    poll.yes = BigInt.fromI32(0)
    poll.no = BigInt.fromI32(0)
  } return poll as Poll
}

function initaliseOption(id: string): Option {
  let option = Option.load(id)

  if(option == null){
     option = new Option(id)
     option.contributions = new Array<string>()
     option.timestamps = new Array<BigInt>()
     option.value = new Array<BigInt>()
     option.total = new Array<string>()
     option.sqrt = new Array<string>()
  } return option as Option
}

function initialiseUsers(event: DepositEvent): Users {
  let address = event.params.from.toHexString()
  let userId = address + "@" + event.params.name
  let users = Users.load(userId)

  if(users == null){
    users = new Users(userId)
    users.address = event.params.from
    users.yes = "NA"
    users.no =  "NA"
  } return users as Users
}

export function initialiseUser(address: string): User {
  let user = User.load(address)

  if(user == null){
    user = new User(address)
    user.burns = new Array<string>()
    user.polls = new Array<string>()
    user.burned = BigInt.fromI32(0)
  } return user as User
}

export function legacyNumber(number: BigInt): number {
  let decimal = new BigDecimal(number)
  return parseFloat(number.toString())
}
