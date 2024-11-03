import { Request, Response } from "express";
import { updatMetadataSchema } from "../types/types";
import client from "@repo/db/client";

export const updatMetadata = async(res: Response, req: Request) => {
    const data = updatMetadataSchema.safeParse(req.body);

    if(!data.success) {
        res.json({
            messgae: "Invalid inputs"
        }).status(400)
        return
    }
    try {

        await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                avatarId: data.data.avatarId
            }
        })
        res.json({message: "Metadata updated"})

    } catch(e) {

        res.json({
            message: "Invalid avatarId"
        }).status(400)
    }
}

export const metadataBulk = async (req: Request, res: Response) => {
    const userIdString = (req.query.ids ?? "[]") as string;
    const userIds = (userIdString).slice(1, userIdString?.length - 1).split(",");
    const metadata = await client.user.findMany({
        where: {
            id: {
                in: userIds
            }
        }, select: {
            avatar: true,
            id: true
        }
    })

    res.json({
        avatars: metadata.map(m => ({
            userId: m.id,
            avatarId: m.avatar?.imageUrl
        }))
    })
}