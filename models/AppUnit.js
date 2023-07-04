const { model, Schema } = require("mongoose");

// a unit is a like a user, by app unit one can access endpoints in.
const AppUnitSchema = new Schema({
  organization_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  client_uid: {
    type: String,
    required: true,
  },

  client_secret: {
    type: String,
    required: true,
  },

  client_name: {
    trim: true,
    type: String,
    required: true,
  },

  redirect_uri: {
    trim: true,
    type: String,
    required: true,
  },

  client_unit_status: {
    type: String,
    enum: ["A", "D"],
    required: true,
  },

  access_token: {
    type: String,
    required: false,
  },
  refresh_token: {
    type: String,
    required: false,
  },
  client_type: {
    type: String,
    enum: ["self"],
  },

  token_status: {
    type: String,
    enum: ["A", "R"],
    required: true,
  },

  scope: [
    {
      type: String,
      required: false,
      _id: false,
    },
  ],
});

AppUnitSchema.set("timestamps", true);
const AppUnit = model("AppUnit", AppUnitSchema);

module.exports = { AppUnit };
