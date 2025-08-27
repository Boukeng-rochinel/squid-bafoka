const home = async (req, res) => {
    res.status(200).send("Hey voici le serveur")
};

module.exports = {
    home
};