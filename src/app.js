import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from "cors"

const app=express()

app.use(cors({
origin: process.env.CORS_ORIGIN,
credentials:true
}))

app.use(express.json({
  limit:"16kb"
}))

app.use(express.urlencoded({
  extended:true,limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

// ROUTES IMPORT
import userRouter from "./routes/user.routes.js"

//router declaration
app.use("/api/v1/users",userRouter)

// http://localhost:3000/api/v1/users/register  example how it works
export {app}