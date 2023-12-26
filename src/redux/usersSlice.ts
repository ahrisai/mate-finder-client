import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import User from "../types/User";
import axios from "axios";
import Swal from "sweetalert2";

interface IFormInput {
    password: string;
    nickname: string;
  }
  const baseUrl=import.meta.env.VITE_BASE_URL

  export const checkUserIsAuth=createAsyncThunk(
    'usersReducer/checkUserIsAuth',
    async(_,{rejectWithValue}) => {
        const response = await axios.get(`${baseUrl}/check`,{withCredentials:true})
                          .then(res=>{
                              return res.data
                              
                          })
                          .catch(error=>{
                              if (axios.isAxiosError(error)) {
                                  return rejectWithValue( error.response?.data.message ?? 'Unknown error');
                                } 
                          })
              return response            
              
      }
  )

export const fetchUser = createAsyncThunk(
    'usersReducer/fetchUser',
    async (data:IFormInput,{rejectWithValue}) => {
        const response =axios.post<string>(`${baseUrl}/login`,data,{
            withCredentials:true
        })
        .then(res=>{
            
            return res.data
        })
        .catch(error=>{
            if (axios.isAxiosError(error)) {

                return rejectWithValue(error.response?.data ?? 'Unknown error');

              } else if (error instanceof Error) {

                return rejectWithValue(error.message ?? 'Unknown error');

              } else {
                return rejectWithValue('Unknown error');
              }
        })

        return response
        
    }
)

export const createUser = createAsyncThunk(
    'usersReducer/createUser',
    async (data:User,{rejectWithValue}) => {
        const response =axios.post<User>(`${baseUrl}/registration`,data)
        .then(res=>{
            
            return res.data.nickname
        })
        .catch(error=>{
            if (axios.isAxiosError(error)) {

                return rejectWithValue(error.response?.data.message ?? 'Unknown error');

              } else if (error instanceof Error) {

                return rejectWithValue(error.message ?? 'Unknown error');

              } else {
                return rejectWithValue('Unknown error');
              }
        })
        return response
    }
)

interface UserState{
    user:User | null
    isAuth:boolean
    createUserStatus: 'idle' | 'pending' | 'fulfilled' | 'rejected';
    fetchUserStatus: 'idle' | 'pending' | 'fulfilled' | 'rejected';

    createUserError: string | null;
    fetchUserError: string | null;

}

const initialState:UserState ={
    user:null,
    isAuth:false,

    createUserStatus:'idle',
    createUserError:null,

    fetchUserStatus:'idle',
    fetchUserError:null,
}

const usersSlice= createSlice({
    name:'usersReducer',
    initialState,
    reducers:{
        resetUserStatus(state){
            state.createUserStatus='idle'
            state.createUserError=null
        },
        changeIsAuth(state){
            state.isAuth=!state.isAuth
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUser.pending, (state) => {
          state.fetchUserStatus='pending'
        })
        builder.addCase(fetchUser.fulfilled, (state,action:PayloadAction<string>) => {
            state.fetchUserStatus='fulfilled'
            Swal.fire({
                icon: "success",
                title: `Successful Login!`,
                text:`Welcome, ${action.payload}`,
                showConfirmButton: false,
                timer: 2000
              })
        })
        builder.addCase(fetchUser.rejected, (state, action) => {
            state.fetchUserStatus='rejected'
            state.fetchUserError=action.payload as string
            Swal.fire({
                icon: "error",
                title: 'Login Failure',
                text:state.fetchUserError,
                showConfirmButton: true,
                confirmButtonText:'Get It',
                
              })
        })
        

        builder.addCase(createUser.pending, (state) => {
            state.createUserStatus='pending'
        })
        builder.addCase(createUser.fulfilled, (state, action:PayloadAction<string>) => {
            state.createUserStatus='fulfilled'
            Swal.fire({
                icon: "success",
                title: `Registration Successful`,
                text:`User ${action.payload} was created`,
                showConfirmButton: false,
                timer: 1500
              })
              
        })
        builder.addCase(createUser.rejected, (state, action) => {
            state.createUserStatus='rejected'
            state.createUserError=action.payload as string
            Swal.fire({
                icon: "error",
                title: 'Registration Failure',
                text:state.createUserError,
                showConfirmButton: true,
                timer: 3000,
                confirmButtonText:'Get It',
                
              })
        })


        builder.addCase(checkUserIsAuth.pending, (state) => {
            state.fetchUserStatus='pending'
            
        })
        builder.addCase(checkUserIsAuth.fulfilled, (state) => {
            state.fetchUserStatus='fulfilled'
            state.isAuth=true
        })
        builder.addCase(checkUserIsAuth.rejected, (state) => {
            state.fetchUserStatus='rejected'
            
        })
      },
})


export const {resetUserStatus, changeIsAuth} =usersSlice.actions

export default usersSlice.reducer