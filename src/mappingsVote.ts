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
  let address = event.params.from.toHexString()
  let optionId = address + "@" + event.params.name
  let user = initialiseUsers(address)
  let type = event.params.option
  let yes = initaliseYes(optionId)
  let no = initaliseNo(optionId)

  storeYes(event, yes as Yes)
  storeNo(event, no as No)

  user.yes = optionId
  user.no = optionId
  user.save()
}

function storeNo(event: DepositEvent, no: No): void {
  let transactionHash = event.transaction.hash.toHex()
  let timestamp = event.block.timestamp
  let contributions = no.contributions
  let total = no.total as Array<string>
  let sqrt = no.sqrt as Array<string>
  let timestamps = no.timestamps
  let burn = event.params.value
  let value = no.value

  let running = computeRunning(burn, total, sqrt)

  contributions.push(transactionHash)
  timestamps.push(timestamp)
  total.push(running[0])
  sqrt.push(running[1])
  value.push(burn)

  no.contributions = contributions
  no.timestamps = timestamps
  no.value = value
  no.total = total
  no.sqrt = sqrt
  no.save()
}

function storeYes(event: DepositEvent, yes: Yes): void {
  let transactionHash = event.transaction.hash.toHex()
  let timestamp = event.block.timestamp
  let contributions = yes.contributions
  let total = yes.total as Array<string>
  let sqrt = yes.sqrt as Array<string>
  let timestamps = yes.timestamps
  let burn = event.params.value
  let value = yes.value

  let running = computeRunning(burn, total, sqrt)

  contributions.push(transactionHash)
  timestamps.push(timestamp)
  total.push(running[0])
  sqrt.push(running[1])
  value.push(burn)

  yes.contributions = contributions
  yes.timestamps = timestamps
  yes.value = value
  yes.total = total
  yes.sqrt = sqrt
  yes.save()
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

function initaliseYes(id: string): Yes {
  let yes = Yes.load(id)

  if(yes == null){
     yes = new Yes(id)
     yes.contributions = new Array<string>()
     yes.timestamps = new Array<BigInt>()
     yes.value = new Array<BigInt>()
     yes.total = new Array<string>()
     yes.sqrt = new Array<string>()
  } return yes as Yes
}

function initaliseNo(id: string): No {
  let no = No.load(id)

  if(no == null){
     no = new No(id)
     no.contributions = new Array<string>()
     no.timestamps = new Array<BigInt>()
     no.value = new Array<BigInt>()
     no.total = new Array<string>()
     no.sqrt = new Array<string>()
  } return no as No
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
