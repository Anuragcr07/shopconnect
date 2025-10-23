import Google from "next-auth/providers/google"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
    callbacks : {
        async signIn({account, profile}) {
            if (account.provider === "google") {
                return profile.email_verified && profile.email.endsWith("@example.com")
            }
        },
    },
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
})