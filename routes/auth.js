// TOTAL ENDPOINTS : 10

const router = require("express").Router();

// Import redis
const Redis = require("redis");

// Import nodemailer
const nodemailer = require("nodemailer");

// Import crypto modules to hash and salt a password, used for signup and login
const {
    scryptSync,
    randomBytes,
    timingSafeEqual,
    randomUUID,
    createHash,
    createCipheriv,
    createDecipheriv,
} = require("crypto");

// Import JWT library for sign and verify token
const jwt = require("jsonwebtoken");

// Import PrismaClient
const { PrismaClient } = require("@prisma/client");

// Import check token middleware
const checkToken = require("../middlewares/checkToken");

// Instantiate new Redis client
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

// Instantiate new prisma client
const prisma = new PrismaClient();

// A regex pattern for validating password
const regexpassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// A regex pattern for validating email
const regexemail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;

// A function to check if the string has a value or not
function notContainsValue(str) {
    return !(str && str.length > 0);
}

// A function to generate OTP
function generateOTP(length) {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        otp += digits[randomIndex];
    }

    return otp;
}

// 1- POST /api/auth/signup
router.post("/signup", async (req, res) => {
    const {
        fullname,
        email,
        password,
        confirmpassword,
        inv_id,
        inviteToken,
        role_id,
    } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(fullname) ||
        notContainsValue(email) ||
        notContainsValue(password) ||
        notContainsValue(confirmpassword)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Full Name, Email, Password and Confirm Password is required.",
            data: [],
        });
        return;
    }

    // Check if email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 -  Bad Request",
            message: "Email is not valid",
            data: [],
        });
        return;
    }

    // Check if password is meets the requirements
    if (!regexpassword.test(password)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Password is not valid. Password must contains at least one lowercase letter, one uppercase letter and one number. Password must also has a minimum length of 8 characters.",
            data: [],
        });
        return;
    }

    // Check if the confirm password matches to password
    if (confirmpassword !== password) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 -  Bad Request",
            message: "Confirm password does not match!",
            data: [],
        });
        return;
    }

    // Check if the email is already exists in the database
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the email is already exists
    if (userExistsEmail) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Email is already exists.",
        });
        return;
    }

    // Generate a salt, random bytes that will mix with hashed password
    const salt = randomBytes(64).toString("hex");
    // Hash the password, and mix it with the salt
    const hashedPassword = scryptSync(password, salt, 64).toString("hex");

    // Check if the invite token exists (for sign up new officer) in redis cache
    redisClient.connect();

    // let officer_role = "";
    // The response if the invite token is invalid
    if (!notContainsValue(inv_id) && !notContainsValue(inviteToken)) {
        const saved_inviteToken = await redisClient.get(inv_id);

        if (!saved_inviteToken || inviteToken !== saved_inviteToken) {
            res.status(400).json({
                endpoint: req.originalUrl,
                status: "400 - Bad Request",
                message: "Invite token is invalid.",
            });
            return;
        }
    }

    let officer_role = "";

    if (role_id) {
        officer_role = await redisClient.get(role_id);
    }

    redisClient.quit();

    // Store the new user information, for password save ${salt}.${hashedPassword}
    const newUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            email: email,
            name: fullname,
            password: `${salt}.${hashedPassword}`,
            role: role_id && officer_role ? officer_role : "applicant",
        },
    });

    // The response if the new user cannot be created
    // if (false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New user cannot be created due to internal error.",
    //     });
    //     return;
    // }

    // Create an access token, it will use by user for authorization
    const accessToken = jwt.sign(
        { id: randomUUID(), fullname, email },
        process.env.ACCESS_TOKEN
    );

    // Create refresh token, expires in 7 days if user not active in 7 days in a row
    // Cipher
    const expiryDate = JSON.stringify(new Date().toDateString());
    const cipherKey = randomBytes(32);
    const cipherIv = randomBytes(16);

    const cipher = createCipheriv("aes256", cipherKey, cipherIv);

    // Encrypt
    const encryptedExpiryDate =
        cipher.update(expiryDate, "utf8", "hex") + cipher.final("hex");

    const refreshToken = `${encryptedExpiryDate}.${cipherKey.toString(
        "hex"
    )}.${cipherIv.toString("hex")}`;

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "Successfully signed up new user.",
        data: {
            newUser: newUser,
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });
});

// 2- POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if the variable is empty
    if (notContainsValue(email) || notContainsValue(password)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email and Password is required.",
            data: [],
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid.",
            data: [],
        });
        return;
    }

    // Get the user password based on the email
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the user not exists
    if (!userExistsEmail) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "User is not found.",
        });
        return;
    }

    // Destructure salt and hashed password from database
    const [salt, key] = userExistsEmail.password.split(".");
    // Hash the password from login with the original salt
    const hashedBuffer = scryptSync(password, salt, 64);

    // Convert the hashed password from database to hex
    const keyBuffer = Buffer.from(key, "hex");

    // Matching the hashed password from login and from database
    // timingSafeEqual function is a function for comparing two values,
    // but it will also prevent the timing attack from the hackers.
    const isMatch = timingSafeEqual(hashedBuffer, keyBuffer);

    // The response the password is not match
    if (!isMatch) {
        res.status(401).json({
            endpoint: req.originalUrl,
            status: "401 - Unauthorized",
            message: "Login failed. Please try again.",
        });
        return;
    }

    // Create an access token, it will use by user for authorization
    const accessToken = jwt.sign(
        { id: randomUUID(), email },
        process.env.ACCESS_TOKEN
    );

    // Create refresh token, expires in 7 days if user not active in 7 days in a row
    // Cipher
    const expiryDate = JSON.stringify(new Date().toDateString());
    const cipherKey = randomBytes(32);
    const cipherIv = randomBytes(16);

    const cipher = createCipheriv("aes256", cipherKey, cipherIv);

    // Encrypt
    const encryptedExpiryDate =
        cipher.update(expiryDate, "utf8", "hex") + cipher.final("hex");

    const refreshToken = `${encryptedExpiryDate}.${cipherKey.toString(
        "hex"
    )}.${cipherIv.toString("hex")}`;

    // The response if the login success
    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Successfully logged in for current user.",
        data: {
            role: userExistsEmail.role,
            id: userExistsEmail.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });
});

// 3- POST /api/auth/admin
router.post("/admin", async (req, res) => {
    const { fullname, email, password, confirmpassword, role } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(fullname) ||
        notContainsValue(email) ||
        notContainsValue(password) ||
        notContainsValue(confirmpassword) ||
        notContainsValue(role)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Full Name, Email, Password and Confirm Password is required.",
            data: [],
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid",
            data: [],
        });
        return;
    }

    // Check if the password meets the requirements
    if (!regexpassword.test(password)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Password is not valid. Password must contains at least one lowercase letter, one uppercase letter and one number. Password must also has a minimum length of 8 characters.",
            data: [],
        });
        return;
    }

    // Check if the confirm password matches to password
    if (confirmpassword !== password) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Confirm password does not match!",
            data: [],
        });
        return;
    }

    // Check if the email is already exists in the database
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if email is already exists
    if (userExistsEmail) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Email is already exists.",
        });
        return;
    }

    // Generate a salt, random bytes that will mix with hashed password
    const salt = randomBytes(64).toString("hex");
    // Hash the password, and mix it with the salt
    const hashedPassword = scryptSync(password, salt, 64).toString("hex");

    // Store the new user information, for password save ${salt}:${hashedPassword}
    const newUser = await prisma.user.create({
        data: {
            id: randomUUID(),
            email: email,
            name: fullname,
            password: `${salt}.${hashedPassword}`,
            role: role,
        },
    });

    // The response if the new user cannot be created
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "New user cannot be created due to internal error.",
    //     });
    //     return;
    // }

    // Create an access token, it will use by user for authorization
    const accessToken = jwt.sign(
        { id: randomUUID(), fullname, email },
        process.env.ACCESS_TOKEN
    );

    // Create refresh token, expires in 7 days if user not active in 7 days in a row
    // Cipher
    const expiryDate = JSON.stringify(new Date().toDateString());
    const cipherKey = randomBytes(32);
    const cipherIv = randomBytes(16);

    const cipher = createCipheriv("aes256", cipherKey, cipherIv);

    // Encrypt
    const encryptedExpiryDate =
        cipher.update(expiryDate, "utf8", "hex") + cipher.final("hex");

    const refreshToken = `${encryptedExpiryDate}.${cipherKey.toString(
        "hex"
    )}.${cipherIv.toString("hex")}`;

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message: "Successfully created a new admin.",
        data: {
            newUser: newUser,
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
    });
});

// 4- POST /api/auth/link
router.post("/link", async (req, res) => {
    const { email, role, company_id, sendEmail } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(email) ||
        notContainsValue(role) ||
        notContainsValue(company_id) ||
        typeof sendEmail === Boolean
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email, Role, Company id and Method is required.",
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400",
            message: "Bad Request - Email is not valid",
        });
        return;
    }

    // Check if the email is already exists
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the email exists
    if (userExistsEmail) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Email is already exists.",
        });
        return;
    }

    // Check if the company is exists
    const companyExists = await prisma.company.findUnique({
        where: {
            id: company_id,
        },
    });

    console.log(await prisma.company.findMany());

    // The response of the company is not exists
    if (!companyExists) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Company id is not exists.",
        });
        return;
    }

    // Generate the id as a key
    const inv_id = randomUUID();

    // Generate the invite token as a value, hash the email to generate it
    const inviteToken = createHash("sha256").update(email).digest("hex");
    // const inviteToken = "abc123";

    // Store at redis cache as
    redisClient.connect();

    try {
        redisClient.setEx(inv_id, 3600, inviteToken);
    } catch (error) {
        // The response of otp cannot be stored
        res.status(500).json({
            endpoint: req.originalUrl,
            status: "500 - Internal Server Error",
            message: "Invite token cannot be created due to internal error.",
        });
        return;
    }

    // Generate the id as a key
    const role_id = randomUUID();

    // TEST MODE ONLY
    // let role_id = "";
    // if (role === "manager") {
    //     role_id = "111111";
    // } else if (role === "hr") {
    //     role_id = "222222";
    // } else if (role === "guest") {
    //     role_id = "333333";
    // }

    // Generate

    // Store the role as a value in redis cache
    try {
        redisClient.setEx(role_id, 3600, role);
    } catch (error) {
        // The response of otp cannot be stored
        res.status(500).json({
            endpoint: req.originalUrl,
            status: "500 - Internal Server Error",
            message: "Invite token cannot be created due to internal error.",
        });
        return;
    }

    redisClient.quit();

    // The response invite token cannot be stored
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "Invite token cannot be created due to internal error.",
    //     });
    //     return;
    // }

    // Generate some junk data to make link long as possible
    const junk1 = randomUUID();
    const junk2 = randomUUID();

    if (sendEmail === false) {
        res.status(201).json({
            endpoint: req.originalUrl,
            status: "201 - Created",
            message: "A sign up link for the officer successfully created.",
            data: {
                link: `${
                    process.env.FRONTEND_BASEURL
                }/auth/signup?access=${junk1}&link=${junk2}&invite=${company_id}&email=${encodeURIComponent(
                    email
                )}&key=${inv_id}&token=${inviteToken}&role=${role_id}`,
            },
        });
        return;
    }

    // Use nodemailer to send email
    // let transporter = nodemailer.createTransport({
    //     host: process.env.EMAIL_SENDER_HOST, // SMTP server address (usually mail.your-domain.com)
    //     port: parseInt(process.env.EMAIL_SENDER_PORT), // Port for SMTP
    //     secure: true, // Usually true
    //     auth: {
    //         user: process.env.EMAIL_SENDER_USER, // Your email address
    //         pass: process.env.EMAIL_SENDER_PASS, // Password
    //     },
    // });

    // let info = await transporter.sendMail({
    //     from: `"You" <${process.env.EMAIL_SENDER_USER}>`,
    //     to: email,
    //     subject: `Hireflash | Invitation link to join ${companyExists.name}`,
    //     html: `
    //     <p>Admin has sent this link to invite you to join ${
    //         companyExists.name
    //     } in Hireflash platform. <a href="${
    //         process.env.FRONTEND_BASEURL
    //     }/auth/signup?access=${junk1}&link=${junk2}&invite=${company_id}&email=${encodeURIComponent(
    //         email
    //     )}&key=${inv_id}&token=${inviteToken}&role=${role_id}" target="_blank">Click here to continue.</a>. Please ignore if this email not really meant for you.</p>
    // `,
    // });

    console.log(info);

    // The response if the email unsuccessfully sent

    res.status(201).json({
        endpoint: req.originalUrl,
        status: "201 - Created",
        message:
            "A sign up link for the officer successfully sent to via email.",
    });
});

// 5- POST /api/auth/get-started/email
router.post("/get-started/email", async (req, res) => {
    const { email } = req.body;

    // Check if the variable is empty
    if (notContainsValue(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is required.",
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid",
        });
        return;
    }

    // Check if the email is already exists
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the email exists
    if (userExistsEmail) {
        res.status(409).json({
            endpoint: req.originalUrl,
            status: "409 - Conflict",
            message: "Email is already exists.",
        });
        return;
    }

    const verificationCode = generateOTP(6);

    // Send the otp to the email
    // try {
    //     // Use nodemailer to send email
    //     let transporter = nodemailer.createTransport({
    //         host: process.env.EMAIL_SENDER_HOST, // SMTP server address (usually mail.your-domain.com)
    //         port: parseInt(process.env.EMAIL_SENDER_PORT), // Port for SMTP
    //         secure: true, // Usually true
    //         auth: {
    //             user: process.env.EMAIL_SENDER_USER, // Your email address
    //             pass: process.env.EMAIL_SENDER_PASS, // Password
    //         },
    //     });

    //     let info = await transporter.sendMail({
    //         from: `"You" <${process.env.EMAIL_SENDER_USER}>`,
    //         to: email,
    //         subject: `Hireflash | Code Verification`,
    //         html: `
    //     <p>Your code verifaction for creating new organization is ${verificationCode}</p>
    // `,
    //     });

    //     console.log(info);
    // } catch (error) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: `${error}`,
    //     });
    //     return;
    // }

    // The response if the otp failed to send
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "Verification code cannot be sent due to internal error.",
    //     });
    //     return;
    // }

    // Store otp at redis cache
    const verifyId = randomUUID();

    redisClient.connect();

    try {
        redisClient.setEx(verifyId, 3600, verificationCode);
    } catch (error) {
        // The response of otp cannot be stored
        res.status(500).json({
            endpoint: req.originalUrl,
            status: "500 - Internal Server Error",
            message:
                "Verification code cannot be created due to internal error.",
        });
        return;
    }

    redisClient.quit();

    // The response of otp cannot be stored
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Verification code cannot be created due to internal error.",
    //     });
    //     return;
    // }

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "A verification code successfully sent to the email.",
        data: {
            id: verifyId,
            verificationCode: verificationCode /* TEST MODE ONLY */,
            email: email /* TEST MODE ONLY */,
        },
    });
});

// 6- POST /api/auth/get-started/verify
router.post("/get-started/verify", async (req, res) => {
    const { id, verificationCode } = req.body;

    // Check if the variables is empty
    if (notContainsValue(id) || notContainsValue(verificationCode)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code is required.",
        });
        return;
    }

    // Check if the verifaction code length is actually 6
    if (verificationCode.length !== 6) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code must be in correct length.",
        });
        return;
    }

    redisClient.connect();

    // Check if the verification code same as stored in redis
    const code = await redisClient.get(id);

    // The response if the verification code is not matched
    // if (!false) {
    //     res.status(400).json({
    //         endpoint: req.originalUrl,
    //         status: "400 - Bad Request",
    //         message: "Verification code is incorrect.",
    //     });
    //     return;
    // }

    if (!code) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Verification code is not found.",
        });
        return;
    }

    if (code !== verificationCode) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code is incorrect.",
        });
        return;
    }

    // Delete the key and value of otp, if it is matched
    redisClient.del(id);

    redisClient.quit();

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Verification code is correct.",
    });
});

// 7- POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    // Check if the variable is empty
    if (notContainsValue(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is required.",
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid",
        });
        return;
    }

    // Check if the email is already exists
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the email exists
    if (!userExistsEmail) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Email is not found.",
        });
        return;
    }

    const verificationCode = generateOTP(6);

    // Send the otp to the email

    // The response if the otp failed to send
    // if (!false) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message: "Verification code cannot be sent due to internal error.",
    //     });
    //     return;
    // }

    // Store otp at redis cache
    const verifyId = randomUUID();

    redisClient.connect();

    try {
        redisClient.setEx(verifyId, 3600, verificationCode);
    } catch (error) {
        // The response of otp cannot be stored
        res.status(500).json({
            endpoint: req.originalUrl,
            status: "500 - Internal Server Error",
            message:
                "Verification code cannot be created due to internal error.",
        });
        return;
    }

    redisClient.quit();

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "A verification code successfully sent to the email.",
        data: {
            id: verifyId,
            verificationCode: verificationCode /* TEST MODE ONLY */,
            email: email /* TEST MODE ONLY */,
        },
    });
});

// 8- POST /api/auth/forgot-password/verify
router.post("/forgot-password/verify", async (req, res) => {
    const { id, verificationCode } = req.body;

    // Check if the variables is empty
    if (notContainsValue(id) || notContainsValue(verificationCode)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code is required.",
        });
        return;
    }

    // Check if the verifaction code length is actually 6
    if (verificationCode.length !== 6) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code must be in correct length.",
        });
        return;
    }

    redisClient.connect();

    // Check if the verification code same as stored in redis
    const code = await redisClient.get(id);

    // if (error) {
    //     res.status(500).json({
    //         endpoint: req.originalUrl,
    //         status: "500 - Internal Server Error",
    //         message:
    //             "Verification code cannot be retrieved due to internal error.",
    //     });
    //     return;
    // }

    if (!code) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Verification code is not found.",
        });
        return;
    }

    if (code !== verificationCode) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Verification code is incorrect.",
        });
        return;
    }

    // Delete the key and value of otp, if it is matched
    redisClient.del(id);

    redisClient.quit();

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Verification code is correct.",
    });
});

// 9- POST api/auth/forgot-password/new-password
router.post("/forgot-password/new-password", async (req, res) => {
    const { email, newpassword, confirmnewpassword } = req.body;

    // Check if the variables is empty
    if (
        notContainsValue(email) ||
        notContainsValue(newpassword) ||
        notContainsValue(confirmnewpassword)
    ) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email, New Password and Confirm password is required.",
        });
        return;
    }

    // Check if the email is valid
    if (!regexemail.test(email)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Email is not valid",
        });
        return;
    }

    // Check if the password meets the requirements
    if (!regexpassword.test(newpassword)) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message:
                "Password is not valid. Password must contains at least one lowercase letter, one uppercase letter and one number. Password must also has a minimum length of 8 characters.",
        });
        return;
    }

    // Check if the confirm password matches to password
    if (confirmnewpassword !== newpassword) {
        res.status(400).json({
            endpoint: req.originalUrl,
            status: "400 - Bad Request",
            message: "Confirm password does not match!",
        });
        return;
    }

    // Check if the email is already exists
    const userExistsEmail = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // The response if the email not exists
    if (!userExistsEmail) {
        res.status(404).json({
            endpoint: req.originalUrl,
            status: "404 - Not Found",
            message: "Email is not found.",
        });
        return;
    }

    // Generate a salt, random bytes that will mix with hashed password
    const salt = randomBytes(64).toString("hex");
    // Hash the password, and mix it with the salt
    const hashedPassword = scryptSync(newpassword, salt, 64).toString("hex");

    // Store new password for this user
    const updatedUserPaswd = await prisma.user.update({
        where: {
            email: email,
        },
        data: {
            password: `${salt}.${hashedPassword}`,
        },
    });

    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "New password successfully applied. Login to continue.",
        data: updatedUserPaswd,
    });
});

// 10- DELETE /api/auth/logout
router.delete("/logout", async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(204).json({
        endpoint: req.originalUrl,
        status: "204 - No Content",
        message: "Logout successful. Redirected to login page.",
    });
});

// 11- PATCH /api/auth/validate-token
router.patch("/validate-token", checkToken, (req, res) => {
    res.status(200).json({
        endpoint: req.originalUrl,
        status: "200 - Ok",
        message: "Token validated.",
        data: {
            refreshToken: req.refreshToken,
        },
    });
});

module.exports = router;
