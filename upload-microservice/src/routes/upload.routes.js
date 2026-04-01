import express from "express";
import { publishDoc, getDocById, deleteDoc } from "../controllers/upload.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/doc", upload.single("docs"), publishDoc);
router.get("/:docId", getDocById);
router.delete("/:docId", deleteDoc);

export default router;