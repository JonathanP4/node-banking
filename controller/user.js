const { User } = require("../model/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const fs = require("fs");
const crypto = require("crypto");

let token;

exports.getLogin = (req, res, next) => {
    res.render("user/login", { title: "Login", message: "" });
};

exports.getSignup = (req, res, next) => {
    const prevInput = {
        email: "",
        password: "",
    };
    res.render("user/signup", { title: "Signup", message: "", prevInput });
};

exports.getAccount = async (req, res, next) => {
    const currentUser = req.session.currentUser;
    const user = await User.findOne({ email: currentUser.email });

    res.render("user/account", {
        title: "Your Account",
        account: user.account,
        message: "",
        username: currentUser.account.username,
        csrfToken: token,
    });
};

exports.getTransactions = async (req, res, next) => {
    const currentUserEmail = req.session.currentUser.email;
    const user = await User.findOne({ email: currentUserEmail });

    const transactions = user.account.transactions;

    res.render("user/transactions", { title: "Transactions", transactions });
};

exports.postSignup = async (req, res, next) => {
    const result = validationResult(req);
    const email = req.body.email;
    const password = req.body.password;

    if (!result.isEmpty()) {
        console.error(result.array());
        const message = result.array()[0].msg;
        const prevInput = req.body;
        return res.render("user/signup", {
            title: "Signup",
            message,
            prevInput,
        });
    }

    const account = {
        balance: 0,
        transactions: [],
        profile_picture: "/images/placeholder.jpg",
        username: email,
    };

    const newUser = new User({
        email,
        password: await bcrypt.hash(password, 12),
        account,
    });

    await newUser.save();

    res.redirect("/user/login");
};

exports.postLogin = async (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const message = result.array()[0].msg;
        return res.render("user/login", { title: "Login", message });
    }

    const user = await User.findOne({ email: req.body.email });
    token = crypto.randomUUID();
    req.session.isAuth = true;
    req.session.currentUser = user;

    res.redirect("/user/account");
};

exports.postLogout = async (req, res, next) => {
    await req.session.destroy();
    return res.redirect("/");
};

exports.postTransaction = async (req, res) => {
    if (req.body._csrf !== token || !req.body._csrf) {
        req.flash("error", "Access Denied: unathourized operation");
        return res.redirect("/");
    }

    const currentUserEmail = req.session.currentUser.email;
    const email = req.body.email;
    const value = +req.body.value;

    if (email === currentUserEmail) {
        req.flash("error", "You may not transfer money to yourself");
        return res.redirect("/user/account");
    }

    const user = await User.findOne({ email: email });

    if (!user) {
        return req.flash("error", "User does not exist");
    }

    const Now = new Date();

    const currentUser = await User.findOne({ email: currentUserEmail });

    const updatedTransactions = [...currentUser.account.transactions];

    updatedTransactions.unshift({
        to: email,
        date: `${Now.getUTCMonth() + 1}/${Now.getDate()}/${Now.getFullYear()}`,
        time: `${Now.getHours()}:${Now.getMinutes()}`,
        value: value || 0,
    });

    currentUser.account.transactions = updatedTransactions;

    currentUser.account.balance -= value;
    user.account.balance += value;

    await currentUser.save();
    await user.save();

    res.redirect("/user/account");
};

exports.getProfile = (req, res, next) => {
    const user = req.session.currentUser.account;
    res.render("user/profile", { title: "Your Profile", message: "", user });
};

exports.postProfile = async (req, res, next) => {
    const currentUser = req.session.currentUser;
    const result = validationResult(req);
    const image = req.file;

    if (!image) {
        return res.render("user/profile", {
            title: "Your Profile",
            message: "Attached file must be an image",
            user: currentUser.account,
        });
    }

    if (!result.isEmpty()) {
        return res.render("user/profile", {
            title: "Your Profile",
            message: "",
            user: currentUser.account,
        });
    }

    const user = await User.findOne({ email: currentUser.email });

    if (req.file.path !== "images/placeholder.jpg")
        fs.unlink(req.body.old_pic, (err) => {
            if (err) throw new Error(err);
        });

    user.account.profile_picture = req.file.path;
    user.account.username = req.body.username;

    req.session.currentUser = user;
    res.locals.pfp = user.account.profile_picture;

    await user.save();

    res.redirect("/user/profile");
};
