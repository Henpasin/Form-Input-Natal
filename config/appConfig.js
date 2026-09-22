const appConfig = {
  port: Number(process.env.PORT || 3000),
  rsvp: {
    limit: Number(process.env.RSVP_LIMIT || 1200),
    deadline: process.env.RSVP_DEADLINE || "2026-12-20T23:59:59+07:00",
  },
};

module.exports = appConfig;
