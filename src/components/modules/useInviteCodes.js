import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase'

// Invite codes: the DM makes one, players type it in to join the campaign.
//
// inviteCodes/{CODE}   campaignId, dmId, createdAt
// The campaign also remembers its current code in campaigns/{id}.inviteCode
//
// Anyone logged in can look up ONE code (that's how joining finds the campaign),
// but nobody can list them all, so codes can't be guessed by browsing.

// No 0/O, 1/I/L: they look too much alike when someone reads the code out loud
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

const codeDoc = (code) => doc(db, 'inviteCodes', code)

function randomCode() {
  // crypto instead of Math.random: properly random, so codes are hard to guess
  const numbers = crypto.getRandomValues(new Uint32Array(CODE_LENGTH))
  return Array.from(numbers, (number) => LETTERS[number % LETTERS.length]).join('')
}

// What someone typed -> a code to look up, e.g. 'abc 123' or 'abc-123' -> 'ABC123'
export function cleanCode(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Makes a new code for the campaign and throws the old one away (so it stops working)
export async function makeInviteCode(campaignId, oldCode) {
  // A taken code is very unlikely, but just in case: try a few
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    if ((await getDoc(codeDoc(code))).exists()) continue

    const batch = writeBatch(db)
    batch.set(codeDoc(code), { campaignId, dmId: auth.currentUser.uid, createdAt: serverTimestamp() })
    if (oldCode) batch.delete(codeDoc(oldCode))
    batch.update(doc(db, 'campaigns', campaignId), { inviteCode: code })
    await batch.commit()
    return code
  }
  throw new Error("Couldn't find a free code, please try again.")
}

// No code at all: nobody new can join until the DM makes a new one
export async function removeInviteCode(campaignId, code) {
  const batch = writeBatch(db)
  batch.delete(codeDoc(code))
  batch.update(doc(db, 'campaigns', campaignId), { inviteCode: '' })
  await batch.commit()
}

// Which campaign a code belongs to: { campaignId, dmId }, or null when it doesn't exist
export async function findInviteCode(code) {
  const saved = await getDoc(codeDoc(code))
  return saved.exists() ? saved.data() : null
}
