import z from 'zod'

export const signupSchema = z.object({
    username: z.string(),
    password: z.string(),
    type: z.enum(["user", "admin"]),
})

export const signinSchema = z.object({
    username: z.string(),
    password: z.string(),
})

export const updatMetadataSchema = z.object({
    avatarId : z.string()
})