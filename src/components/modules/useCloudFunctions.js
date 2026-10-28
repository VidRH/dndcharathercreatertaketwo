import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

// Calling the Cloud Functions in the functions folder. They run on Google's servers
// and can do what the website can't: delete a login, or a campaign with everything in it.

const deleteCampaignFunction = httpsCallable(functions, 'deleteCampaign')
const deleteAccountFunction = httpsCallable(functions, 'deleteAccount')

// Deletes a campaign with its characters, encounters, maps, members and invite code
export async function deleteCampaignEverywhere(campaignId) {
  await deleteCampaignFunction({ campaignId })
}

// Deletes an account with everything that belongs to it, and its login,
// so the same email can sign up again. Your own, or anyone's if you're an admin.
export async function deleteAccountEverywhere(uid) {
  await deleteAccountFunction({ uid })
}
