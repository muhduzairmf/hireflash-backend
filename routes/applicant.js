// TOTAL ENDPOINTS : 10

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

// 1- GET /api/applicant/:job_id
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

    // Get list of shortlisted candidates based on job id
    const applicantList = await prisma.applicant.findMany({
        where: {
            job_id: job_id,
            is_only_wish: false,
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
            "List of applicants for job " + job_id + " successfully retrieved.",
        data: applicantList,
    });
});

// 2- GET /api/applicant/wishlist/:candidate_profile_id
router.get("/wishlist/:candidate_profile_id", async (req, res) => {
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

    // Get wishlist based on candidate profile id
    const wishlist = await prisma.applicant.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
            is_only_wish: true,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of wishlisted job for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: wishlist,
    });
});

// 3- GET /api/applicant/applied-job/:candidate_profile_id
router.get("/applied-job/:candidate_profile_id", async (req, res) => {
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

    // Get applied job list based on candidate profile id
    const appliedJob = await prisma.applicant.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
            is_only_wish: false,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of applied job for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: appliedJob,
    });
});

// 4- GET /api/applicant/:job_id/:candidate_profile_id
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
    const applicantExists = await prisma.applicant.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
            is_only_wish: false,
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
    if (!applicantExists) {
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
            "Candidate " +
            candidate_profile_id +
            " in list of applicants for job " +
            job_id +
            " successfully retrieved.",
        data: applicantExists,
    });
});

// 5- POST /api/applicant
router.post("/", async (req, res) => {
    const { notes, is_only_wish, candidate_profile_id, job_id } = req.body;

    // Check if the variables are empty
    if (notContainsValue(candidate_profile_id) || notContainsValue(job_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Candidate profile id and Job id is required.",
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
    const applicantExists = await prisma.applicant.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
        },
    });

    // The response if the candidate profile id is already included in job id
    if (applicantExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message:
                "Candidate " +
                candidate_profile_id +
                " is already in job " +
                job_id +
                " as applicant.",
        });
        return;
    }

    // Create new applicant
    const newApplicant = await prisma.applicant.create({
        data: {
            id: randomUUID(),
            notes: notContainsValue(notes) ? "" : notes,
            is_only_wish: is_only_wish,
            is_viewed: false,
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
        },
    });

    // The response if new applicant cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New applicant cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New applicant list successfully created.",
        data: newApplicant,
    });
});

// 6- PATCH /api/applicant/:job_id/:candidate_profile_id/notes
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
    const applicantExists = await prisma.applicant.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
            is_only_wish: false,
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!applicantExists) {
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

    // Update the notes
    const updatedApplicant = await prisma.applicant.update({
        where: {
            id: applicantExists.id,
        },
        data: {
            notes: notes,
        },
    });

    // The response if the notes cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Intern Server Error",
    //         message:
    //             "Notes for applicant " +
    //             candidate_profile_id +
    //             " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Notes for candidate " +
            candidate_profile_id +
            " that applied in job " +
            job_id +
            " successfully updated;",
        data: updatedApplicant,
    });
});

// 7- PATCH /api/applicant/:job_id/:candidate_profile_id/apply-status
router.patch(
    "/:job_id/:candidate_profile_id/apply-status",
    async (req, res) => {
        const job_id = req.params.job_id;
        const candidate_profile_id = req.params.candidate_profile_id;

        const { is_only_wish } = req.body;

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
        const applicantExists = await prisma.applicant.findFirst({
            where: {
                candidate_profile_id: candidate_profile_id,
                job_id: job_id,
                // is_only_wish: false,
            },
        });

        // The response if the candidate profile id is not included in job id
        if (!applicantExists) {
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
        const updatedApplicant = await prisma.applicant.update({
            where: {
                id: applicantExists.id,
            },
            data: {
                is_only_wish: is_only_wish,
            },
        });

        // The response if the candidate cannot be updated
        // if (!false) {
        //     res.status(500).json({
        //         endpoint: req.originalUrl,
        //         status: "500 - Intern Server Error",
        //         message:
        //             "Applicant " +
        //             candidate_profile_id +
        //             " cannot be updated due to internal error.",
        //     });
        //     return;
        // }

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200 - Ok",
            message:
                "Apply status for candidate " +
                candidate_profile_id +
                " that applied in job " +
                job_id +
                " successfully updated;",
            data: updatedApplicant,
        });
    }
);

// 8- PATCH /api/applicant/:job_id/:candidate_profile_id/view-application
router.patch(
    "/:job_id/:candidate_profile_id/view-application",
    async (req, res) => {
        const job_id = req.params.job_id;
        const candidate_profile_id = req.params.candidate_profile_id;

        const { is_viewed } = req.body;

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
        const applicantExists = await prisma.applicant.findFirst({
            where: {
                candidate_profile_id: candidate_profile_id,
                job_id: job_id,
                is_only_wish: false,
            },
        });

        // The response if the candidate profile id is not included in job id
        if (!applicantExists) {
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
        const updatedApplicant = await prisma.applicant.update({
            where: {
                id: applicantExists.id,
            },
            data: {
                is_viewed: true,
            },
        });

        // The response if the candidate cannot be updated
        // if (!false) {
        //     res.status(500).json({
        //         endpoint: req.originalUrl,
        //         status: "500 - Intern Server Error",
        //         message:
        //             "Applicant " +
        //             candidate_profile_id +
        //             " cannot be updated due to internal error.",
        //     });
        //     return;
        // }

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200 - Ok",
            message:
                "HR has viewed the application for candidate " +
                candidate_profile_id +
                " that applied in job " +
                job_id,
            data: updatedApplicant,
        });
    }
);

// 9- DELETE /api/applicant/wishlist/:candidate_profile_id/:job_id
router.delete("/wishlist/:candidate_profile_id/:job_id", async (req, res) => {
    const candidate_profile_id = req.params.candidate_profile_id;
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
    const applicantExists = await prisma.applicant.findFirst({
        where: {
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
            is_only_wish: true,
        },
    });

    // The response if the candidate profile id is not included in job id
    if (!applicantExists) {
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

    // Delete a job in wishlist
    await prisma.applicant.delete({
        where: {
            id: applicantExists.id,
        },
    });

    // The response if the applicant cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Intern Server Error",
    //         message:
    //             "Applicant " +
    //             candidate_profile_id +
    //             " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Job " +
            job_id +
            " in wishlist from candidate " +
            candidate_profile_id +
            " successfully deleted.",
    });
});

// 10- DELETE /applicant/applied-job/:candidate_profile_id/:job_id
router.delete(
    "/applied-job/:candidate_profile_id/:job_id",
    async (req, res) => {
        const candidate_profile_id = req.params.candidate_profile_id;
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
        const applicantExists = await prisma.applicant.findFirst({
            where: {
                candidate_profile_id: candidate_profile_id,
                job_id: job_id,
                is_only_wish: false,
            },
        });

        // The response if the candidate profile id is not included in job id
        if (!applicantExists) {
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

        // Delete a job in applied job
        await prisma.applicant.delete({
            where: {
                id: applicantExists.id,
            },
        });

        // The response if the applicant cannot be deleted
        // if (!false) {
        //     res.status(500).json({
        //         endpoint: req.originalUrl,
        //         status: "500 - Intern Server Error",
        //         message:
        //             "Applicant " +
        //             candidate_profile_id +
        //             " cannot be deleted due to internal error.",
        //     });
        //     return;
        // }

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200 - Ok",
            message:
                "Job " +
                job_id +
                " in applied job list from candidate " +
                candidate_profile_id +
                " successfully deleted.",
            data: [],
        });
    }
);

module.exports = router;

/**
- id
- notes
- is_only_wish
- candidate_profile_id
- job_id
*/
