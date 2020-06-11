exports.reduceUserDetails = (body) => {
  let userDetails = {};

  if (body.bio && body.bio.trim() !== "") userDetails.bio = body.bio;

  if (body.website && body.website.trim() !== "") {
    if (body.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${body.website.trim()}`;
    } else userDetails.website = body.website;
  }

  if (body.location && body.location.trim() !== "")
    userDetails.location = body.location;

  return userDetails;
};
