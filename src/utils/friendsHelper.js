async function getFriends(user) {
  await user.populate("friends").execPopulate();
  return user.friends;
}

module.exports = {
  getFriends,
};
