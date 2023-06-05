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

// 1- GET /api/skill/:candidate_profile_id
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

    // Get skill list based on candidate profile id
    const skilList = await prisma.skill.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of skills for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: skilList,
    });
});

// 2- POST /api/skill
router.post("/", async (req, res) => {
    const { skill_name, proficiency, candidate_profile_id } = req.body;

    // Check if the variables are empty
    if (
        notContainsValue(skill_name) ||
        notContainsValue(proficiency) ||
        notContainsValue(candidate_profile_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Skill name, Proficiency and Candidate profile id is required.",
            data: [],
        });
        return;
    }

    // Check if the skill name has already created
    const skillExists = await prisma.skill.findFirst({
        where: {
            skill_name: skill_name,
        },
    });

    // The response if skill name has already created
    if (skillExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Skill name " + skill_name + " has already created.",
        });
        return;
    }

    // Create new skill
    const newSkill = await prisma.skill.create({
        data: {
            id: randomUUID(),
            skill_name: skill_name,
            proficiency: proficiency,
            candidate_profile_id: candidate_profile_id,
        },
    });

    // The response if new skill cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New skill cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New skill successfully created.",
        data: newSkill,
    });
});

// 3- DELETE /api/skill/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the skill id is exists
    const skillExists = await prisma.skill.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the skill id is not exists
    if (!skillExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Skill id not found.",
        });
        return;
    }

    // Delete skill
    await prisma.skill.delete({
        where: {
            id: id,
        },
    });

    // The response of the skill cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New skill cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Skill " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- skill_name
- proficiency
- candidate_profile_id
*/
