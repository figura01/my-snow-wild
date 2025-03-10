import express, { Response } from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.get("/", (_, res) => {
  res.send("Hello World!");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(path.join(__dirname, "../uploads/"));
    cb(null, path.join(__dirname, "../uploads/"))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req: any, res: Response) => {
  fs.readFile(req.file.path, (err) => {
    if (err) {
      console.log("Error: ", err);
      res.status(500).json({ error: err });
    } else {
      console.log('response images:', res)
      res
        .status(201)
        .json({ status: "success", filename: "/uploads/" + req.file.filename });
    }
  });
});

app.get("/files/:filename", (req, res) => {
  let file = path.join(__dirname + "/../uploads", req.params.filename);
  console.log("file", file);
  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text" });
      res.write("File Not Found!");
      res.end();
    } else {
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      res.write(content);
      res.end();
    }
  });
});

app.listen(port, () => {
  console.log(`Service d'image écoute sur : ${port}`);
});