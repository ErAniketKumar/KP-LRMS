const mongoose = require("mongoose");

const connectDB = async () => {
	try {
        const dbOption  = {
            dbName:"Kp_RLMS",
        }
		const conn = await mongoose.connect(process.env.MONGODB_URI,dbOption);

		console.log(`MongoDB Connected: ${conn.connection.host}` );
	} catch (error) {
		console.error("Database connection failed:", error);
		process.exit(1);
	}
};

module.exports = connectDB;
