import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Doc } from "../models/upload.model.js";
import fs from "fs";
import mongoose from "mongoose";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { v4 as uuidv4 } from "uuid";


export const publishDoc = asyncHandler(async (req, res) => {
    const { title } = req.body;

    const userHeader = req.headers["x-user"];
    if (!userHeader) {
        throw new ApiError(401, "Unauthorized: Missing user header");
    }

    const user = JSON.parse(userHeader);

    const localpath = req.file?.path
    // console.log(localpath)
    if (!localpath) {
        throw new ApiError(400, "Doc file is required");
    }

    const file = await uploadOnCloudinary(localpath);

    if (!file) {
        throw new ApiError(500, "Failed to upload doc");
    }

    // *************** chunking and uploading to vectordb **********************
    //TODO: Refactor and put the logic in a queue

    const loader = new PDFLoader(localpath);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const chunkedDocs = (await splitter.splitDocuments(rawDocs)).filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);
//     console.log("Total chunks:", chunkedDocs.length);
// console.log("First chunk preview:", chunkedDocs[0]?.pageContent?.slice(0, 100));
    const enrichedDocs = chunkedDocs.map((doc, index) => ({
        id: uuidv4(),
        pageContent :doc.pageContent,
        metadata: {
            ...doc.metadata,
            user_id: user._id,
            documentUrl: file?.url || "",
            chunkIndex: index,
            title,
        },
    }));
    // console.log(process.env.GEMINI_API_KEY);
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-embedding-001",
        config: { outputDimensionality: 768 },
    });
//     const test = await embeddings.embedQuery("hello world");
// console.log("Embedding length:", test.length);
// console.log(test);
//     console.log("DB CONFIG:", {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
// });
    const vectorStore = await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT)
        },
        tableName: "document_chunks",
        columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content", 
            metadataColumnName: "metadata",
        },
        distanceStrategy: "cosine" ,
    });
    // console.log(enrichedDocs[0].metadata)
    // const test = await embeddings.embedQuery("hello world");

    // console.log("Embedding length:", test.length);
    // console.log(test);
    try {
        //TODO: optimize this later too many api calls as each chunk is calling seperately
        await vectorStore.addDocuments(enrichedDocs);
    } catch (err) {
        console.error("Vector store error:", err);
    }
    
    // *************************************************************************

    if (fs.existsSync(localpath)) {
        fs.unlinkSync(localpath);
    }

    const doc = await Doc.create({
        title,
        ownerId: user._id,
        docfile: {
            url: file.url,
            public_id: file.public_id
        }
    });

    return res.status(201).json(
        new ApiResponse(201, doc, "Doc uploaded successfully")
    );
});

export const getDocById = asyncHandler(async (req, res) => {
    const { docId } = req.params;

    if (!mongoose.isValidObjectId(docId)) {
        throw new ApiError(400, "Invalid doc ID");
    }

    const doc = await Doc.findById(docId);

    if (!doc) {
        throw new ApiError(404, "Doc not found");
    }

    return res.status(200).json(
        new ApiResponse(200, doc, "Doc fetched successfully")
    );
});

// dont use it we would also need to delete the chunks associated with it
export const deleteDoc = asyncHandler(async (req, res) => {
    const { docId } = req.params;

    const user = JSON.parse(req.headers["x-user"]);

    const doc = await Doc.findById(docId);

    if (!doc) {
        throw new ApiError(404, "Doc not found");
    }

    if (doc.ownerId.toString() !== user._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    await deleteFromCloudinary(doc.docfile.public_id);

    await doc.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Doc deleted successfully")
    );
});