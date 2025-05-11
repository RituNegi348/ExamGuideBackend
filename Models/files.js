const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }
});

const SemesterSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  subjects: [SubjectSchema]
});

const filesSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  semesters: [SemesterSchema]
});

const Files = mongoose.model("Files", filesSchema);

module.exports = Files;
