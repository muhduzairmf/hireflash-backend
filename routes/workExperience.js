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

// 1- GET /work-experience/:candidate_profile_id
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

    // Get work experience list based on candidate profile id
    const workExperienceList = await prisma.work_Experience.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Work experience for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: workExperienceList,
    });
});

// 2- POST /work-experience
router.post("/", async (req, res) => {
    const {
        position,
        start_date,
        end_date,
        duration,
        company_name,
        company_address,
        monthly_salary,
        candidate_profile_id,
    } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(position) ||
        notContainsValue(start_date) ||
        notContainsValue(end_date) ||
        notContainsValue(duration) ||
        notContainsValue(company_name) ||
        notContainsValue(company_address) ||
        monthly_salary < 0 ||
        notContainsValue(candidate_profile_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Position, Duration, Company name, Company address, Monthly salary and Candidate profile id is required.",
            data: [],
        });
        return;
    }

    // Create new work experience
    const newWorkExperience = await prisma.work_Experience.create({
        data: {
            id: randomUUID(),
            position: position,
            start_date: start_date,
            end_date: end_date,
            duration: duration,
            company_name: company_name,
            company_address: company_address,
            monthly_salary: monthly_salary,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if new work experience cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New work experience cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New work experience successfully created.",
        data: newWorkExperience,
    });
});

// 3- DELETE /work-experience/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the work experience id is exists
    const workExperienceExists = await prisma.work_Experience.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the work experience id is not exists
    if (!workExperienceExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Work experience id not found.",
        });
        return;
    }

    // Delete work experience
    await prisma.work_Experience.delete({
        where: {
            id: id,
        },
    });

    // The response of the work experience cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New work experience cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Work experience " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- position
- duration
- company_name
- company_address
- monthly_salary
- candidate_profile_id
*/
