const express = require("express");
const app = express();
const User = require("./Models/user");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const  Files = require("./Models/files")
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


const salt = bcrypt.genSaltSync(10);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'study_materials',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'] 
  }
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: 'https://exam-guide-frontend.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(err);
})


app.get('/', (req, res) => {
    res.send("Hello World");
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message: "User not found"});
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if(!isPasswordValid){
        return res.status(400).json({message: "Invalid password"});
    }
    const token = jwt.sign({id: user._id, username: user.username, email: user.email}, process.env.JWT_SECRET, {expiresIn: "1d"});
    res.status(200).cookie("authToken", token, {sameSite: "none", secure: true}).json(user);
})

app.post('/register', async (req, res) => {
    const {username, password, email} = req.body;
    if(!username || !password || !email){
        return res.status(400).json({message: "All fields are required"});
    }
    const existingUser = await User.findOne({username});
    if(existingUser){
        return res.status(400).json({message: "User already exists"});
    }
    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = await User.create({username, password: hashedPassword, email});
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"});
    res.status(200).cookie("authToken", token, {sameSite: "none", secure: true}).json(user);
})


app.get('/checkLoggedIn', async (req, res) => {
    const token = req.cookies.authToken;
    if(!token){
        return res.status(401).json({message: "Unauthorized"});
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if(err) return res.status(403).json({message: "Forbidden"});
        const user = await User.findById(decoded.id);
        res.status(200).json(user);
    })
})

app.get('/getFiles', async(req, res)=>{
    const data = await Files.find();
    res.status(200).json(data);
})

app.post('/logout',async(req,res)=>{
    res.status(200).clearCookie("authToken",{
      httpOnly: true,
      secure: true,
      sameSite: "lax"
    }).json({message:"logout successful"});
})


app.post('/upload', upload.single('file'), async (req, res) => {
  try {
   
    const { courseName, semester, name } = req.body;
    
    if (!req.file || !courseName || !semester || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

  
    let fileDoc = await Files.findOne({ courseName });
    
    if (!fileDoc) {
      fileDoc = await Files.create({
        courseName,
        semesters: []
      });
    }
 
    let semesterDoc = fileDoc.semesters.find(s => s.semester === parseInt(semester));
    
    if (!semesterDoc) {
      fileDoc.semesters.push({
        semester: parseInt(semester),
        subjects: []
      });
      semesterDoc = fileDoc.semesters[fileDoc.semesters.length - 1];
    }
 
    semesterDoc.subjects.push({
      name: name,
      url: req.file.path 
    });

    console.log(5);
    await fileDoc.save();
    console.log(6);
    
    const allFiles = await Files.find();
    console.log(7);
    res.status(200).json(allFiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});


app.listen(4000, () => {
    console.log("Server is running on port 4000");
  });



