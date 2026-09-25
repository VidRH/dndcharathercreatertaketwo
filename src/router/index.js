import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LogIn from '../views/LogIn.vue'
import CharatherMaker from '../views/CharatherMaker.vue'

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
    },
    {
      path: '/CharatherMaker',
      name: 'CharatherMaker',
      component: CharatherMaker,
    }
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
  ],
})

export default router
