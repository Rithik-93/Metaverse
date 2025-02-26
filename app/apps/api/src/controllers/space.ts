import { Router } from "express";
import client from '@repo/db/client'
import z from "zod";
import { userMiddleware } from "../middlewares/user";

export const spaceRouter = Router();

const CreateSpaceSchema = z.object({
    name: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    mapId: z.string().optional(),
})

spaceRouter.post("/", userMiddleware, async (req, res) => {

    const parsedData = CreateSpaceSchema.safeParse(req.body)
    if (!parsedData.success) {
        console.log(JSON.stringify(parsedData))
        res.status(400).json({ message: "Validation failed" })
        return
    }

    if (!parsedData.data.mapId) {
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width: parseInt(parsedData.data.dimensions.split("x")[0]),
                height: parseInt(parsedData.data.dimensions.split("x")[1]),
                creatorId: req.userId!
            }
        });
        res.json({ spaceId: space.id })
        return;
    }

    const map = await client.map.findFirst({
        where: {
            id: parsedData.data.mapId
        }, select: {
            mapElements: true,
            width: true,
            height: true
        }
    })
    if (!map) {
        res.status(400).json({ message: "Map not found" })
        return
    }

    let space = await client.$transaction(async () => {
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width: map.width,
                height: map.height,
                creatorId: req.userId!,
            }
        });

        await client.spaceElements.createMany({
            data: map.mapElements.map((e: any) => ({
                spaceId: space.id,
                elementId: e.elementId,
                x: e.x!,
                y: e.y!
            }))
        })

        return space;

    })
    res.json({ spaceId: space.id })
})

spaceRouter.get("/getspaces", userMiddleware, async (req, res, next) => {
    try {
        const spaces = await client.space.findMany();

        res.json(spaces);
    } catch (error) {
        next(error);
    }
})