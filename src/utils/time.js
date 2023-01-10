const ISOAfterMin = (mins) => {
  return new Date(new Date().getTime() + mins * 60000).toISOString();
};

module.exports = {
  ISOAfterMin,
};
