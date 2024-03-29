const mongoose = require("mongoose");
const { DateTime } = require("luxon")
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
   first_name: { type: String, required: true, maxLength: 100 },
   family_name: { type: String, required: true, maxLength: 100 },
   date_of_birth: { type: Date },
   date_of_death: { type: Date },
});

AuthorSchema.virtual("name").get(function() {
   let fullname = "";
   if (this.first_name && this.family_name) {
      fullname = `${this.family_name}, ${this.first_name}`;
   }
   if (!this.first_name || !this.family_name) {
      fullname = "";
   }
   return fullname;
});

AuthorSchema.virtual("url").get(function () {
   return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("p_dob").get(function() {
   return DateTime.fromJSDate(this.date_of_birth).toISODate();
})

AuthorSchema.virtual("p_dod").get(function() {
   return DateTime.fromJSDate(this.date_of_death).toISODate();
})

AuthorSchema.virtual("pretty_dob").get(function() {
   let dob = this.date_of_birth == null ? "Not Born!" : DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_SHORT);
   let dod = this.date_of_death == null ? "Not Dead?!" :DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_SHORT);
   
   return dob + '-' + dod;
})

module.exports = mongoose.model("Author", AuthorSchema);