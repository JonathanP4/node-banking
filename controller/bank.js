exports.getIndex = (req, res) => {
    const [message] = req.flash("error");
    res.render("bank/index", { title: "Node Banking", message });
};

exports.getAbout = (req, res) => {
    res.render("bank/about", { title: "Node Banking | About" });
};

exports.getContact = (req, res) => {
    res.render("bank/contact", { title: "Node Banking | Contact" });
};
