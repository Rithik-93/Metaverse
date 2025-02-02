import { Request, Response } from "express";
import client from "@repo/db/client";
import { signinSchema, signupSchema } from "../types/types";
import jwt from 'jsonwebtoken';
import bcrypt, { compare } from 'bcryptjs'
import { jwtSecret } from "../constants";

export const signup = async (req: Request, res: Response) => {
    const data = signupSchema.safeParse(req.body);

    if (!data.success) {
        res.json({ message: "invalid inputs" }).status(400)
        return
    }
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(data.data.password, salt);

    try {
        const user = await client.user.create({
            data: {
                username: data.data.username,
                password: hashedPassword,
                role: data.data.type === "admin" ? "Admin" : "User",
            }
        })

        res.json({
            userId: user.id
        }).status(200)

    } catch(e) {
        console.log(e)
        res.status(400).json({message: "User already exists"})
    }

}

export const signin = async (req: Request, res: Response) => {
    const data = signinSchema.safeParse(req.body);

    if (!data.success) {
        res.json({ message: "invalid inputs" }).status(400)
        return
    }

    try {
        const user = await client.user.findUnique({
            where: {
                username: data.data.username
            }
        })

        if(!user) {
            res.json({
                message: "User not found"
            }).status(400)
            return
        }

        const isValidPw = await compare(data.data.password, user.password)

        if (!isValidPw) {
            res.status(403).json({message: "Invalid password"})
            return
        }

        const token = jwt.sign({
            userId:user.id,
            role:user.role
        }, jwtSecret );

        res.json({
            token
        }).status(200)
        return

    } catch(e) {
        console.log(e)
        res.status(400).json({message: "User already exists"})
    }

}

export const getElements =  async(req: Request, res: Response) => {

    const elements = client.element.findMany();

    res.json({elements: (await elements).map((e) => ({
        id: e.id,
        imageUrl: e.imageUrl,
        height: e.height,
        width: e.width,
        static: e.static
    }))})

}

export const getAvatars = async (req: Request, res: Response) => {

    const avatars = client.avatar.findMany()

    res.json({avatars: (await avatars).map((x: { id: any; imageUrl: any; name: any; }) => ({
        id: x.id,
        imageUrl: x.imageUrl,
        name: x.name
    }))})
}