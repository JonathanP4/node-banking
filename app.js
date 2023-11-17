const path = require("path");

const cookieParser = require("cookie-parser");

const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const { User } = require("./model/user");

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const bodyParser = require("body-parser");

const bankRoutes = require("./routes/bank");
const userRoutes = require("./routes/user");

require("dotenv").config();

const app = express();
const URI = process.env.URI;

const store = MongoStore.create({
    mongoUrl: URI,
    collectionName: "sessions",
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix =
            new Date().getHours() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                "." +
                file.mimetype.split("/")[1]
        );
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/webp"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");

app.use(
    session({
        secret: "Nyan",
        resave: false,
        saveUninitialized: false,
        store,
    })
);

app.use(
    flash({
        sessionKeyName: "express-flash-message",
    })
);

app.use(multer({ storage, fileFilter }).single("image"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("secret cookie data"));

app.use(express.static(path.join(require.main.filename, "..", "public")));
app.use(
    "/images",
    express.static(path.join(require.main.filename, "..", "images"))
);

// app.use functions without a specified path will run on every request, usefull if you want to
// access a value on every request but for this to work it MUST be ON TOP of ANY OTHER REQUEST
app.use(async (req, res, next) => {
    // isAuth is now avaliable on every view thanks to res.locals
    res.locals.isAuth = req.session.isAuth;

    if (req.session.currentUser) {
        const user = await User.findOne({
            email: req.session.currentUser.email,
        });
        res.locals.pfp = user.account.profile_picture;
    } else {
        res.locals.pfp = "/images/placeholder.jpg";
    }

    next();
});

app.use("/user", userRoutes);
app.use(bankRoutes);

(async function main() {
    try {
        await mongoose.connect(URI);
        app.listen(3000, () => console.log("Server running on port 3000"));
    } catch (err) {
        console.log(err);
    }
})();
