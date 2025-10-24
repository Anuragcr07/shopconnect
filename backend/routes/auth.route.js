
import { ExpressAuth } from "@auth/express"
import Credentials from "@auth/express/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import Google from "@auth/express/providers/google"
import express from "express"
import clientPromise from "../lib/db.js"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

const router = express.Router()

// --- Helper functions for Credentials provider ---
const saltAndHashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

const getUserFromDb = async (email, passwordHash) => {
    const client = await clientPromise;
    const db = client.db(); // Get your database instance (e.g., 'authjs')
    const usersCollection = db.collection("users"); // The default collection name for users

    const user = await usersCollection.findOne({ email: email });

    if (user && user.password && await bcrypt.compare(passwordHash, user.password)) {
        // Important: Do not return the hashed password in the user object for session
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}
// --- End Helper functions ---

// Auth.js setup for Express
router.use("/auth", ExpressAuth({
    providers: [
        Google(),
        Credentials({
            name: "Credentials", // A user-friendly name for the provider
            credentials: {
                email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                const { email, password } = credentials;

                // Simulate getting user from your database
                const user = await getUserFromDb(email, password);

                if (!user) {
                    throw new Error("Invalid credentials.");
                }
                return user;
            }
        })
    ],
    adapter: MongoDBAdapter(clientPromise), // Pass the promise here
    secret: process.env.AUTH_SECRET, // Use your secret
    session: {
        strategy: "jwt", // Recommended for Credentials provider
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async session({ session, token }) {
            // Add user ID to the session for client-side access
            if (token?.sub) {
                session.user.id = token.sub; // token.sub is the user's ID
            }
            return session;
        },
        async jwt({ token, user }) {
            // Add user ID to the JWT token
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    }
}))

// --- Manual User Registration Route ---
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists." });
        }

        // Hash password
        const hashedPassword = await saltAndHashPassword(password);

        // Create new user
        const newUser = {
            email,
            password: hashedPassword,
            emailVerified: null, // Or send a verification email
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        console.log(`New user registered: ${email}, ID: ${result.insertedId}`);

        // You might want to automatically sign them in or redirect to a login page
        res.status(201).json({ message: "User registered successfully!", userId: result.insertedId });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
});

export default router;