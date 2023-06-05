// TOTAL ENDPOINTS : 3

const router = require("express").Router();

// Import crypto modules to generate UUID
const { randomUUID } = require("crypto");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// 1- GET /api/education/:candidate_profile_id
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

    // Get the education list based on candidate profile id
    const educationList = await prisma.education.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of educations for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: educationList,
    });
});

// 2- POST /api/education
router.post("/", async (req, res) => {
    const {
        graduation_date,
        qualification,
        institute_name,
        institute_address,
        study_field,
        grade,
        candidate_profile_id,
    } = req.body;

    // Check if the variables are empty
    if (
        notContainsValue(graduation_date) ||
        notContainsValue(qualification) ||
        notContainsValue(institute_name) ||
        notContainsValue(institute_address) ||
        notContainsValue(study_field) ||
        notContainsValue(grade) ||
        notContainsValue(candidate_profile_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Garduation date, Qualification, Institute name, Institue address, Study field, Grade and Candidate profile id is required.",
        });
        return;
    }

    // Create new education
    const newEducation = await prisma.education.create({
        data: {
            id: randomUUID(),
            graduation_date: graduation_date,
            qualification: qualification,
            institute_name: institute_name,
            institute_address: institute_address,
            study_field: study_field,
            grade: grade,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if new education cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New education cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New education successfully created.",
        data: newEducation,
    });
});

// 3- DELETE /api/education/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the education id is exists
    const educationExists = await prisma.education.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the education id is not exists
    if (!educationExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Education id not found.",
        });
        return;
    }

    // Delete education
    await prisma.education.delete({
        where: {
            id: id,
        },
    });

    // The response of the education cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New education cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Education " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- graduation_date
- qualification
- institute_name
- institute_address
- study_field
- grade
- candidate_profile_id
*/
