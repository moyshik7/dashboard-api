module.exports = (app) => {
  app.route("/bot/guild", (req, res) => {
    let a = req.query;
    res.send(a);
  });
};
