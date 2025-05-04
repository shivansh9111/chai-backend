// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
import connectdb from "./db/index.js"
import { app } from "./app.js"

  dotenv.config({
    path:'./env'
  })



connectdb()
.then(()=>{
  app.on("error",(error)=>{
    console.log('errorr:',error);
    throw error
  })
})
.then(()=>{
  app.listen(process.env.PORT || 8000 , ()=>{
    console.log(`server is running at port ${process.env.PORT}`);
  })
})
.catch((error)=>
  {console.log("MONGO DB connection failed", error);})


















/*import { DB_NAME } from "./constants";
import express from "express"

const app = express()

;(async()=>{
  try {
   await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
   app.on("errorr",(error)=>{
    console.log("errorr",error);
    throw error
   })

   app.listen(process.env.PORT,()=>{
    console.log(`app is listening on port ${process.env.PORT}`);
   })
  } catch (error) {
    console.error("error", error)
    throw error
  }
}) () */