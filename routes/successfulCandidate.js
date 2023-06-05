// TOTAL ENDPOINTS : 6

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

// 1- GET /successful-candidate/:job_id
router.get("/:job_id", async (req, res) => {
    const job_id = req.params.job_id;

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

    // Get successful list based on job id
    const successfulList = await prisma.successful_Candidate.findMany({
        where: {
            job_id: job_id,
        },
        include: {
            candidate_profile: {
                include: {
                    user: true,
                    education: true,
                    lang_ability: true,
                    resume: true,
                    skill: true,
                    work_experience: true,
                },
            },
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of successful candidate for job " +
            job_id +
            " successfully retrieved.",
        data: successfulList,
    });
});

// 2- GET /successful-candidate/:job_id/:candidate_profile_id
router.get("/:job_id/:candidate_profile_id", async (req, res) => {
    const job_id = req.params.job_id;
    const candidate_profile_id = req.params.candidate_profile_id;

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

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

    // Check if the candidate profile id is included in job id
    const successfulExists = await prisma.successful_Candidate.findFirst({
        where: {
            job_id: job_id,
            candidate_profile_id: candidate_profile_id,
        },
        include: {
            candidate_profile: {
                include: {
                    user: true,
                    education: true,
                    lang_ability: true,
                    resume: true,
                    skill: true,
                    work_experience: true,
                },
            },
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!successfulExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message:
                "Candidate profile id " +
                candidate_profile_id +
                " is not included in job " +
                job_id,
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Successful candidate " +
            candidate_profile_id +
            " for job " +
            job_id +
            " successfully retrieved.",
        data: successfulExists,
    });
});

// 3- POST /successful-candidate
router.post("/", async (req, res) => {
    const {
        notes,
        monthly_salary,
        confirmation_status,
        candidate_profile_id,
        job_id,
    } = req.body;

    // Check if the variables is empty
    if (notContainsValue(candidate_profile_id) || notContainsValue(job_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Monthly salary, Confirmation status, Candidate profile id and  Job id is required.",
            data: [],
        });
        return;
    }

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

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

    // Check if the candidate profile id is already included in job id
    const successfulExists = await prisma.successful_Candidate.findFirst({
        where: {
            job_id: job_id,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id is already included in job id
    if (successfulExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message:
                "Candidate " +
                candidate_profile_id +
                " is already in job " +
                job_id +
                " as successful candidate.",
        });
        return;
    }

    // Create new successful candidate
    const newSuccessfulCandidate = await prisma.successful_Candidate.create({
        data: {
            id: randomUUID(),
            notes: notContainsValue(notes) ? notes : "",
            monthly_salary: monthly_salary,
            confirmation_status: confirmation_status,
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
        },
    });

    // The response if new successful candidate cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New successful candidate cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New successful candidate successfully created.",
        data: newSuccessfulCandidate,
    });
});

// 4- PATCH /successful-candidate/:job_id/:candidate_profile_id
router.patch("/:job_id/:candidate_profile_id", async (req, res) => {
    const job_id = req.params.job_id;
    const candidate_profile_id = req.params.candidate_profile_id;

    const { confirmation_status, monthly_salary } = req.body;

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

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

    // Check if the candidate profile id is included in job id
    const successfulExists = await prisma.successful_Candidate.findFirst({
        where: {
            job_id: job_id,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!successfulExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message:
                "Candidate profile id " +
                candidate_profile_id +
                " is not included in job " +
                job_id,
        });
        return;
    }

    // Update
    const updatedSuccessfulCandidate = await prisma.successful_Candidate.update(
        {
            where: {
                id: successfulExists.id,
            },
            data: {
                confirmation_status: confirmation_status,
                monthly_salary: monthly_salary,
            },
        }
    );

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully updated.",
        data: updatedSuccessfulCandidate,
    });
});

// 5- PATCH /successful-candidate/:job_id/:candidate_profile_id/notes
router.patch("/:job_id/:candidate_profile_id/notes", async (req, res) => {
    const job_id = req.params.job_id;
    const candidate_profile_id = req.params.candidate_profile_id;

    const { notes } = req.body;

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

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

    // Check if the candidate profile id is included in job id
    const successfulExists = await prisma.successful_Candidate.findFirst({
        where: {
            job_id: job_id,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!successfulExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message:
                "Candidate profile id " +
                candidate_profile_id +
                " is not included in job " +
                job_id,
        });
        return;
    }

    // Update
    const updatedSuccessfulCandidate = await prisma.successful_Candidate.update(
        {
            where: {
                id: successfulExists.id,
            },
            data: {
                notes: notes,
            },
        }
    );

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Notes for candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully updated.",
        data: updatedSuccessfulCandidate,
    });
});

// 6- DELETE /successful-candidate/:job_id/:candidate_profile_id
router.delete("/:job_id/:candidate_profile_id", async (req, res) => {
    const job_id = req.params.job_id;
    const candidate_profile_id = req.params.candidate_profile_id;

    // Check if the job id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: job_id,
        },
    });

    // The response if the job id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

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

    // Check if the candidate profile id is included in job id
    const successfulExists = await prisma.successful_Candidate.findFirst({
        where: {
            job_id: job_id,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!successfulExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message:
                "Candidate profile id " +
                candidate_profile_id +
                " is not included in job " +
                job_id,
        });
        return;
    }

    // Delete
    await prisma.successful_Candidate.delete({
        where: {
            id: successfulExists.id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully deleted from successfull candidate.",
    });
});

module.exports = router;

/**
- id
- notes
- monthly_salary
- confirmation_status
- candidate_profile_id
- job_id
*/
