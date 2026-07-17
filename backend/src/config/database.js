import mongoose from "mongoose"
async function connectToDB() {
    await mongoose.connect(MONGO_URI)
    console.log('connected to MONGO_DB')
}
