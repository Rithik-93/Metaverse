import { Router } from "express";
import { getAvatars, getElements, signin, signup } from '../controllers/public';
import { metadataBulk, updatMetadata } from '../controllers/user';

export const router = Router();
// const jwtSecret = "asdasd"

router.post("/signup", signup);

router.post("/signin", signin)

router.get("/elements", getElements)

router.get("/avatars", getAvatars)

//User specific routes

router.post("/user/metadata", updatMetadata);

router.post("/user/metadata/bulk", metadataBulk);