// TOTAL ENDPOINTS : 9

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

// 1- GET /api/shortlisted-candidate/:job_id
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
    const shortlistedCandidateList =
        await prisma.shortlisted_Candidate.findMany({
            where: {
                job_id: job_id,
                // is_qualified_interview: false,
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
            "List of shortlisted candidates for job " +
            job_id +
            " successfully retrieved.",
        data: shortlistedCandidateList,
    });
});

// 2- GET /api/shortlisted-candidate/:job_id/interview
router.get("/:job_id/interview", async (req, res) => {
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
    const interviewCandidateList = await prisma.shortlisted_Candidate.findMany({
        where: {
            job_id: job_id,
            is_qualified_interview: true,
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
            "List of interview candidate for job " +
            job_id +
            " successfully retrieved.",
        data: interviewCandidateList,
    });
});

// 3- GET /api/shortlisted-candidate/:job_id/interview/:candidate_profile_id
router.get("/:job_id/interview/:candidate_profile_id", async (req, res) => {
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
    const interviewCandidateExists =
        await prisma.shortlisted_Candidate.findFirst({
            where: {
                job_id: job_id,
                candidate_profile_id: candidate_profile_id,
                is_qualified_interview: true,
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
    if (!interviewCandidateExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message:
                "Interview candidate id " +
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
            "Interview candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully retrieved.",
        data: interviewCandidateExists,
    });
});

// 4- GET /api/shortlisted-candidate/:job_id/:candidate_profile_id
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
    const shortlistedCandidateExists =
        await prisma.shortlisted_Candidate.findFirst({
            where: {
                job_id: job_id,
                candidate_profile_id: candidate_profile_id,
                // is_qualified_interview: false,
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
    if (!shortlistedCandidateExists) {
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
            "Shortlisted candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully retrieved.",
        data: shortlistedCandidateExists,
    });
});

// 5- POST /api/shortlisted-candidate
router.post("/", async (req, res) => {
    const { notes, is_qualified_interview, candidate_profile_id, job_id } =
        req.body;

    if (notContainsValue(candidate_profile_id) || notContainsValue(job_id)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Is qualified interview, Candidate profile id and Job id is required.",
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
    const shortlistedCandidateExists =
        await prisma.shortlisted_Candidate.findFirst({
            where: {
                job_id: job_id,
                candidate_profile_id: candidate_profile_id,
                is_qualified_interview: false,
            },
        });

    // The response if the candidate profile id is already included in job id
    if (shortlistedCandidateExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message:
                "Candidate " +
                candidate_profile_id +
                " is already in job " +
                job_id +
                " as shortlisted candidate.",
        });
        return;
    }

    // Create a new shortlisted candidate
    const newShortlistedCandidate = await prisma.shortlisted_Candidate.create({
        data: {
            id: randomUUID(),
            notes: notContainsValue(notes) ? "" : notes,
            is_qualified_interview: is_qualified_interview,
            candidate_profile_id: candidate_profile_id,
            job_id: job_id,
        },
    });

    // The response if new shortlisted candidate cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New shortlisted candidate cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New shortlisted candidate successfully created.",
        data: newShortlistedCandidate,
    });
});

// 6- PATCH /api/shortlisted-candidate/:job_id/:candidate_profile_id/notes
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
    const shortlistedCandidateExists =
        await prisma.shortlisted_Candidate.findFirst({
            where: {
                job_id: job_id,
                candidate_profile_id: candidate_profile_id,
            },
        });

    // The response if the candidate profile id is not included in job id
    if (!shortlistedCandidateExists) {
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
    const updatedNotesCandidate = await prisma.shortlisted_Candidate.update({
        where: {
            id: shortlistedCandidateExists.id,
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
    //             "Notes for shortlisted candidate " +
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
            " in job " +
            job_id +
            " successfully updated.",
        data: updatedNotesCandidate,
    });
});

// 7- PATCH /api/shortlisted-candidate/:job_id/interview-status/:candidate_profile_id
router.patch(
    "/:job_id/interview-status/:candidate_profile_id",
    async (req, res) => {
        const job_id = req.params.job_id;
        const candidate_profile_id = req.params.candidate_profile_id;

        const { is_qualified_interview } = req.body;

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
        const shortlistedCandidateExists =
            await prisma.shortlisted_Candidate.findFirst({
                where: {
                    job_id: job_id,
                    candidate_profile_id: candidate_profile_id,
                },
            });

        // The response if the candidate profile id is not included in job id
        if (!shortlistedCandidateExists) {
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
        const updatedInterviewStatusCandidate =
            await prisma.shortlisted_Candidate.update({
                where: {
                    id: shortlistedCandidateExists.id,
                },
                data: {
                    is_qualified_interview: is_qualified_interview,
                },
            });

        // The response if the candidate cannot be updated
        // if (!false) {
        //     res.status(500).json({
        //         endpoint: req.originalUrl,
        //         status: "500 - Intern Server Error",
        //         message:
        //             "Shortlisted candidate " +
        //             candidate_profile_id +
        //             " cannot be updated due to internal error.",
        //     });
        //     return;
        // }

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200 - Ok",
            message:
                "Interview status for candidate " +
                candidate_profile_id +
                " in job " +
                job_id +
                " successfully updated.",
            data: updatedInterviewStatusCandidate,
        });
    }
);

// 8- PATCH /api/shortlisted-candidate/:job_id/interview-detail/:candidate_profile_id
router.patch(
    "/:job_id/interview-detail/:candidate_profile_id",
    async (req, res) => {
        const job_id = req.params.job_id;
        const candidate_profile_id = req.params.candidate_profile_id;

        const { interview_datetime, interview_platform } = req.body;

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
        const shortlistedCandidateExists =
            await prisma.shortlisted_Candidate.findFirst({
                where: {
                    job_id: job_id,
                    candidate_profile_id: candidate_profile_id,
                    is_qualified_interview: false,
                },
            });

        // The response if the candidate profile id is not included in job id
        if (!shortlistedCandidateExists) {
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

        // Update interview detail
        const updatedInterviewStatusCandidate =
            await prisma.shortlisted_Candidate.update({
                where: {
                    id: shortlistedCandidateExists.id,
                },
                data: {
                    interview_datetime: interview_datetime,
                    interview_platform: interview_platform,
                },
            });

        // The response if the candidate cannot be updated
        // if (!false) {
        //     res.status(500).json({
        //         endpoint: req.originalUrl,
        //         status: "500 - Intern Server Error",
        //         message:
        //             "Shortlisted candidate " +
        //             candidate_profile_id +
        //             " cannot be updated due to internal error.",
        //     });
        //     return;
        // }

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200 - Ok",
            message:
                "Interview status for candidate " +
                candidate_profile_id +
                " in job " +
                job_id +
                " successfully updated.",
            data: updatedInterviewStatusCandidate,
        });
    }
);

// 9- DELETE /api/shortlisted-candidate/:job_id/:candidate_profile_id
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
    const shortlistedCandidateExists =
        await prisma.shortlisted_Candidate.findFirst({
            where: {
                job_id: job_id,
                candidate_profile_id: candidate_profile_id,
                is_qualified_interview: false,
            },
        });

    // The response if the candidate profile id is not included in job id
    if (!shortlistedCandidateExists) {
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

    // Delete shortlisted candidate
    await prisma.shortlisted_Candidate.delete({
        where: {
            id: shortlistedCandidateExists.id,
        },
    });

    // The response if the shortlisted candidate cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Intern Server Error",
    //         message:
    //             "Notes for shortlisted candidate " +
    //             candidate_profile_id +
    //             " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Candidate " +
            candidate_profile_id +
            " in job " +
            job_id +
            " successfully deleted from shortlisted candidate.",
    });
});

module.exports = router;

/**
- id
- notes
- is_qualified_interview
- candidate_profile_id
- job_id
*/
