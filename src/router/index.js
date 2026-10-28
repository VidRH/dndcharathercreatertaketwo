import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LogIn from '../views/LogIn.vue'
import SignUp from '../views/SignUp.vue'
import CharatherMaker from '../views/CharatherMaker.vue'
import MyCharacters from '../views/MyCharacters.vue'
import DungeonMaster from '../views/DungeonMaster.vue'
import CampaignDM from '../views/CampaignDM.vue'
import EncounterDM from '../views/EncounterDM.vue'
import PlayerDM from '../views/PlayerDM.vue'
import PlayerCampaigns from '../views/PlayerCampaigns.vue'
import CampaignPlayer from '../views/CampaignPlayer.vue'
import EncounterPlayer from '../views/EncounterPlayer.vue'
import AdminView from '../views/AdminView.vue'
import MyAccount from '../views/MyAccount.vue'
import { authReady } from '../components/modules/useAuth.js'
import { loadProfile, hasRole } from '../components/modules/useProfile.js'
import { auth } from '../firebase.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/LogIn',
      name: 'LogIn',
      component: LogIn,
      meta: { guestOnly: true },
    },
    {
      path: '/SignUp',
      name: 'SignUp',
      component: SignUp,
      meta: { guestOnly: true },
    },
    {
      path: '/MyCharacters',
      name: 'MyCharacters',
      component: MyCharacters,
      meta: { requiresAuth: true },
    },
    {
      path: '/DungeonMaster',
      name: 'DungeonMaster',
      component: DungeonMaster,
      // roles = which kinds of account may open this page (admins always may)
      meta: { requiresAuth: true, roles: ['dm'] },
    },
    {
      // One campaign, e.g. /DungeonMaster/abc123
      path: '/DungeonMaster/:campaignId',
      name: 'CampaignDM',
      component: CampaignDM,
      meta: { requiresAuth: true, roles: ['dm'] },
    },
    {
      // One encounter of a campaign, e.g. /DungeonMaster/abc123/encounter/xyz789
      path: '/DungeonMaster/:campaignId/encounter/:encounterId',
      name: 'EncounterDM',
      component: EncounterDM,
      meta: { requiresAuth: true, roles: ['dm'] },
    },
    {
      // One player who joined a campaign, e.g. /DungeonMaster/abc123/player/user456
      path: '/DungeonMaster/:campaignId/player/:uid',
      name: 'PlayerDM',
      component: PlayerDM,
      meta: { requiresAuth: true, roles: ['dm'] },
    },
    {
      // Joining campaigns and the ones you're in: every logged in account
      path: '/Campaigns',
      name: 'Campaigns',
      component: PlayerCampaigns,
      meta: { requiresAuth: true },
    },
    {
      // A campaign you joined, as a player sees it, e.g. /Campaigns/abc123
      // (No role needed: the Firestore rules decide whether you may see it)
      path: '/Campaigns/:campaignId',
      name: 'CampaignPlayer',
      component: CampaignPlayer,
      meta: { requiresAuth: true },
    },
    {
      // One encounter of it, e.g. /Campaigns/abc123/encounter/xyz789
      path: '/Campaigns/:campaignId/encounter/:encounterId',
      name: 'EncounterPlayer',
      component: EncounterPlayer,
      meta: { requiresAuth: true },
    },
    {
      // Every account and campaign, only for admins
      path: '/Admin',
      name: 'Admin',
      component: AdminView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
    {
      path: '/MyAccount',
      name: 'MyAccount',
      component: MyAccount,
      meta: { requiresAuth: true },
    },

    {
      // The ? makes the id optional:
      //   /CharatherMaker         -> a brand new character
      //   /CharatherMaker/abc123  -> the saved character with id abc123
      // One route for both, so the page stays open when the id gets added after the first save
      path: '/CharatherMaker/:id?',
      name: 'CharatherMaker',
      component: CharatherMaker,
      meta: { requiresAuth: true },
    }
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
  ],
})

// Runs before every page change: the "door guard"
router.beforeEach(async (to) => {
  // Wait until Firebase knows if someone is logged in (matters on a page refresh)
  await authReady

  // auth.currentUser instead of our currentUser ref: it is updated the instant
  // logIn/signUp finishes, the ref can be a moment behind
  const user = auth.currentUser

  // Page needs login and nobody is logged in -> go log in
  if (to.meta.requiresAuth && !user) {
    return '/LogIn'
  }

  // Already logged in -> no reason to see the log in or sign up page
  if (to.meta.guestOnly && user) {
    return '/MyCharacters'
  }

  // Page is only for some kinds of account -> wait for the profile to know what this user is
  if (to.meta.roles) {
    try {
      await loadProfile(user)
    } catch (e) {
      console.error('Could not load your profile:', e)
    }
    if (!hasRole(to.meta.roles)) {
      return '/MyCharacters'
    }
  }
})

export default router
