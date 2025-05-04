import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"



const connectdb= async()=>{
  try {
   const connectionInstance= await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
   console.log(`\n MONGODB connected !! Db Host: ${connectionInstance.connection.host}`);
  }
   catch (error) {
    console.log('MONGODB CONNECTION ERROR ',error);
    process.exit(1)
  }
}
export default connectdb