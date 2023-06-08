// TOTAL ENDPOINTS : 9

const router = require("express").Router();

// Import crypto modules to generate UUID
const { randomUUID } = require("crypto");

const Fuse = require("fuse.js");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// 1- GET /api/job/search
router.get("/search", async (req, res) => {
    const query = decodeURIComponent(req.query.q);
    // const field = decodeURIComponent(req.query.f);
    // const type = decodeURIComponent(req.query.t);
    // const location = decodeURIComponent(req.query.loc);
    // const posted = decodeURIComponent(req.query.post);

    // const {  } = req.body;

    // Search job based on query
    const jobList = await prisma.job.findMany({
        where: {
            recruitment_status: "Advertised",
        },
        include: {
            company: true,
        },
    });

    // const resultJob = jobList.filter((job) => {
    //     return (
    //         job.designation.toLowerCase().indexOf(query) != -1 ||
    //         job.company.name.toLowerCase().indexOf(query) != -1
    //     );
    // });

    const options = {
        // isCaseSensitive: false,
        includeScore: true,
        // shouldSort: true,
        // includeMatches: false,
        // findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        // fieldNormWeight: 1,
        keys: [
            "designation",
            "job_responsibilities",
            "other_info",
            "job_field",
        ],
    };

    const fuse = new Fuse(jobList, options);

    let list = fuse.search(query);

    if (req.query.f) {
        const field = decodeURIComponent(req.query.f);

        list = list.filter((el) => el.item.job_field === field);
    }

    if (req.query.t) {
        const type = decodeURIComponent(req.query.t);

        list = list.filter((el) => {
            const types = el.item.job_type
                .split(",")
                .map((type) => type.trim());

            if (type === "any") {
                return true;
            } else {
                const criteriaArray = type
                    .split(",")
                    .map((criteria) => criteria.trim());

                return criteriaArray.some((criteria) =>
                    types.includes(criteria)
                );
            }
        });
    }

    if (req.query.loc) {
        const location = decodeURIComponent(req.query.loc);

        const [state, country] = location.split(", ");

        list = list.filter((el) => {
            return (
                el.item.company.state === state &&
                el.item.company.country === country
            );
        });
    }

    if (req.query.post) {
        const posted = decodeURIComponent(req.query.post);

        list = list.filter((el) => {
            if (posted === "any") {
                return true;
            } else {
                // Get the current date
                const currentDate = new Date();

                // Get the date 7 days ago
                const daysAgo = new Date();

                if (posted === "1") {
                    daysAgo.setDate(currentDate.getDate() - 1);
                } else if (posted === "7") {
                    daysAgo.setDate(currentDate.getDate() - 7);
                } else if (posted === "14") {
                    daysAgo.setDate(currentDate.getDate() - 14);
                } else if (posted === "30") {
                    daysAgo.setDate(currentDate.getDate() - 30);
                } else {
                    return true;
                }

                const targetDate = new Date(el.item.last_modified_date);

                return targetDate >= daysAgo;
            }
        });
    }

    const uniqueLocations = [
        ...new Set(
            list.map(
                (el) => el.item.company.state + ", " + el.item.company.country
            )
        ),
    ];

    const uniqueStatus = [
        ...new Set(list.map((el) => el.item.recruitment_status)),
    ];

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "List of jobs for search query " + query,
        data: {
            list,
            uniqueLocations,
            uniqueStatus,
        },
    });
});

// 2- GET /api/job/:id
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if id is exists
    const jobExists = await prisma.job.findUnique({
        where: {
            id: id,
        },
        include: {
            company: true,
        },
    });

    // The response if the id is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job id not found.",
        });
        return;
    }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Job " + id + " successfully retrieved.",
        data: jobExists,
    });
});

// 3- GET /api/job/company/:company_id
router.get("/company/:company_id", async (req, res) => {
    const company_id = req.params.company_id;
    const { status } = req.query;

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company id is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    let jobList = [];
    if (status) {
        // Get the job based on the officer's company id
        jobList = await prisma.job.findMany({
            where: {
                company_id: company_id,
                recruitment_status: decodeURIComponent(status),
            },
            include: {
                company: true,
            },
        });
    } else {
        // Get the job based on the officer's company id
        jobList = await prisma.job.findMany({
            where: {
                company_id: company_id,
            },
            include: {
                company: true,
            },
        });
    }

    const uniqueField = [...new Set(jobList.map((job) => job.job_field))];

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200",
        message:
            "List of jobs for company " +
            company_id +
            " successfully retrieved.",
        data: {
            jobList,
            uniqueField,
        },
    });
});

// 4- GET /api/job/company/:company_id/field/:field
router.get("/company/:company_id/field/:field", async (req, res) => {
    const company_id = req.params.company_id;
    const field = decodeURIComponent(req.params.field);

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company id is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Get the job based on the officer's company id
    const jobList = await prisma.job.findMany({
        where: {
            company_id: company_id,
            job_field: field,
            recruitment_status: "Advertised",
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200",
        message:
            "List of jobs for company " +
            company_id +
            " from " +
            field +
            " field successfully retrieved.",
        data: jobList,
    });
});

// 5- GET /api/job/company/:company_id/recruitment_status/:recruitment_status
router.get(
    "/company/:company_id/recruitment_status/:recruitment_status",
    async (req, res) => {
        const company_id = req.params.company_id;
        const recruitment_status = req.params.recruitment_status;

        // Check if the company id is exists
        const companyExists = await prisma.company.findUnique({
            where: {
                id: company_id,
            },
        });

        // The response if the company id is not exists
        if (!companyExists) {
            res.status(404).json({
                endpoint: req.originalUrl,
                status: "404 - Not Found",
                message: "Company id not found.",
            });
            return;
        }

        // Get the job based on the officer's company id
        const jobList = await prisma.job.findMany({
            where: {
                company_id: company_id,
                recruitment_status: recruitment_status,
            },
        });

        res.status(200).json({
            endpoint: req.originalUrl,
            status: "200",
            message:
                "List of jobs for company " +
                company_id +
                " that currently " +
                recruitment_status +
                " status successfully retrieved.",
            data: jobList,
        });
    }
);

// 6- POST /api/job
router.post("/", async (req, res) => {
    const {
        designation,
        department,
        min_monthly_salary,
        max_monthly_salary,
        candidate_nationality,
        candidate_min_edu_level,
        candidate_min_of_exp,
        candidate_lang_req,
        candidate_other_req,
        job_responsibilities,
        other_info,
        created_date,
        last_modified_date,
        recruitment_status,
        job_type,
        job_field,
        officer_id,
    } = req.body;

    if (
        notContainsValue(designation) ||
        notContainsValue(department) ||
        min_monthly_salary < 0 ||
        max_monthly_salary < 0 ||
        notContainsValue(candidate_nationality) ||
        notContainsValue(candidate_min_edu_level) ||
        notContainsValue(candidate_min_of_exp) ||
        notContainsValue(candidate_lang_req) ||
        notContainsValue(job_responsibilities) ||
        notContainsValue(created_date) ||
        notContainsValue(last_modified_date) ||
        notContainsValue(recruitment_status) ||
        notContainsValue(job_type) ||
        notContainsValue(job_field) ||
        notContainsValue(officer_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Designation, Department, Minimum monthly salary, Maximum monthly salary, Candidate nationality, Candidate minimum education level, Candidate minimum work experience, Candidate language requirement(s), Job responsibilities, Created date, Last modified date, Recruitment status, Job type, Job field and Officer id is required.",
        });
        return;
    }

    // Check if the officer id is exists
    const officerExists = await prisma.officer.findUnique({
        where: {
            id: officer_id,
        },
    });

    // The response if the officer id is not exists
    if (!officerExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Officer id not found",
        });
        return;
    }

    // Check if the officer has company
    if (notContainsValue(officerExists.company_id)) {
        // The response if the officer is not associated with any company
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company for officer " + officer_id + " is not found.",
        });
        return;
    }

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: officerExists.company_id,
        },
    });

    // The response if the company is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Create a new job
    const newJob = await prisma.job.create({
        data: {
            id: randomUUID(),
            designation: designation,
            department: department,
            min_monthly_salary: min_monthly_salary,
            max_monthly_salary: max_monthly_salary,
            candidate_nationality: candidate_nationality,
            candidate_min_edu_level: candidate_min_edu_level,
            candidate_min_of_exp: candidate_min_of_exp,
            candidate_lang_req: candidate_lang_req,
            candidate_other_req: candidate_other_req,
            job_responsibilities: job_responsibilities,
            other_info: other_info,
            created_date: created_date,
            last_modified_date: last_modified_date,
            recruitment_status: recruitment_status,
            job_type: job_type,
            job_field: job_field,
            company_id: officerExists.company_id,
        },
    });

    // The response if new job cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New job cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New job successfully created.",
        data: newJob,
    });
});

// 7- PATCH /api/job/:company_id/:job_id
router.patch("/:company_id/:job_id", async (req, res) => {
    const company_id = req.params.company_id;
    const job_id = req.params.job_id;

    const {
        designation,
        department,
        min_monthly_salary,
        max_monthly_salary,
        candidate_nationality,
        candidate_min_edu_level,
        candidate_min_of_exp,
        candidate_lang_req,
        candidate_other_req,
        job_responsibilities,
        other_info,
        last_modified_date,
        recruitment_status,
        job_type,
        job_field,
    } = req.body;

    if (
        notContainsValue(designation) ||
        notContainsValue(department) ||
        min_monthly_salary < 0 ||
        max_monthly_salary < 0 ||
        notContainsValue(candidate_nationality) ||
        notContainsValue(candidate_min_edu_level) ||
        notContainsValue(candidate_min_of_exp) ||
        notContainsValue(candidate_lang_req) ||
        notContainsValue(job_responsibilities) ||
        notContainsValue(last_modified_date) ||
        notContainsValue(recruitment_status) ||
        notContainsValue(job_type) ||
        notContainsValue(job_field)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Designation, Department, Minimum monthly salary, Maximum monthly salary, Candidate nationality, Candidate minimum education level, Candidate minimum work experience, Candidate language requirement(s), Job responsibilities, Last modified date, Recruitment status, Job type and Job field is required.",
        });
        return;
    }

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Check if the job id that associated with company id is exists
    const jobExists = await prisma.job.findFirst({
        where: {
            id: job_id,
            company_id: company_id,
        },
    });

    // The response if the job is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job not found.",
        });
        return;
    }

    // Update the job
    const updatedJob = await prisma.job.update({
        where: {
            id: job_id,
        },
        data: {
            designation: designation,
            department: department,
            min_monthly_salary: min_monthly_salary,
            max_monthly_salary: max_monthly_salary,
            candidate_nationality: candidate_nationality,
            candidate_min_edu_level: candidate_min_edu_level,
            candidate_min_of_exp: candidate_min_of_exp,
            candidate_lang_req: candidate_lang_req,
            candidate_other_req: candidate_other_req,
            job_responsibilities: job_responsibilities,
            other_info: other_info,
            last_modified_date: last_modified_date,
            recruitment_status: recruitment_status,
            job_type: job_type,
            job_field: job_field,
        },
    });

    // The response if the job cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Job " + job_id + " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Job " +
            job_id +
            " from company " +
            company_id +
            " successfully updated.",
        data: updatedJob,
    });
});

// 8- PATCH /api/job/recruitment-status/:company_id/:job_id
router.patch("/recruitment-status/:company_id/:job_id", async (req, res) => {
    const company_id = req.params.company_id;
    const job_id = req.params.job_id;

    const { recruitment_status } = req.body;

    if (notContainsValue(recruitment_status)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Recruitment status is required.",
        });
        return;
    }

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Check if the job id that associated with company id is exists
    const jobExists = await prisma.job.findFirst({
        where: {
            id: job_id,
            company_id: company_id,
        },
    });

    // The response if the job is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job not found.",
        });
        return;
    }

    // Update the job recruitment status
    const updatedRecruitStatusJob = await prisma.job.update({
        where: {
            id: job_id,
        },
        data: {
            recruitment_status: recruitment_status,
        },
    });

    // The response if the job recruitment status cannot be updated
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Job " + job_id + " cannot be updated due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Recruitment status for job " +
            job_id +
            " from company " +
            company_id +
            " successfully updated.",
        data: updatedRecruitStatusJob,
    });
});

// 9- DELETE /api/job/:company_id/:job_id
router.delete("/:company_id/:job_id", async (req, res) => {
    const company_id = req.params.company_id;
    const job_id = req.params.job_id;

    // Check if the company id is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    // The response if the company is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id not found.",
        });
        return;
    }

    // Check if the job id that associated with company id is exists
    const jobExists = await prisma.job.findFirst({
        where: {
            id: job_id,
            company_id: company_id,
        },
    });

    // The response if the job is not exists
    if (!jobExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Job not found.",
        });
        return;
    }

    // Delete the job recruitment status
    await prisma.job.delete({
        where: {
            id: job_id,
        },
    });

    // The response if the job recruitment status cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Job " + job_id + " cannot be deleted due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "Job " +
            job_id +
            " from company " +
            company_id +
            " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- designation
- department
- min_monthly_salary
- max_monthly_salary
- candidate_nationality
- candidate_min_edu_level
- candidate_min_of_exp
- candidate_lang_req
- candidate_other_req
- job_responsibilities
- other_info
- created_date
- last_modified_date
- recruitment_status
- job_type
- job_field
- officer_id
*/
