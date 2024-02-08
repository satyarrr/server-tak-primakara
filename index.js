const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const supabaseUrl = "https://cqovamdnptamfeftpvml.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb3ZhbWRucHRhbWZlZnRwdm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY3ODI0ODksImV4cCI6MjAyMjM1ODQ4OX0.br1jhVfkA9kbsfqda5-H2DNo2FE1Kwr6DehnrQ0LHWc";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const upload = multer();
const bodyParser = require("body-parser");
const { log } = require("console");

app.use(cors());
// // Agar bisa menerima payload berupa JSON
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const user_id = req.body.user_id; // Anda mungkin perlu menambahkan field userId di form front-end
    const filePath = `${user_id}/${uuidv4()}_${file.originalname}`;

    const { data, error } = await supabase.storage
      .from("certificates")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw error;
    }
    const {
      data: { publicUrl },
      error: urlError,
    } = supabase.storage.from("certificates").getPublicUrl(filePath);

    const { data: insertedCertificate, error: dbError } = await supabase
      .from("certificates")
      .insert({
        user_id: user_id,
        // title,
        file_path: publicUrl,
        // status,
        // tag_id: tag_id,
      });

    if (dbError) {
      throw new Error(`Error inserting to database: ${dbError.message}`);
    }
    if (urlError) {
      throw new Error(`Error getting file URL: ${urlError.message}`);
    }

    res
      .status(200)
      .json({ success: true, data: { publicUrl }, insertedCertificate });
    console.log({ publicUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// app.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }
//     const file = req.file;

//     // TODO : Fix filename so gak ditimpa
//     const fileExtension = file.mimetype.split("/")[1];
//     const fileName = `${generateUniqueId()}.${fileExtension}`;
//     const { user_id, title, status, tag_id } = req.body;
//     const filePath = `${user_id}/${fileName}`;

//     // Cari cara agar file yang di upload bukan text
//     const { data, error: uploadError } = await supabase.storage
//       .from("certificates")
//       .upload(filePath, file.buffer, {
//         upsert: false,
//         contentType: "image/webp",
//       });

//     console.log(data, filePath);

//     if (uploadError) {
//       console.log(uploadError);
//       throw new Error(`Error uploading file: ${uploadError.message}`);
//     }

//     const {
//       data: { publicUrl },
//       error: urlError,
//     } = supabase.storage.from("certificates").getPublicUrl(filePath);

//     if (urlError) {
//       throw new Error(`Error getting file URL: ${urlError.message}`);
//     }

//     const { data: insertedCertificate, error: dbError } = await supabase
//       .from("certificates")
//       .insert({
//         user_id: user_id,
//         title,
//         file_path: publicUrl,
//         status,
//         tag_id: tag_id,
//       });

//     if (dbError) {
//       throw new Error(`Error inserting to database: ${dbError.message}`);
//     }
//     res.status(200).send({
//       message: "File uploaded successfully",
//       data: insertedCertificate,
//     });
//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });
app.get("/tags", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tags").select("*");

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
