import HomePage from "../pages/HomePage"
import StartPage from "../pages/StartPage"

export const privateRoutes=[
    {path:'/home', element:<HomePage/> }
    
]

export const publicRoutes=[
    {path:'/', element:<StartPage/> }
]