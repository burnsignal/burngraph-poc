import { AnonymousDeposit as DepositEvent } from "../generated/VoteProposalPool/templates/VoteOption/VoteOption"
import { Deposit, Poll, Users, User, Yes, No } from "../generated/schema"
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
  let user = initialiseUsers(address)
  let type = event.params.option
  let option: Yes

  if(type == "yes") let option = Yes.load(optionId)
  else if(type == "no") let option = No.load(optionId)

  if(option == null){
     if(type == "yes") let option = new Yes(optionId)
     else if(type == "no") let option = new No(optionId)

     option.contributions = new Array<string>()
     option.timestamps = new Array<BigInt>()
     option.value = new Array<BigInt>()
     option.total = new Array<string>()
     option.sqrt = new Array<string>()
  }

  let total = option.total as Array<string>
  let sqrt = option.sqrt as Array<string>
  let contributions = option.contributions
  let timestamp = event.block.timestamp
  let timestamps = option.timestamps
  let burn = event.params.value
  let value = option.value
  let root = ""
  let sum = ""

  if(sqrt.length > 0 || total.length > 0){
    let preceding = total[total.length-1]
    let previous = sqrt[sqrt.length-1]
    let quad = Math.sqrt(parseFloat(previous) + legacyNumber(burn))
    let gross = parseFloat(preceding) + legacyNumber(burn)
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

  if(type == "yes") user.yes = optionId
  else if(type == "no") user.no = optionId

  user.save()
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

function initialiseUsers(address: string): Users {
  let users = Users.load(address)

  if(users == null){
    users = new Users(address)
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
