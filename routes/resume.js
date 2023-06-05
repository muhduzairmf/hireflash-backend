// TOTAL ENDPOINTS : 3

const router = require("express").Router();

// Import crypto modules to generate UUID
const { randomUUID } = require("crypto");

// Import UploadCare functions
const {
    deleteFile,
    UploadcareSimpleAuthSchema,
} = require("@uploadcare/rest-client");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// 1- GET /api/resume/:candidate_profile_id
router.get("/:candidate_profile_id", async (req, res) => {
    const candidate_profile_id = req.params.candidate_profile_id;

    // Check if the candidate profile id is exists
    const candidateExists = await prisma.candidate_Profile.findUnique({
        where: {
            id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id is not exists
    if (!candidateExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Candidate profile id not found.",
        });
        return;
    }

    // Get resume based on candidate profile id
    const resume = await prisma.resume.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    if (!resume) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Resume not found.",
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Resume for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: resume,
    });
});

// 2- POST /api/resume
router.post("/", async (req, res) => {
    const { path, candidate_profile_id } = req.body;

    // Check if the variables are empty
    if (notContainsValue(path) || notContainsValue(candidate_profile_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Path and Candidate profile id is required.",
            data: [],
        });
        return;
    }

    // Check if the candidate profile id have already a resume
    const resumeExists = await prisma.resume.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id have already a resume
    if (resumeExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Resume has already created.",
        });
        return;
    }

    // Create new resume
    const newResume = await prisma.resume.create({
        data: {
            id: randomUUID(),
            path: path,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if new resume cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New resume cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New resume successfully created.",
        data: newResume,
    });
});

// 3- DELETE /api/resume/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the resume id is exists
    const resumeExists = await prisma.resume.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the resume id is not exists
    if (!resumeExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Resume id not found.",
        });
        return;
    }

    const url = resumeExists.path;
    const idRegex = /\/([0-9a-f-]+)\//;
    const match = url.match(idRegex);

    if (!match || !match[1]) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Uploadcare id not found.",
        });
        return;
    }

    const uploadcareId = match[1];

    const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
        publicKey: process.env.PUBLIC_KEY_UPLOADCARE,
        secretKey: process.env.SECRET_KEY_UPLOADCARE,
    });

    const result = await deleteFile(
        {
            uuid: uploadcareId,
        },
        { authSchema: uploadcareSimpleAuthSchema }
    );

    // Delete resume
    await prisma.resume.delete({
        where: {
            id: id,
        },
    });

    // The response of the resume cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New resume cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200",
        message: "Resume " + id + " successfully deleted.",
        data: [],
    });
});

module.exports = router;

/**
- id
- path
- candidate_profile_id
*/
