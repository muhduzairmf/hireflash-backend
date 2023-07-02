const express = require("express");
// const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        credentials: true,
    },
});
const port = process.env.PORT || 3000;

dotenv.config();

app.use(express.json());
// app.use(cookieParser());
app.use(
    cors({
        credentials: true,
    })
);

/**
{
    status: number,
    message: string,
    data: []
}
*/

/**
HTTP Status Code
200 - Ok : read, delete, update
201 - Created : create
204 - No Content : logout
400 - Bad Request : takde password utk login
401 - Unauthorized
403 - Forbidden
404 - Not Found : tak jumpa
409 - Conflict : email dah ada
500 - Internal Server Error : database error, server down
*/

// Uncomment this only for development purposes
// app.use((req, res, next) => {
//     console.log(
//         `[${new Date().getDate()}/${new Date().getMonth()}/${new Date().getFullYear()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:${new Date().getMilliseconds()}] ${
//             req.method
//         } ${req.originalUrl}`
//     );
//     console.log(req.body);
//     console.log("***************************************************");

//     next();
// });

// app.get("/test-cookie", (req, res) => {
//     res.cookie("helloworld", "helloworld", { sameSite: "none", secure: true });
//     res.json({ status: "ok" });
// });

app.use("/api/applicant", require("./routes/applicant"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/candidate-profile", require("./routes/candidateProfile"));
app.use("/api/company", require("./routes/company"));
app.use("/api/education", require("./routes/education"));
app.use("/api/job", require("./routes/job"));
app.use("/api/lang-ability", require("./routes/langAbility"));
app.use("/api/message", require("./routes/message"));
app.use("/api/notification", require("./routes/notification"));
app.use("/api/officer", require("./routes/officer"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/shortlisted-candidate", require("./routes/shortlistedCandidate"));
app.use("/api/skill", require("./routes/skill"));
app.use("/api/successful-candidate", require("./routes/successfulCandidate"));
app.use("/api/user", require("./routes/user"));
app.use("/api/work-experience", require("./routes/workExperience"));

// WebSocket connection for real-time messages
io.on("connection", (socket) => {
    socket.on("chat", (message) => {
        io.emit("chat", message);
    });
});

app.all("/*", (req, res) => {
    res.status(404).json({
        status: "404 - Not Found",
        message: "API endpoint not exists!",
    });
});

httpServer.listen(Number(port), "0.0.0.0", () => {
    console.log(`Listening on port http://localhost:${port}`);
});
