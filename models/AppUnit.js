const { model, Schema } = require("mongoose");

// a unit is a like a user, by app unit one can access endpoints in.
const AppUnitSchema = new Schema({
  // a generated uuid of this unit.
  // client id
  client_uid: {
    type: String,
    required: true,
  },
  // hashed client secret.
  client_secret: {
    type: String,
    required: true,
  },

  // a user given name for this app unit
  client_name: {
    trim: true,
    type: String,
    required: true,
  },

  // where we should redirect the code after the grant
  redirect_uri: {
    trim: true,
    type: String,
    required: true,
  },

  // any home page for the client
  home_page_url: {
    trim: true,
    type: String,
    required: true,
  },

  // status of this app unit
  // 'A' means active,'D' means this app unit is deleted and can not be used
  app_unit_status: {
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
    type : String,
    enum : ["web"]
  },
  // status of this app unit
  // 'A' means active, 'R' means revoked,
  token_status: {
    type: String,
    enum: ["A", "R"],
    required: true,
  },
  temp_code :{
    type : String,
  }
});

AppUnitSchema.set("timestamps", true);
const AppUnit = model("AppUnit", AppUnitSchema);

// usage of api will get stored here.
const ApiUsageSchema = new Schema({
  organization_id: {
    type: Schema.Types.ObjectId,
    trim: true,
    ref: "Organization",
    required: [true, "Enter a valid organization id"],
  },
  // start day of the duration, usually start of a weekly
  start_date: {
    index: true,
    type: Date,
    required: true,
  },
  // end of weekly
  end_date: {
    index: true,
    type: Date,
    required: true,
  },
  // how much is used, increment with every count.
  usage: {
    type: Number,
    required: true,
  },
  // amount of api call that can be used over this time period, we will decrease/increase only if api purchase is done.
  usage_quota: {
    type: Number,
    required: true,
  },
});



ApiUsageSchema.set("timestamps", true);
// ApiUsageSchema.
const ApiUsage = model("ApiUsage", ApiUsageSchema);

// exports.
module.exports = { AppUnit, ApiUsage };
