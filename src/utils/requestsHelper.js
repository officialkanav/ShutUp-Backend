async function getPendingRequests(user) {
  await user.populate("reqReceived").execPopulate();
  return user.reqReceived;
}

async function getSentRequests(user) {
  await user.populate("reqSent").execPopulate();
  return user.reqSent;
}

module.exports = {
  getPendingRequests,
  getSentRequests,
};
