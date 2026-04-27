module.exports = (req, res) => {
  if (req.method === 'POST') {
    return res.status(200).json({ status: "POST worked!", body: req.body });
  }
  res.status(200).json({ status: "API is alive", method: req.method });
};
