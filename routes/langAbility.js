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

// 1- GET /api/lang-ability/:candidate_profile_id
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

    // Get language ability list based on candidate profile id
    const langAbilityList = await prisma.lang_Ability.findMany({
        where: {
            candidate_profile_id: candidate_profile_id,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message:
            "List of language ability for candidate " +
            candidate_profile_id +
            " successfully retrieved.",
        data: langAbilityList,
    });
});

// 2- POST /api/lang-ability
router.post("/", async (req, res) => {
    const {
        language_name,
        scale_of_writing,
        scale_of_speaking,
        candidate_profile_id,
    } = req.body;

    if (
        notContainsValue(language_name) ||
        notContainsValue(scale_of_writing) ||
        notContainsValue(scale_of_speaking) ||
        notContainsValue(candidate_profile_id)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Language name, Scale of writing, Scale of speaking and Candidate profile id is required.",
            data: [],
        });
        return;
    }

    // Check if the language name is already created
    const langAbilityExists = await prisma.lang_Ability.findFirst({
        where: {
            language_name: language_name,
        },
    });

    // The response if language name is already created
    if (langAbilityExists) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Language name " + language_name + " has already created.",
        });
        return;
    }

    // Create new language ability
    const newLangAbility = await prisma.lang_Ability.create({
        data: {
            id: randomUUID(),
            language_name: language_name,
            scale_of_writing: scale_of_writing,
            scale_of_speaking: scale_of_speaking,
            candidate_profile_id: candidate_profile_id,
        },
    });

    console.log(newLangAbility);

    // The response if new language ability cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New language ability cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "New language ability successfully created.",
        data: newLangAbility,
    });
});

// 3- DELETE /api/lang-ability/:id
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    // Check if the language ability id is exists
    const langAbilityExists = await prisma.lang_Ability.findUnique({
        where: {
            id: id,
        },
    });

    // The response if the language ability id is not exists
    if (!langAbilityExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Language ability id not found.",
        });
        return;
    }

    // Delete language ability
    await prisma.lang_Ability.delete({
        where: {
            id: id,
        },
    });

    // The response of the language ability cannot be deleted
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "New language ability cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Language ability " + id + " successfully deleted.",
    });
});

module.exports = router;

/**
- id
- language_name
- scale_of_writing
- scale_of_speaking
- candidate_profile_id
*/
